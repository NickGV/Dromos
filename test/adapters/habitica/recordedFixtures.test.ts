import { beforeAll, describe, expect, it } from 'vitest';
import { HabiticaClient } from '../../../src/adapters/habitica/HabiticaClient';
import { HabiticaGameTaskSource } from '../../../src/adapters/habitica/HabiticaGameTaskSource';
import { HabiticaTaskSource } from '../../../src/adapters/habitica/HabiticaTaskSource';
import { HabiticaTaskStatusSource } from '../../../src/adapters/habitica/HabiticaTaskStatusSource';
import { isMission } from '../../../src/domain';
import type { Clock } from '../../../src/ports/Clock';
import { foreignStrings } from '../../fixtures/habitica/anonymize';
import { FakeHttp, habiticaFixture, respond } from './FakeHttp';

// Responses recorded from the user's account on 2026-11-04 (issue #8): no dailies, 17 open to-dos, one of
// them due that day, and Habitica's 30 most recently completed to-dos. Every id and text is a fake.
const RECORDED_ON = '2026-11-04';
const BASE = 'https://habitica.com/api/v3';
const URLS = {
	tags: `${BASE}/tags`,
	dailys: `${BASE}/tasks/user?type=dailys`,
	todos: `${BASE}/tasks/user?type=todos`,
	completedTodos: `${BASE}/tasks/user?type=completedTodos`,
};

const clock: Clock = { today: () => RECORDED_ON, now: () => new Date('2026-11-04T17:00:00.000Z') };

interface RecordedTask {
	readonly id: string;
	readonly date?: string | null;
	readonly dateCompleted?: string | null;
	readonly priority: number;
}

let recorded: { dailys: unknown; todos: unknown; completedTodos: unknown };

beforeAll(async () => {
	recorded = {
		dailys: await habiticaFixture('recordedDailys'),
		todos: await habiticaFixture('recordedTodos'),
		completedTodos: await habiticaFixture('recordedCompletedTodos'),
	};
});

function tasksOf(fixture: unknown): readonly RecordedTask[] {
	return (fixture as { data: RecordedTask[] }).data;
}

function recordedHabitica(): { client: HabiticaClient; http: FakeHttp } {
	const http = new FakeHttp()
		.on(URLS.tags, respond(200, { success: true, data: [] }))
		.on(URLS.dailys, respond(200, recorded.dailys))
		.on(URLS.todos, respond(200, recorded.todos))
		.on(URLS.completedTodos, respond(200, recorded.completedTodos));
	const client = new HabiticaClient(http.send, () => ({ userId: '00000000-0000-4000-8000-000000000000', apiToken: 'test-token' }));
	return { client, http };
}

function completedAt(timestamp: string): RecordedTask {
	const task = tasksOf(recorded.completedTodos).find((candidate) => candidate.dateCompleted === timestamp);
	if (task === undefined) throw new Error(`no recorded to-do was completed at ${timestamp}`);
	return task;
}

describe('recorded Habitica fixtures (issue #8)', () => {
	it('hold only fakes: no real id or text of the account is in the repo', () => {
		for (const fixture of Object.values(recorded)) expect(foreignStrings(fixture)).toBe(0);
		expect(tasksOf(recorded.dailys)).toHaveLength(0);
		expect(tasksOf(recorded.todos)).toHaveLength(17);
		expect(tasksOf(recorded.completedTodos)).toHaveLength(30);
	});

	it("today's quests: every open to-do, the one due that day first, read as due today in Bogota (issue #9, S2)", async () => {
		const quests = await new HabiticaTaskSource(recordedHabitica().client, clock).fetchToday();
		const dueThatDay = tasksOf(recorded.todos).find((task) => task.date);

		// Habitica stored the to-do the user set due on 2026-11-04 at midnight in Bogota.
		expect(dueThatDay?.date).toBe('2026-11-04T05:00:00.000Z');
		expect(quests).toHaveLength(17);
		expect(quests[0]).toMatchObject({ id: dueThatDay?.id, type: 'todo', dueDate: RECORDED_ON, dueToday: true });
		expect(quests.slice(1).every((quest) => quest.type === 'todo' && quest.dueDate === null && !quest.dueToday)).toBe(true);
		expect(new Set(quests.map((quest) => quest.id))).toEqual(new Set(tasksOf(recorded.todos).map((task) => task.id)));
	});

	it("today's quests carry their subtasks: 7 of the 17 recorded to-dos have 3 or more, so they read as missions (missions S1)", async () => {
		const quests = await new HabiticaTaskSource(recordedHabitica().client, clock).fetchToday();

		expect(quests.filter((quest) => quest.checklist !== undefined)).toHaveLength(11);
		expect(quests.filter((quest) => isMission(quest.checklist))).toHaveLength(7);
	});

	it('game observations: open to-dos dated today, completed ones dated with their Bogota completion day', async () => {
		const observations = await new HabiticaGameTaskSource(recordedHabitica().client).fetchObservations(RECORDED_ON);
		const lateEvening = completedAt('2026-11-01T00:36:14.831Z');

		expect(observations).toHaveLength(47);
		expect(observations.filter((task) => !task.completed).every((task) => task.date === RECORDED_ON)).toBe(true);
		// Completed at 19:36 on October 31 in Bogota, after midnight UTC.
		expect(observations.find((task) => task.habiticaId === lateEvening.id)).toMatchObject({ kind: 'todo', completed: true, date: '2026-10-31' });
		expect(new Set(observations.map((task) => task.priority))).toEqual(new Set([...tasksOf(recorded.todos), ...tasksOf(recorded.completedTodos)].map((task) => task.priority)));
		expect(observations.every((task) => task.skills.length === 0)).toBe(true);
	});

	it('task statuses: answered from the two lists, with no lookup one by one', async () => {
		const { client, http } = recordedHabitica();
		const [open] = tasksOf(recorded.todos);
		const done = completedAt('2026-11-01T00:36:14.831Z');
		if (open === undefined) throw new Error('the recording has no open to-do');

		const statuses = await new HabiticaTaskStatusSource(client).fetchStatuses([open.id, done.id]);

		// The first recorded to-do has 6 subtasks, none done; they travel with its status (missions S2).
		expect(statuses.get(open.id)).toEqual({ kind: 'open', checklist: { done: 0, total: 6 } });
		expect(statuses.get(done.id)).toEqual({ kind: 'completed', completedOn: '2026-10-31' });
		expect(http.requests.map((request) => request.url)).toEqual([URLS.todos, URLS.completedTodos]);
	});
});
