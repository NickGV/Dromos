import { describe, expect, it } from 'vitest';
import { HabiticaClient } from '../../../src/adapters/habitica/HabiticaClient';
import { TaskSourceError } from '../../../src/ports/TaskSourceError';
import { FakeHttp, respond, type FakeOutcome } from './FakeHttp';

const URL = 'https://habitica.com/api/v3/tasks/3f2a1c8e-0000-4000-8000-000000000001';
const PATH = '/tasks/3f2a1c8e-0000-4000-8000-000000000001';

function clientWith(outcome: FakeOutcome): HabiticaClient {
	const http = new FakeHttp().on(URL, outcome);
	return new HabiticaClient(http.send, () => ({ userId: 'user', apiToken: 'token' }));
}

async function kindOf(promise: Promise<unknown>): Promise<string> {
	const error: unknown = await promise.then(
		() => null,
		(reason: unknown) => reason,
	);
	if (!(error instanceof TaskSourceError)) throw new Error(`expected a TaskSourceError, got ${String(error)}`);
	return error.kind;
}

describe('HabiticaClient.find', () => {
	it('resolves with the envelope data', async () => {
		const client = clientWith(respond(200, { success: true, data: { id: 'x' } }));

		expect(await client.find(PATH)).toEqual({ id: 'x' });
	});

	it('resolves null on a 404, so a deleted task is not an error', async () => {
		const client = clientWith(respond(404, { success: false, error: 'NotFound' }));

		expect(await client.find(PATH)).toBeNull();
	});

	it('still fails with the typed errors for everything else', async () => {
		expect(await kindOf(clientWith(respond(401, {})).find(PATH))).toBe('Unauthorized');
		expect(await kindOf(clientWith(respond(429, {}, { 'Retry-After': '9' })).find(PATH))).toBe('RateLimited');
		expect(await kindOf(clientWith(respond(500, {})).find(PATH))).toBe('Unknown');
		expect(await kindOf(clientWith(new Error('network down')).find(PATH))).toBe('Offline');
	});

	it('leaves get unchanged: a 404 is still Unknown', async () => {
		const client = clientWith(respond(404, { success: false, error: 'NotFound' }));

		expect(await kindOf(client.get(PATH))).toBe('Unknown');
	});
});
