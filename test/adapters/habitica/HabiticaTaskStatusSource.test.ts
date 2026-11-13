import { describe, expect, it } from 'vitest';
import { HABITICA_X_CLIENT, HabiticaClient } from '../../../src/adapters/habitica/HabiticaClient';
import { HabiticaTaskStatusSource } from '../../../src/adapters/habitica/HabiticaTaskStatusSource';
import { TaskSourceError } from '../../../src/ports/TaskSourceError';
import { FakeHttp, respond, type FakeOutcome } from './FakeHttp';

const TOKEN = 'secret-token-0000-4000-8000-123456789abc';
const BASE = 'https://habitica.com/api/v3';
const TODOS_URL = `${BASE}/tasks/user?type=todos`;
const COMPLETED_URL = `${BASE}/tasks/user?type=completedTodos`;
const DAILIES_URL = `${BASE}/tasks/user?type=dailys`;

const id = (n: number): string => `3f2a1c8e-0000-4000-8000-${String(n).padStart(12, '0')}`;

function todo(taskId: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
	return { id: taskId, _id: taskId, text: `Task ${taskId}`, type: 'todo', completed: false, ...extra };
}

const envelope = (data: unknown): FakeOutcome => respond(200, { success: true, data });

function daily(taskId: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
	return { id: taskId, _id: taskId, text: `Daily ${taskId}`, type: 'daily', completed: false, ...extra };
}

function setup(todos: FakeOutcome = envelope([]), completed: FakeOutcome = envelope([]), dailies: FakeOutcome = envelope([])) {
	const http = new FakeHttp().on(TODOS_URL, todos).on(COMPLETED_URL, completed).on(DAILIES_URL, dailies);
	const client = new HabiticaClient(http.send, () => ({ userId: 'user-1', apiToken: TOKEN }));
	return { http, source: new HabiticaTaskStatusSource(client), client };
}

async function failureOf(promise: Promise<unknown>): Promise<TaskSourceError> {
	const error: unknown = await promise.then(
		() => null,
		(reason: unknown) => reason,
	);
	if (!(error instanceof TaskSourceError)) throw new Error(`expected a TaskSourceError, got ${String(error)}`);
	return error;
}

describe('HabiticaTaskStatusSource.fetchStatuses: lists', () => {
	it('makes no request when there is nothing to look up', async () => {
		const { source, http } = setup();

		expect((await source.fetchStatuses({ todos: [], dailies: [] })).size).toBe(0);
		expect(http.requests).toHaveLength(0);
	});

	it('reads an id in the to-do list as open and one in completedTodos as completed', async () => {
		const { source } = setup(
			envelope([todo(id(1))]),
			envelope([todo(id(2), { completed: true, dateCompleted: '2026-10-30T14:00:00.000Z' })]),
		);

		const statuses = await source.fetchStatuses({ todos: [id(1), id(2)], dailies: [] });

		expect(statuses.get(id(1))).toEqual({ kind: 'open' });
		expect(statuses.get(id(2))).toEqual({ kind: 'completed', completedOn: '2026-10-30' });
	});

	it('converts dateCompleted to the America/Bogota day', async () => {
		const { source } = setup(envelope([]), envelope([todo(id(1), { completed: true, dateCompleted: '2026-10-30T03:00:00.000Z' })]));

		expect((await source.fetchStatuses({ todos: [id(1)], dailies: [] })).get(id(1))).toEqual({ kind: 'completed', completedOn: '2026-10-29' });
	});

	it('keeps a completed task without a date as completed with an unknown date', async () => {
		const { source } = setup(envelope([]), envelope([todo(id(1), { completed: true })]));

		expect((await source.fetchStatuses({ todos: [id(1)], dailies: [] })).get(id(1))).toEqual({ kind: 'completed', completedOn: null });
	});

	it('sends the Habitica headers and spends two requests when every id is on a list', async () => {
		const { source, http } = setup(envelope([todo(id(1))]), envelope([todo(id(2), { completed: true })]));

		await source.fetchStatuses({ todos: [id(1), id(2)], dailies: [] });

		expect(http.requests.map((request) => request.url)).toEqual([TODOS_URL, COMPLETED_URL]);
		expect(http.requests[0]?.headers).toMatchObject({ 'x-api-user': 'user-1', 'x-api-key': TOKEN, 'x-client': HABITICA_X_CLIENT });
	});
});

