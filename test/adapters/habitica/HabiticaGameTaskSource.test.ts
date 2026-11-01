import { describe, expect, it } from 'vitest';
import { HabiticaClient } from '../../../src/adapters/habitica/HabiticaClient';
import { HabiticaGameTaskSource } from '../../../src/adapters/habitica/HabiticaGameTaskSource';
import { TaskSourceError } from '../../../src/ports/TaskSourceError';
import { FakeHttp, respond, type FakeOutcome } from './FakeHttp';

const TOKEN = 'secret-token-0000-4000-8000-123456789abc';
const BASE = 'https://habitica.com/api/v3';
const TAGS_URL = `${BASE}/tags`;
const DAILYS_URL = `${BASE}/tasks/user?type=dailys`;
const TODOS_URL = `${BASE}/tasks/user?type=todos`;
const COMPLETED_URL = `${BASE}/tasks/user?type=completedTodos`;
const envelope = (data: unknown): FakeOutcome => respond(200, { success: true, data });

function setup(outcomes: Partial<Record<'tags' | 'dailys' | 'todos' | 'completed', FakeOutcome>> = {}) {
	const http = new FakeHttp()
		.on(TAGS_URL, outcomes.tags ?? envelope([{ id: 'tag-lector', name: 'skill/lector' }, { id: 'tag-area', name: 'Work' }]))
		.on(DAILYS_URL, outcomes.dailys ?? envelope([{ id: 'd1', text: 'Stretch', type: 'daily', completed: true, streak: 3, tags: [] }]))
		.on(TODOS_URL, outcomes.todos ?? envelope([{ id: 't1', text: 'Open one', type: 'todo', completed: false, tags: ['tag-lector'] }]))
		.on(COMPLETED_URL, outcomes.completed ?? envelope([{ id: 't2', text: 'Done one', type: 'todo', completed: true, dateCompleted: '2026-11-02T20:00:00.000Z', tags: ['tag-lector'] }]));
	const client = new HabiticaClient(http.send, () => ({ userId: 'user-1', apiToken: TOKEN }));
	return { http, source: new HabiticaGameTaskSource(client) };
}

describe('HabiticaGameTaskSource.fetchObservations', () => {
	it('reads the tags, the dailies, the open to-dos and the completed to-dos, in that order', async () => {
		const { http, source } = setup();

		await source.fetchObservations('2026-11-03');

		expect(http.requests.map((request) => request.url)).toEqual([TAGS_URL, DAILYS_URL, TODOS_URL, COMPLETED_URL]);
	});

	it('returns the observations with the skills read from the skill/<id> tags', async () => {
		const { source } = setup();

		const tasks = await source.fetchObservations('2026-11-03');

		expect(tasks.map((task) => [task.habiticaId, task.kind, task.completed, task.date, task.skills, task.streak])).toEqual([
			['d1', 'daily', true, '2026-11-03', [], 3],
			['t1', 'todo', false, '2026-11-03', ['lector'], null],
			['t2', 'todo', true, '2026-11-02', ['lector'], null],
		]);
	});

	it('spends no second request after a failure', async () => {
		const { http, source } = setup({ tags: respond(401, {}) });

		await expect(source.fetchObservations('2026-11-03')).rejects.toMatchObject({ kind: 'Unauthorized' });
		expect(http.requests).toHaveLength(1);
	});

	it.each([
		['the tags', { tags: envelope('nope') }],
		['the dailies', { dailys: envelope({}) }],
		['the to-dos', { todos: envelope([{ text: 'no id' }]) }],
	])('rejects as Unknown when %s have an unexpected shape', async (_label, outcomes) => {
		const { source } = setup(outcomes);

		await expect(source.fetchObservations('2026-11-03')).rejects.toMatchObject({ kind: 'Unknown' });
	});

	it('rejects only with TaskSourceError and never echoes the token', async () => {
		const { source } = setup({ dailys: new Error(`boom ${TOKEN}`) });

		const error: unknown = await source.fetchObservations('2026-11-03').then(
			() => null,
			(reason: unknown) => reason,
		);

		expect(error).toBeInstanceOf(TaskSourceError);
		expect(String((error as Error).message)).not.toContain(TOKEN);
	});
});
