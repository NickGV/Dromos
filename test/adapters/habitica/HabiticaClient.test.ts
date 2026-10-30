import { describe, expect, it } from 'vitest';
import { HabiticaClient } from '../../../src/adapters/habitica/HabiticaClient';
import { TaskSourceError } from '../../../src/ports/TaskSourceError';
import { FakeHttp, respond, type FakeOutcome } from './FakeHttp';

const USER_ID = '00000000-0000-4000-8000-000000000000';
const TOKEN = 'secret-token-0000-4000-8000-123456789abc';
const URL = 'https://habitica.com/api/v3/tasks/user?type=dailys';

function clientWith(outcome: FakeOutcome): { client: HabiticaClient; http: FakeHttp } {
	const http = new FakeHttp().on(URL, outcome);
	const client = new HabiticaClient(http.send, () => ({ userId: USER_ID, apiToken: TOKEN }));
	return { client, http };
}

async function failureOf(outcome: FakeOutcome): Promise<TaskSourceError> {
	const error: unknown = await clientWith(outcome).client.get('/tasks/user?type=dailys').then(
		() => null,
		(reason: unknown) => reason,
	);
	if (!(error instanceof TaskSourceError)) throw new Error(`expected a TaskSourceError, got ${String(error)}`);
	return error;
}

describe('HabiticaClient: requests (S4)', () => {
	it('sends a GET to the API v3 URL with the required headers', async () => {
		const { client, http } = clientWith(respond(200, { success: true, data: [] }));

		await client.get('/tasks/user?type=dailys');

		expect(http.requests).toEqual([
			{
				url: URL,
				method: 'GET',
				headers: { 'x-api-user': USER_ID, 'x-api-key': TOKEN, 'x-client': `${USER_ID}-dromos` },
			},
		]);
	});

	it('reads the credentials on every request, so settings changes apply', async () => {
		const http = new FakeHttp().on(URL, respond(200, { success: true, data: [] }));
		let userId = 'first-user';
		const client = new HabiticaClient(http.send, () => ({ userId, apiToken: TOKEN }));

		await client.get('/tasks/user?type=dailys');
		userId = 'second-user';
		await client.get('/tasks/user?type=dailys');

		expect(http.requests.map((request) => request.headers['x-api-user'])).toEqual(['first-user', 'second-user']);
	});

	it("unwraps Habitica's { success, data } envelope", async () => {
		const data = [{ id: 'task-1' }];
		const { client } = clientWith(respond(200, { success: true, data, notifications: [], userV: 1 }));

		await expect(client.get('/tasks/user?type=dailys')).resolves.toEqual(data);
	});
});

describe('HabiticaClient: typed errors (S5)', () => {
	it('maps a network failure to Offline', async () => {
		const error = await failureOf(new Error('net::ERR_INTERNET_DISCONNECTED'));

		expect(error.kind).toBe('Offline');
		expect(error.retryAfterSeconds).toBeNull();
	});

	it('maps 401 to Unauthorized', async () => {
		const error = await failureOf(respond(401, { success: false, error: 'NotAuthorized', message: 'Missing authentication headers.' }));

		expect(error.kind).toBe('Unauthorized');
	});

	it('maps 429 to RateLimited with the Retry-After seconds, whatever the header case', async () => {
		const lower = await failureOf(respond(429, { success: false, error: 'TooManyRequests' }, { 'retry-after': '42' }));
		const upper = await failureOf(respond(429, { success: false, error: 'TooManyRequests' }, { 'Retry-After': '7' }));

		expect([lower.kind, lower.retryAfterSeconds]).toEqual(['RateLimited', 42]);
		expect([upper.kind, upper.retryAfterSeconds]).toEqual(['RateLimited', 7]);
	});

	it('maps 429 without a usable Retry-After to RateLimited with null seconds', async () => {
		const missing = await failureOf(respond(429, { success: false, error: 'TooManyRequests' }));
		const unreadable = await failureOf(respond(429, null, { 'Retry-After': 'soon' }));

		expect([missing.kind, missing.retryAfterSeconds]).toEqual(['RateLimited', null]);
		expect([unreadable.kind, unreadable.retryAfterSeconds]).toEqual(['RateLimited', null]);
	});

	it('maps any other non-2xx status to Unknown', async () => {
		const serverError = await failureOf(respond(500, { success: false, error: 'InternalServerError' }));
		const notFound = await failureOf(respond(404, { success: false, error: 'NotFound' }));

		expect([serverError.kind, notFound.kind]).toEqual(['Unknown', 'Unknown']);
	});

	it('maps success: false and malformed bodies to Unknown', async () => {
		const outcomes = [
			respond(200, { success: false, error: 'BadRequest', message: 'Invalid request.' }),
			respond(200, null),
			respond(200, 'not an envelope'),
			respond(200, { success: true }),
		];

		const kinds = await Promise.all(outcomes.map(async (outcome) => (await failureOf(outcome)).kind));

		expect(kinds).toEqual(['Unknown', 'Unknown', 'Unknown', 'Unknown']);
	});

	it('never puts the token in an error (S9)', async () => {
		const outcomes = [
			new Error(`request failed with x-api-key ${TOKEN}`),
			respond(401, { success: false, message: `Bad key ${TOKEN}` }),
			respond(429, { success: false, message: TOKEN }, { 'Retry-After': '3' }),
			respond(500, { success: false, message: TOKEN }),
			respond(200, { success: false, message: TOKEN }),
		];

		const errors = await Promise.all(outcomes.map(failureOf));

		for (const error of errors) {
			expect(`${error.message} ${String(error)} ${error.stack ?? ''}`).not.toContain(TOKEN);
			expect(Object.values(error).map(String).join(' ')).not.toContain(TOKEN);
		}
	});
});