describe('HabiticaTaskStatusSource.fetchStatuses: ids missing from both lists', () => {
	it('looks the task up by id: completed beyond the 30 most recent, open, or deleted on a 404 (ADR-021)', async () => {
		const { source, http } = setup();
		http.on(`${BASE}/tasks/${id(1)}`, envelope(todo(id(1), { completed: true, dateCompleted: '2026-01-05T15:00:00.000Z' })));
		http.on(`${BASE}/tasks/${id(2)}`, envelope(todo(id(2))));
		http.on(`${BASE}/tasks/${id(3)}`, respond(404, { success: false, error: 'NotFound' }));

		const statuses = await source.fetchStatuses({ todos: [id(1), id(2), id(3)], dailies: [] });

		expect(statuses.get(id(1))).toEqual({ kind: 'completed', completedOn: '2026-01-05' });
		expect(statuses.get(id(2))).toEqual({ kind: 'open' });
		expect(statuses.get(id(3))).toEqual({ kind: 'deleted' });
	});

	it('does not look up ids that a list already answered', async () => {
		const { source, http } = setup(envelope([todo(id(1))]));

		await source.fetchStatuses({ todos: [id(1)], dailies: [] });

		expect(http.requests.map((request) => request.url)).toEqual([TODOS_URL, COMPLETED_URL]);
	});

	it('looks up repeated ids once', async () => {
		const { source, http } = setup();
		http.on(`${BASE}/tasks/${id(1)}`, envelope(todo(id(1))));

		await source.fetchStatuses({ todos: [id(1), id(1)], dailies: [] });

		expect(http.requests.filter((request) => request.url.endsWith(id(1)))).toHaveLength(1);
	});

	it('caps the lookups at 10 per call and leaves the rest unanswered', async () => {
		const { source, http } = setup();
		const ids = Array.from({ length: 12 }, (_, index) => id(index + 1));
		for (const taskId of ids) http.on(`${BASE}/tasks/${taskId}`, envelope(todo(taskId)));

		const statuses = await source.fetchStatuses({ todos: ids, dailies: [] });

		expect(http.requests).toHaveLength(2 + 10);
		expect(statuses.size).toBe(10);
		expect(statuses.has(id(11))).toBe(false);
		expect(statuses.has(id(12))).toBe(false);
	});

	it('reports a malformed id as missing, never deleted, without spending a request on it', async () => {
		const { source, http } = setup();

		const statuses = await source.fetchStatuses({ todos: ['not-a-uuid', '../tasks/user'], dailies: ['daily?'] });

		expect(statuses.get('not-a-uuid')).toEqual({ kind: 'missing' });
		expect(statuses.get('../tasks/user')).toEqual({ kind: 'missing' });
		expect(statuses.get('daily?')).toEqual({ kind: 'missing' });
		expect(http.requests).toHaveLength(0);
	});
});

describe('HabiticaTaskStatusSource.fetchStatuses: failures', () => {
	it('rejects with Unauthorized and spends no second request', async () => {
		const { source, http } = setup(respond(401, { success: false }));

		const error = await failureOf(source.fetchStatuses({ todos: [id(1)], dailies: [] }));

		expect(error.kind).toBe('Unauthorized');
		expect(http.requests).toHaveLength(1);
	});

	it('keeps the retry delay of a 429', async () => {
		const { source } = setup(envelope([]), respond(429, { success: false }, { 'Retry-After': '12' }));

		const error = await failureOf(source.fetchStatuses({ todos: [id(1)], dailies: [] }));

		expect(error).toMatchObject({ kind: 'RateLimited', retryAfterSeconds: 12 });
	});

	it('rejects with Offline when the network fails, also during a lookup', async () => {
		const offline = await failureOf(setup(new Error('down')).source.fetchStatuses({ todos: [id(1)], dailies: [] }));
		expect(offline.kind).toBe('Offline');

		const { source, http } = setup();
		http.on(`${BASE}/tasks/${id(1)}`, new Error('down'));
		expect((await failureOf(source.fetchStatuses({ todos: [id(1)], dailies: [] }))).kind).toBe('Offline');
	});

	it('rejects with Unknown on an unexpected shape, without echoing the token', async () => {
		const { source } = setup(envelope({ not: 'a list' }));

		const error = await failureOf(source.fetchStatuses({ todos: [id(1)], dailies: [] }));

		expect(error.kind).toBe('Unknown');
		expect(error.message).not.toContain(TOKEN);
	});
});

