import { describe, expect, it } from 'vitest';
import { HABITICA_X_CLIENT, HabiticaClient } from '../../../src/adapters/habitica/HabiticaClient';
import { TaskSourceError } from '../../../src/ports/TaskSourceError';
import { FakeHttp, respond, type FakeOutcome } from './FakeHttp';

const USER_URL = 'https://habitica.com/api/v3/user';
const TASK_URL = 'https://habitica.com/api/v3/tasks/reward-1';
const TOKEN = 'secret-token-0000-4000-8000-123456789abc';

function setup(url: string, outcome: FakeOutcome) {
	const http = new FakeHttp().on(url, outcome);
	return { http, client: new HabiticaClient(http.send, () => ({ userId: 'user-1', apiToken: TOKEN })) };
}

async function errorOf(promise: Promise<unknown>): Promise<TaskSourceError> {
	const error: unknown = await promise.then(
		() => null,
		(reason: unknown) => reason,
	);
	if (!(error instanceof TaskSourceError)) throw new Error(`expected a TaskSourceError, got ${String(error)}`);
	return error;
}

describe('HabiticaClient.put (M10 S3)', () => {
	it('sends a JSON body with the Habitica headers and resolves with the envelope data', async () => {
		const { http, client } = setup(USER_URL, respond(200, { success: true, data: { stats: { gp: 40 } } }));

		const data = await client.put('/user', { 'stats.gp': 40 });

		expect(data).toEqual({ stats: { gp: 40 } });
		expect(http.requests).toHaveLength(1);
		expect(http.requests[0]).toMatchObject({ url: USER_URL, method: 'PUT', body: '{"stats.gp":40}' });
		expect(http.requests[0]?.headers).toMatchObject({ 'x-api-user': 'user-1', 'x-api-key': TOKEN, 'x-client': HABITICA_X_CLIENT, 'Content-Type': 'application/json' });
	});

	it('fails with the typed errors, and none of them carries the token', async () => {
		for (const [outcome, kind] of [
			[respond(401, {}), 'Unauthorized'],
			[respond(429, {}, { 'Retry-After': '5' }), 'RateLimited'],
			[respond(400, {}), 'Unknown'],
			[new Error(`down ${TOKEN}`), 'Offline'],
		] as const) {
			const error = await errorOf(setup(USER_URL, outcome).client.put('/user', { 'stats.gp': 1 }));
			expect(error.kind).toBe(kind);
			expect(error.message).not.toContain(TOKEN);
		}
	});
});

describe('HabiticaClient.delete (M10 S2)', () => {
	it('sends no body and resolves with the envelope data', async () => {
		const { http, client } = setup(TASK_URL, respond(200, { success: true, data: {} }));

		expect(await client.delete('/tasks/reward-1')).toEqual({});
		expect(http.requests[0]).toMatchObject({ url: TASK_URL, method: 'DELETE' });
		expect(http.requests[0]?.body).toBeUndefined();
		expect(http.requests[0]?.headers).not.toHaveProperty('Content-Type');
	});

	it('fails with the typed errors', async () => {
		expect((await errorOf(setup(TASK_URL, respond(404, {})).client.delete('/tasks/reward-1'))).kind).toBe('Unknown');
		expect((await errorOf(setup(TASK_URL, new Error('down')).client.delete('/tasks/reward-1'))).kind).toBe('Offline');
	});
});

describe('HabiticaClient.post without a body (M10 S1)', () => {
	it('sends no body and no content type, as scoring a task needs none', async () => {
		const url = 'https://habitica.com/api/v3/tasks/reward-1/score/up';
		const { http, client } = setup(url, respond(200, { success: true, data: { gp: 12 } }));

		await client.post('/tasks/reward-1/score/up');

		expect(http.requests[0]).toMatchObject({ url, method: 'POST' });
		expect(http.requests[0]?.body).toBeUndefined();
		expect(http.requests[0]?.headers).not.toHaveProperty('Content-Type');
	});
});
