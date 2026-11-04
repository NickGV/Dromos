import { describe, expect, it } from 'vitest';
import { readHabiticaTasks } from '../../../src/adapters/habitica/habiticaTask';
import { countLeaks, createAnonymizer, foreignStrings, type HabiticaFixture } from './anonymize';

// Synthetic ids and texts in the shape Habitica sends. None of them can appear in a fake.
const USER = '3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
const OTHER_USER = 'c0ffee00-1234-4abc-8def-0123456789ab';
const TAG = 'a1b2c3d4-e5f6-4a1b-9c2d-3e4f5a6b7c8d';
const DAILY = '11111111-2222-4333-8444-555555555555';
const TODO = '99999999-8888-4777-a666-555555555555';
const DONE = 'ABCDEF12-3456-4789-ABCD-EF0123456789';
const CHECKLIST_ITEM = '0a0b0c0d-1e1f-4a2b-8c3d-4e5f6a7b8c9d';
const CHALLENGE = 'fedcba98-7654-4321-8fed-cba987654321';
const REMINDER = '12121212-3434-4565-8787-909090909090';

/** Every string a person wrote, or that names a person, in `recorded()`. */
const PRIVATE_STRINGS = [
	USER,
	OTHER_USER,
	TAG,
	DAILY,
	TODO,
	DONE,
	CHECKLIST_ITEM,
	CHALLENGE,
	REMINDER,
	'Stretch with Ana',
	'Back pain since March',
	'stretch-ana',
	'Neck rolls',
	'ana_rivera',
	'Back care club',
	'Party of Ana',
	'Call the dentist',
	'Ask about the crown',
	'singleCompletion',
	'Renew passport',
];

const FAKE_ID = /^00000000-0000-4000-8000-\d{12}$/;

function recorded(): { dailys: unknown; todos: unknown; completedTodos: unknown } {
	return {
		dailys: {
			success: true,
			notifications: [{ type: 'NEW_CHAT_MESSAGE', data: { group: { name: 'Party of Ana' } } }],
			userV: 42,
			appVersion: '5.30.0',
			data: [
				{
					_id: DAILY,
					id: DAILY,
					userId: USER,
					text: 'Stretch with Ana',
					notes: 'Back pain since March',
					alias: 'stretch-ana',
					type: 'daily',
					tags: [TAG],
					completed: true,
					isDue: true,
					priority: 1.5,
					streak: 12,
					value: 3.25,
					frequency: 'weekly',
					attribute: 'con',
					everyX: 1,
					repeat: { m: true, su: false },
					checklist: [{ id: CHECKLIST_ITEM, text: 'Neck rolls', completed: false }],
					history: [{ date: 1761800000000, value: 1.2, isDue: true, completed: true }],
					nextDue: ['2026-11-05T05:00:00.000Z'],
					createdAt: '2026-01-02T03:04:05.000Z',
					group: {
						assignedUsers: [OTHER_USER],
						completedBy: { [OTHER_USER]: '2026-10-01T00:00:00.000Z' },
						assignedUsersDetail: { [OTHER_USER]: { assignedUsername: 'ana_rivera' } },
						sharedCompletion: 'singleCompletion',
					},
					challenge: { id: CHALLENGE, shortName: 'Back care club' },
					reminders: [{ id: REMINDER, time: '2026-10-01T12:00:00.000Z', startDate: '2026-10-01T00:00:00.000Z' }],
				},
			],
		},
		todos: {
			success: true,
			data: [
				{
					_id: TODO,
					id: TODO,
					userId: USER,
					text: 'Call the dentist',
					notes: '2026-10-01',
					type: 'todo',
					tags: [TAG],
					completed: false,
					date: '2026-11-03T05:00:00.000Z',
					priority: 2,
					checklist: [],
				},
			],
		},
		completedTodos: {
			success: true,
			data: [
				{
					_id: DONE,
					id: DONE,
					userId: USER,
					text: 'Renew passport',
					notes: 'Ask about the crown',
					type: 'todo',
					tags: [],
					completed: true,
					dateCompleted: '2026-10-28T15:30:00.000Z',
					priority: 1,
				},
			],
		},
	};
}

function anonymizeAll(): { raw: ReturnType<typeof recorded>; fixtures: { dailys: HabiticaFixture; todos: HabiticaFixture; completedTodos: HabiticaFixture } } {
	const raw = recorded();
	const anonymizer = createAnonymizer();
	return {
		raw,
		fixtures: { dailys: anonymizer.response(raw.dailys), todos: anonymizer.response(raw.todos), completedTodos: anonymizer.response(raw.completedTodos) },
	};
}

/** The shape of a value: its keys (id-shaped keys as `<id>`), array lengths and value types. */
function shape(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(shape);
	if (typeof value === 'object' && value !== null) {
		return Object.fromEntries(Object.entries(value).map(([key, item]) => [/^[0-9a-f-]{36}$/i.test(key) ? '<id>' : key, shape(item)]));
	}
	return value === null ? 'null' : typeof value;
}

function firstTask(fixture: HabiticaFixture): Record<string, unknown> {
	const [task] = fixture.data as Record<string, unknown>[];
	if (task === undefined) throw new Error('the fixture has no task');
	return task;
}