describe('HabiticaTaskStatusSource.fetchStatuses: subtasks (missions S2)', () => {
	const checklist = [
		{ completed: true, text: 'a', id: 'c1' },
		{ completed: false, text: 'b', id: 'c2' },
		{ completed: false, text: 'c', id: 'c3' },
	];

	it('answers the subtasks of a linked to-do, open or completed', async () => {
		const { source } = setup(envelope([todo(id(1), { checklist })]), envelope([todo(id(2), { completed: true, checklist })]));

		const statuses = await source.fetchStatuses({ todos: [id(1), id(2)], dailies: [] });

		expect(statuses.get(id(1))).toEqual({ kind: 'open', checklist: { done: 1, total: 3, items: [{ title: 'a', completed: true }, { title: 'b', completed: false }, { title: 'c', completed: false }] } });
		expect(statuses.get(id(2))).toEqual({ kind: 'completed', completedOn: null, checklist: { done: 1, total: 3, items: [{ title: 'a', completed: true }, { title: 'b', completed: false }, { title: 'c', completed: false }] } });
	});

	it('answers a to-do without subtasks exactly as before', async () => {
		const { source } = setup(envelope([todo(id(1))]));

		expect((await source.fetchStatuses({ todos: [id(1)], dailies: [] })).get(id(1))).toEqual({ kind: 'open' });
	});
});

describe('HabiticaTaskStatusSource.fetchStatuses: dailies, from the list of dailies (ADR-021)', () => {
	it('reads the streak of each linked daily from the one list of dailies, with no lookup', async () => {
		const { source, http } = setup(envelope([]), envelope([]), envelope([daily(id(1), { streak: 12 }), daily(id(2)), daily(id(9), { streak: 4 })]));

		const statuses = await source.fetchStatuses({ todos: [], dailies: [id(1), id(2)] });

		expect(statuses.get(id(1))).toEqual({ kind: 'daily', streak: 12 });
		expect(statuses.get(id(2))).toEqual({ kind: 'daily', streak: 0 });
		expect(statuses.has(id(9))).toBe(false);
		expect(http.requests.map((request) => request.url)).toEqual([DAILIES_URL]);
	});

	it('answers deleted for a linked daily whose id is not in the list of dailies', async () => {
		const { source, http } = setup(envelope([]), envelope([]), envelope([daily(id(1), { streak: 3 })]));

		const statuses = await source.fetchStatuses({ todos: [], dailies: [id(1), id(2)] });

		expect(statuses.get(id(2))).toEqual({ kind: 'deleted' });
		expect(http.requests).toHaveLength(1);
	});

	it('spends one request on any number of dailies, and the lookups only on to-dos', async () => {
		const { source, http } = setup();
		const dailies = Array.from({ length: 15 }, (_, index) => id(100 + index));
		const todos = Array.from({ length: 12 }, (_, index) => id(index + 1));
		for (const taskId of todos) http.on(`${BASE}/tasks/${taskId}`, envelope(todo(taskId)));

		const statuses = await source.fetchStatuses({ todos, dailies });

		expect(http.requests.map((request) => request.url).slice(0, 3)).toEqual([TODOS_URL, COMPLETED_URL, DAILIES_URL]);
		expect(http.requests).toHaveLength(3 + 10);
		expect(dailies.every((taskId) => statuses.get(taskId)?.kind === 'deleted')).toBe(true);
		expect(todos.filter((taskId) => statuses.has(taskId))).toHaveLength(10);
	});

	it('leaves a to-do beyond the lookup budget unanswered: never taken for deleted', async () => {
		const { source, http } = setup();
		const todos = Array.from({ length: 11 }, (_, index) => id(index + 1));
		for (const taskId of todos) http.on(`${BASE}/tasks/${taskId}`, respond(404, { success: false }));

		const statuses = await source.fetchStatuses({ todos, dailies: [] });

		expect(statuses.get(id(10))).toEqual({ kind: 'deleted' });
		expect(statuses.has(id(11))).toBe(false);
	});

	it('asks for no to-do list when only dailies are linked, and for no list of dailies when only to-dos are', async () => {
		const onlyDailies = setup(envelope([]), envelope([]), envelope([daily(id(1))]));
		await onlyDailies.source.fetchStatuses({ todos: [], dailies: [id(1)] });
		expect(onlyDailies.http.requests.map((request) => request.url)).toEqual([DAILIES_URL]);

		const onlyTodos = setup(envelope([todo(id(1))]));
		await onlyTodos.source.fetchStatuses({ todos: [id(1)], dailies: [] });
		expect(onlyTodos.http.requests.map((request) => request.url)).toEqual([TODOS_URL, COMPLETED_URL]);
	});

	it('answers nothing, and so deletes nothing, when the list of dailies fails', async () => {
		const { source } = setup(envelope([]), envelope([]), respond(429, { success: false }, { 'Retry-After': '30' }));

		const error = await failureOf(source.fetchStatuses({ todos: [], dailies: [id(1)] }));

		expect(error).toMatchObject({ kind: 'RateLimited', retryAfterSeconds: 30 });
	});
});
