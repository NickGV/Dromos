import { describe, expect, it } from 'vitest';
import { HabiticaClient } from '../../../src/adapters/habitica/HabiticaClient';
import { TaskSourceError } from '../../../src/ports/TaskSourceError';
import { FakeHttp, respond, type FakeOutcome } from './FakeHttp';

const URL = 'https://habitica.com/api/v3/tasks/user';
const TOKEN = 'secret-token-0000-4000-8000-123456789abc';

function setup(outcome: FakeOutcome) {
	const http = new FakeHttp().on(URL, outcome);
	return { http, client: new HabiticaClient(http.send, () => ({ userId: 'user-1', apiToken: TOKEN })) };
}

async function kindOf(promise: Promise<unknown>): Promise<string> {
	const error: unknown = await promise.then(
		() => null,
		(reason: unknown) => reason,
	);
	if (!(error instanceof TaskSourceError)) throw new Error(`expected a TaskSourceError, got ${String(error)}`);
	return error.kind;
}

describe('HabiticaClient.post', () => {
	it('sends a JSON body with the Habitica headers and resolves with the envelope data', async () => {
		const { http, client } = setup(respond(201, { success: true, data: { id: 'x' } }));

		const data = await client.post('/tasks/user', { text: 'Task', type: 'todo' });

		expect(data).toEqual({ id: 'x' });
		expect(http.requests).toHaveLength(1);
		expect(http.requests[0]).toMatchObject({ url: URL, method: 'POST', body: '{"text":"Task","type":"todo"}' });
		expect(http.requests[0]?.headers).toMatchObject({
			'x-api-user': 'user-1',
			'x-api-key': TOKEN,
			'x-client': 'user-1-dromos',
			'Content-Type': 'application/json',
		});
	});

	it('fails with the typed errors', async () => {
		expect(await kindOf(setup(respond(401, {})).client.post('/tasks/user', {}))).toBe('Unauthorized');
		expect(await kindOf(setup(respond(429, {}, { 'Retry-After': '5' })).client.post('/tasks/user', {}))).toBe('RateLimited');
		expect(await kindOf(setup(respond(400, {})).client.post('/tasks/user', {}))).toBe('Unknown');
		expect(await kindOf(setup(new Error('down')).client.post('/tasks/user', {}))).toBe('Offline');
	});

	it('does not send a body or a content type on GET', async () => {
		const { http, client } = setup(respond(200, { success: true, data: [] }));

		await client.get('/tasks/user');

		expect(http.requests[0]?.body).toBeUndefined();
		expect(http.requests[0]?.headers).not.toHaveProperty('Content-Type');
	});
});
