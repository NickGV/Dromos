import { describe, expect, it } from 'vitest';
import { observedTaskFromHabiticaTask } from '../../../src/adapters/habitica/gameTaskMapper';
import type { HabiticaTaskDto } from '../../../src/adapters/habitica/habiticaTask';

const TODAY = '2026-11-03';
const TAGS = new Map([
	['tag-lector', 'lector'],
	['tag-atleta', 'atleta'],
]);

const todo = (extra: Partial<HabiticaTaskDto> = {}): HabiticaTaskDto => ({ id: 'todo-1', text: 'Read chapter 3', type: 'todo', completed: false, ...extra });
const daily = (extra: Partial<HabiticaTaskDto> = {}): HabiticaTaskDto => ({ id: 'daily-1', text: 'Stretch', type: 'daily', completed: false, streak: 0, ...extra });

describe('observedTaskFromHabiticaTask: to-dos', () => {
	it('maps an open to-do', () => {
		expect(observedTaskFromHabiticaTask(todo({ priority: 1.5, tags: ['tag-lector'] }), TAGS, TODAY)).toEqual({
			habiticaId: 'todo-1',
			title: 'Read chapter 3',
			kind: 'todo',
			priority: 1.5,
			skills: ['lector'],
			completed: false,
			date: TODAY,
			streak: null,
		});
	});

	it('dates a completed to-do with the local day it was completed, in the Dromos time zone', () => {
		const dto = todo({ completed: true, dateCompleted: '2026-10-31T03:30:00.000Z' });

		expect(observedTaskFromHabiticaTask(dto, TAGS, TODAY)).toMatchObject({ completed: true, date: '2026-10-30' });
	});

	it('falls back to today when a completed to-do has no usable date', () => {
		for (const dateCompleted of [undefined, null, '', 'not a date']) {
			expect(observedTaskFromHabiticaTask(todo({ completed: true, dateCompleted }), TAGS, TODAY)?.date).toBe(TODAY);
		}
	});

	it('reads the id from _id when id is missing', () => {
		const { id: _id, ...rest } = todo();

		expect(observedTaskFromHabiticaTask({ ...rest, _id: 'only-underscore' }, TAGS, TODAY)?.habiticaId).toBe('only-underscore');
	});
});

describe('observedTaskFromHabiticaTask: dailies', () => {
	it('maps a daily completed today with its streak, dated today', () => {
		expect(observedTaskFromHabiticaTask(daily({ completed: true, streak: 7, priority: 2 }), TAGS, TODAY)).toEqual({
			habiticaId: 'daily-1',
			title: 'Stretch',
			kind: 'daily',
			priority: 2,
			skills: [],
			completed: true,
			date: TODAY,
			streak: 7,
		});
	});

	it('reads a missing or invalid streak as zero', () => {
		for (const streak of [undefined, -2, Number.NaN]) {
			expect(observedTaskFromHabiticaTask(daily({ streak }), TAGS, TODAY)?.streak).toBe(0);
		}
	});
});

describe('observedTaskFromHabiticaTask: skills and priority', () => {
	it('keeps only the tags that are skill tags, once each, in the order of the task', () => {
		const dto = todo({ tags: ['other-tag', 'tag-atleta', 'tag-lector', 'tag-atleta'] });

		expect(observedTaskFromHabiticaTask(dto, TAGS, TODAY)?.skills).toEqual(['atleta', 'lector']);
	});

	it.each([[undefined], [0], [-1], [Number.NaN]])('reads a priority of %s as 1, the Habitica default', (priority) => {
		expect(observedTaskFromHabiticaTask(todo({ priority }), TAGS, TODAY)?.priority).toBe(1);
	});

	it('ignores habits and rewards', () => {
		expect(observedTaskFromHabiticaTask({ id: 'h', text: 'Habit', type: 'habit' }, TAGS, TODAY)).toBeNull();
		expect(observedTaskFromHabiticaTask({ id: 'r', text: 'Reward', type: 'reward' }, TAGS, TODAY)).toBeNull();
	});
});
