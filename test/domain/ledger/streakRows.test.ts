import { describe, expect, it } from 'vitest';
import type { LedgerRow } from '../../../src/domain/ledger/LedgerRow';
import type { TaskObservation } from '../../../src/domain/ledger/nextRows';
import { streakRows } from '../../../src/domain/ledger/streakRows';
import { row } from './ledgerFixtures';

function daily(overrides: Partial<TaskObservation> = {}): TaskObservation {
	return {
		habiticaId: 'task-1',
		title: 'Stretch',
		kind: 'daily',
		priority: 1,
		skills: ['atleta'],
		completed: true,
		date: '2026-11-09',
		streak: 7,
		...overrides,
	};
}

const bonus = (overrides: Partial<LedgerRow> = {}): LedgerRow =>
	row({ date: '2026-11-09', task: 'Stretch', kind: 'daily', skill: 'atleta', xp: 10, source: 'streak', n: 1, ...overrides });

describe('streakRows: 10 XP every 7 days of daily streak (S11)', () => {
	it.each([7, 14, 21])('pays the bonus on a streak of %i days', (streak) => {
		expect(streakRows([], daily({ streak }))).toEqual([bonus()]);
	});

	it.each([0, 1, 6, 8, 13])('pays nothing on a streak of %i days', (streak) => {
		expect(streakRows([], daily({ streak }))).toEqual([]);
	});

	it('pays nothing without a streak or when the daily is not done', () => {
		expect(streakRows([], daily({ streak: null }))).toEqual([]);
		expect(streakRows([], daily({ streak: undefined }))).toEqual([]);
		expect(streakRows([], daily({ completed: false }))).toEqual([]);
	});

	it('never pays a to-do', () => {
		expect(streakRows([], daily({ kind: 'todo', streak: 7 }))).toEqual([]);
	});

	it('gives the full bonus to each skill of the daily, or one row without skill', () => {
		expect(streakRows([], daily({ skills: ['atleta', 'cuidador'] }))).toEqual([bonus(), bonus({ skill: 'cuidador' })]);
		expect(streakRows([], daily({ skills: [] }))).toEqual([bonus({ skill: null })]);
	});
});

describe('streakRows: once per milestone and undone with the daily', () => {
	it('pays once: syncing again the same day adds nothing', () => {
		expect(streakRows([bonus()], daily())).toEqual([]);
	});

	it('takes the bonus back, with the XP it paid, when the daily is unchecked the same day', () => {
		expect(streakRows([bonus()], daily({ completed: false, streak: 6 }))).toEqual([bonus({ xp: -10, n: 2 })]);
	});

	it('takes it back when the streak is no longer on a milestone', () => {
		expect(streakRows([bonus()], daily({ streak: 6 }))).toEqual([bonus({ xp: -10, n: 2 })]);
	});

	it('pays again when the daily is checked again after the bonus was taken back', () => {
		const history = [bonus(), bonus({ xp: -10, n: 2 })];

		expect(streakRows(history, daily())).toEqual([bonus({ n: 3 })]);
	});

	it('takes nothing back when nothing is active', () => {
		const history = [bonus(), bonus({ xp: -10, n: 2 })];

		expect(streakRows(history, daily({ completed: false, streak: 6 }))).toEqual([]);
	});

	it('only looks at the bonuses of this task and this day', () => {
		const history = [bonus({ date: '2026-11-02' }), bonus({ habiticaId: 'other' })];

		expect(streakRows(history, daily())).toEqual([bonus()]);
	});
});
