import { describe, expect, it } from 'vitest';
import type { HabiticaTaskDto } from '../../../src/adapters/habitica/habiticaTask';
import { localDate, questFromHabiticaTask } from '../../../src/adapters/habitica/questMapper';

function task(overrides: Partial<HabiticaTaskDto>): HabiticaTaskDto {
	return { _id: 'task-1', id: 'task-1', text: 'Neutral task', type: 'todo', ...overrides };
}

describe('questFromHabiticaTask', () => {
	it('maps a daily: text to title, tags to skillTags, isDue to dueToday, no due date', () => {
		const daily = task({ type: 'daily', text: 'Stretch', tags: ['tag-a', 'tag-b'], completed: true, isDue: true, priority: 1, streak: 4 });

		expect(questFromHabiticaTask(daily)).toEqual({
			id: 'task-1',
			title: 'Stretch',
			type: 'daily',
			completed: true,
			skillTags: ['tag-a', 'tag-b'],
			dueToday: true,
			dueDate: null,
		});
	});

	it('maps a daily that is not due today to dueToday false', () => {
		expect(questFromHabiticaTask(task({ type: 'daily', isDue: false }))?.dueToday).toBe(false);
	});

	it('maps a to-do with its local due date and dueToday false', () => {
		const todo = task({ type: 'todo', text: 'Water the plants', date: '2026-10-30T05:00:00.000Z', completed: false });

		expect(questFromHabiticaTask(todo)).toEqual({
			id: 'task-1',
			title: 'Water the plants',
			type: 'todo',
			completed: false,
			skillTags: [],
			dueToday: false,
			dueDate: '2026-10-30',
		});
	});

	it('takes the id from _id when id is absent', () => {
		expect(questFromHabiticaTask({ _id: 'only-underscore', text: 'Task', type: 'todo' })?.id).toBe('only-underscore');
	});

	it('ignores task types Dromos does not show as quests', () => {
		expect(questFromHabiticaTask(task({ type: 'habit' }))).toBeNull();
		expect(questFromHabiticaTask(task({ type: 'reward' }))).toBeNull();
	});
});

describe('localDate (America/Bogota)', () => {
	it('converts timestamps near midnight to the Bogota date', () => {
		expect(localDate('2026-10-31T03:00:00.000Z')).toBe('2026-10-30');
		expect(localDate('2026-10-31T04:59:59.999Z')).toBe('2026-10-30');
		expect(localDate('2026-10-31T05:00:00.000Z')).toBe('2026-10-31');
		expect(localDate('2026-10-30T05:00:00.000Z')).toBe('2026-10-30');
	});

	// Habitica's web client shows a due date as `moment(task.date)`, the device's local day (task.vue,
	// formatDueDate), so on a device in Bogota a date stored at midnight UTC reads as the day before there too.
	it('reads a due date stored at midnight UTC as the day before in Bogota, as Habitica shows it there (S2)', () => {
		expect(localDate('2026-10-30T00:00:00.000Z')).toBe('2026-10-29');
	});

	it('treats a missing, null, empty or unreadable date as undated', () => {
		expect(localDate(undefined)).toBeNull();
		expect(localDate(null)).toBeNull();
		expect(localDate('')).toBeNull();
		expect(localDate('not a date')).toBeNull();
	});
});

describe('questFromHabiticaTask: checklist (missions S1)', () => {
	const checklist = [
		{ completed: true, text: 'a', id: 'c1' },
		{ completed: false, text: 'b', id: 'c2' },
		{ completed: false, text: 'c', id: 'c3' },
	];

	it('counts the subtasks of a to-do or a daily, and keeps the title and state of each, in order (missions S1, S5)', () => {
		expect(questFromHabiticaTask(task({ checklist }))?.checklist).toEqual({ done: 1, total: 3, items: [{ title: 'a', completed: true }, { title: 'b', completed: false }, { title: 'c', completed: false }] });
		expect(questFromHabiticaTask(task({ type: 'daily', checklist }))?.checklist).toEqual({ done: 1, total: 3, items: [{ title: 'a', completed: true }, { title: 'b', completed: false }, { title: 'c', completed: false }] });
	});

	it('leaves the checklist out when the task has none, an empty one, or one that is not a list (missions A3)', () => {
		for (const value of [undefined, [], 'three', null, {}]) {
			expect(questFromHabiticaTask(task({ checklist: value }))).not.toHaveProperty('checklist');
		}
	});

	it('counts only the subtasks it can read, so a malformed one never rejects the task (missions A3)', () => {
		expect(questFromHabiticaTask(task({ checklist: [{ completed: true }, 'junk', null, { completed: 'yes', text: 7 }] }))?.checklist).toEqual({
			done: 1,
			total: 2,
			items: [
				{ title: '', completed: true },
				{ title: '', completed: false },
			],
		});
	});
});
