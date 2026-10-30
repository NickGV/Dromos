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

	it('treats a missing, null, empty or unreadable date as undated', () => {
		expect(localDate(undefined)).toBeNull();
		expect(localDate(null)).toBeNull();
		expect(localDate('')).toBeNull();
		expect(localDate('not a date')).toBeNull();
	});
});