describe('Habitica fixture anonymizer (issue #8, S1, S5)', () => {
	it('keeps the structure: the same keys, array lengths and value types, with only success and data from the envelope', () => {
		const { raw, fixtures } = anonymizeAll();

		for (const name of ['dailys', 'todos', 'completedTodos'] as const) {
			const body = raw[name] as { success: unknown; data: unknown };
			expect(Object.keys(fixtures[name])).toEqual(['success', 'data']);
			expect(fixtures[name].success).toBe(true);
			expect(shape(fixtures[name].data)).toEqual(shape(body.data));
		}
	});

	it('leaves no original string: ids, tag ids, user ids, texts, notes, aliases, names and usernames are gone', () => {
		const { raw, fixtures } = anonymizeAll();
		const written = JSON.stringify(fixtures).toLowerCase();

		for (const text of PRIVATE_STRINGS) expect(written).not.toContain(text.toLowerCase());
		expect(countLeaks([raw.dailys, raw.todos, raw.completedTodos], [fixtures.dailys, fixtures.todos, fixtures.completedTodos])).toBe(0);
		for (const fixture of Object.values(fixtures)) expect(foreignStrings(fixture)).toBe(0);
	});

	it('keeps the values Dromos reads: type, completed, isDue, date, priority, streak, and tags as fake ids', () => {
		const { fixtures } = anonymizeAll();
		const daily = firstTask(fixtures.dailys);
		const todo = firstTask(fixtures.todos);
		const done = firstTask(fixtures.completedTodos);

		expect(daily).toMatchObject({ type: 'daily', completed: true, isDue: true, priority: 1.5, streak: 12, frequency: 'weekly', attribute: 'con' });
		expect(todo).toMatchObject({ type: 'todo', completed: false, date: '2026-11-03T05:00:00.000Z', priority: 2 });
		expect(done).toMatchObject({ type: 'todo', completed: true, dateCompleted: '2026-10-28T15:30:00.000Z' });
		expect(daily.history).toEqual([{ date: 1761800000000, value: 1.2, isDue: true, completed: true }]);
		expect(daily.nextDue).toEqual(['2026-11-05T05:00:00.000Z']);
		expect(daily.tags).toEqual([expect.stringMatching(FAKE_ID)]);
	});

	it('replaces texts with "<field> N" and ids with fake ids, a date-like note and an unknown setting included', () => {
		const { fixtures } = anonymizeAll();
		const daily = firstTask(fixtures.dailys);
		const todo = firstTask(fixtures.todos);

		expect(daily).toMatchObject({ text: 'text 1', notes: 'notes 1', alias: 'alias 1' });
		expect(daily.id).toMatch(FAKE_ID);
		expect(daily.group).toMatchObject({ sharedCompletion: 'sharedCompletion 1' });
		// The daily's checklist item took 'text 2'.
		expect(todo).toMatchObject({ text: 'text 3', notes: 'notes 2' });
	});

	it('gives the same fake to the same id in every response, so task ids and tag ids still match', () => {
		const { fixtures } = anonymizeAll();
		const daily = firstTask(fixtures.dailys);
		const todo = firstTask(fixtures.todos);
		const done = firstTask(fixtures.completedTodos);

		expect(daily._id).toBe(daily.id);
		expect(todo.tags).toEqual(daily.tags);
		expect(done.userId).toBe(daily.userId);
		expect(new Set([daily.id, todo.id, done.id, daily.userId]).size).toBe(4);
		const group = daily.group as { assignedUsers: string[]; completedBy: Record<string, string> };
		expect(Object.keys(group.completedBy)).toEqual(group.assignedUsers);
	});

	it('is deterministic: the same responses give the same fixtures', () => {
		expect(JSON.stringify(anonymizeAll().fixtures)).toBe(JSON.stringify(anonymizeAll().fixtures));
	});

	it('gives fixtures Dromos still reads as Habitica tasks', () => {
		const { fixtures } = anonymizeAll();

		for (const fixture of Object.values(fixtures)) expect(readHabiticaTasks(fixture.data)).toHaveLength(1);
	});

	it('refuses a body that is not a Habitica response', () => {
		expect(() => createAnonymizer().response({ data: [] })).toThrow('Not a Habitica API response');
		expect(() => createAnonymizer().response([])).toThrow('Not a Habitica API response');
	});
});

describe('leak checks', () => {
	it('countLeaks counts each private string still in a fixture, never returning the strings', () => {
		const { raw, fixtures } = anonymizeAll();
		const tampered = { ...fixtures.todos, data: [{ ...firstTask(fixtures.todos), text: 'Call the dentist', notes: `see ${TAG.toUpperCase()}` }] };

		expect(countLeaks([raw.todos], [tampered])).toBe(2);
	});

	it('foreignStrings counts a string that is neither kept nor a fake, a real id key included', () => {
		const fixture = { success: true, data: [{ id: TODO, text: 'Call the dentist', type: 'todo', date: '2026-11-03', completedBy: { [USER]: true } }] };

		expect(foreignStrings(fixture)).toBe(3);
	});
});
