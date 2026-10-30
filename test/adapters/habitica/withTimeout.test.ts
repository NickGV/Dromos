import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HabiticaClient } from '../../../src/adapters/habitica/HabiticaClient';
import type { HttpFunction, HttpRequest } from '../../../src/adapters/habitica/http';
import { withTimeout } from '../../../src/adapters/habitica/withTimeout';
import { TaskSourceError } from '../../../src/ports/TaskSourceError';

const REQUEST: HttpRequest = { url: 'https://habitica.com/api/v3/tasks/user?type=dailys', method: 'GET', headers: {} };

describe('withTimeout: a hung request reads as offline', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('rejects a request that does not settle in time, so the client reports Offline', async () => {
		const hanging: HttpFunction = () => new Promise(() => undefined);
		const client = new HabiticaClient(withTimeout(hanging, 15_000), () => ({ userId: 'u', apiToken: 't' }));
		const outcome = client.get('/tasks/user?type=dailys').then(
			() => null,
			(reason: unknown) => reason,
		);
		await vi.advanceTimersByTimeAsync(15_000);
		const error = await outcome;
		expect(error).toBeInstanceOf(TaskSourceError);
		expect((error as TaskSourceError).kind).toBe('Offline');
	});

	it('passes through a response that arrives in time and clears its timer', async () => {
		const ok: HttpFunction = () => Promise.resolve({ status: 200, headers: {}, json: { success: true, data: [] } });
		const response = await withTimeout(ok, 15_000)(REQUEST);
		expect(response.status).toBe(200);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('passes through a network failure and clears its timer', async () => {
		const failing: HttpFunction = () => Promise.reject(new Error('net::ERR_INTERNET_DISCONNECTED'));
		await expect(withTimeout(failing, 15_000)(REQUEST)).rejects.toThrow('net::ERR_INTERNET_DISCONNECTED');
		expect(vi.getTimerCount()).toBe(0);
	});
});
