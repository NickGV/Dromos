import { describe, expect, it } from 'vitest';
import type { Quest } from '../../../src/domain/quest/Quest';
import { selectTodaysQuests } from '../../../src/domain/quest/selectTodaysQuests';

const TODAY = '2026-10-30';

function daily(id: string, overrides: Partial<Quest> = {}): Quest {
	return {
		id,
		title: `Daily ${id}`,
		type: 'daily',
		completed: false,
		skillTags: [],
		dueToday: true,
		dueDate: null,
		...overrides,
	};
}

function todo(id: string, dueDate: string | null, overrides: Partial<Quest> = {}): Quest {
	return {
		id,
		title: `Todo ${id}`,
		type: 'todo',
		completed: false,
		skillTags: [],
		dueToday: false,
		dueDate,
		...overrides,
	};
}

const ids = (quests: readonly Quest[]): string[] => quests.map((quest) => quest.id);

describe('selectTodaysQuests: dailies', () => {
	it('keeps dailies due today, completed ones included', () => {
		const quests = [daily('d1'), daily('d2', { completed: true })];

		const selected = selectTodaysQuests(quests, TODAY);

		expect(selected).toEqual(quests);
	});

	it('drops dailies that are not due today', () => {
		const quests = [daily('due'), daily('rest-day', { dueToday: false })];

		expect(ids(selectTodaysQuests(quests, TODAY))).toEqual(['due']);
	});
});

describe('selectTodaysQuests: to-dos', () => {
	it('keeps pending to-dos that are overdue, due today or undated', () => {
		const quests = [todo('overdue', '2026-10-28'), todo('today', TODAY), todo('undated', null)];

		expect(ids(selectTodaysQuests(quests, TODAY))).toEqual(['overdue', 'today', 'undated']);
	});

	it('drops to-dos dated after today', () => {
		const quests = [todo('tomorrow', '2026-10-31'), todo('next-year', '2027-01-01'), todo('today', TODAY)];

		expect(ids(selectTodaysQuests(quests, TODAY))).toEqual(['today']);
	});

	it('drops completed to-dos, dated or not', () => {
		const quests = [
			todo('done-overdue', '2026-10-01', { completed: true }),
			todo('done-today', TODAY, { completed: true }),
			todo('done-undated', null, { completed: true }),
			todo('pending', null),
		];

		expect(ids(selectTodaysQuests(quests, TODAY))).toEqual(['pending']);
	});

	it('marks dated to-dos as due today and undated ones as not, whatever the source said', () => {
		const quests = [todo('overdue', '2026-10-29'), todo('today', TODAY), todo('undated', null, { dueToday: true })];

		const selected = selectTodaysQuests(quests, TODAY);

		expect(selected.map((quest) => [quest.id, quest.dueToday])).toEqual([
			['overdue', true],
			['today', true],
			['undated', false],
		]);
	});
});

describe('selectTodaysQuests: order', () => {
	it('lists dailies in source order, then dated to-dos by date, then undated to-dos in source order', () => {
		const quests = [
			todo('undated-a', null),
			daily('d1'),
			todo('today-a', TODAY),
			todo('oldest', '2026-09-15'),
			daily('d2', { completed: true }),
			todo('undated-b', null),
			todo('today-b', TODAY),
			todo('yesterday', '2026-10-29'),
			todo('future', '2026-11-02'),
		];

		expect(ids(selectTodaysQuests(quests, TODAY))).toEqual([
			'd1',
			'd2',
			'oldest',
			'yesterday',
			'today-a',
			'today-b',
			'undated-a',
			'undated-b',
		]);
	});

	it('compares dates across month and year boundaries', () => {
		const quests = [todo('oct', '2026-10-01'), todo('dec-last-year', '2025-12-31'), todo('sep', '2026-09-30')];

		expect(ids(selectTodaysQuests(quests, TODAY))).toEqual(['dec-last-year', 'sep', 'oct']);
	});

	it('returns an empty list for no quests and leaves the input untouched', () => {
		const quests = [todo('b', '2026-10-29'), todo('a', '2026-10-01')];
		const snapshot = structuredClone(quests);

		expect(selectTodaysQuests([], TODAY)).toEqual([]);
		selectTodaysQuests(quests, TODAY);
		expect(quests).toEqual(snapshot);
	});
});
