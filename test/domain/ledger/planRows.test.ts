import { describe, expect, it } from 'vitest';
import type { TaskObservation } from '../../../src/domain/ledger/nextRows';
import { resolveGameStart, rowsToAppend } from '../../../src/domain/ledger/planRows';
import { row } from './ledgerFixtures';

function observation(overrides: Partial<TaskObservation> = {}): TaskObservation {
	return { habiticaId: 'task-1', title: 'Read', kind: 'todo', priority: 1, skills: ['lector'], completed: true, date: '2026-11-03', ...overrides };
}

describe('rowsToAppend: the game starts counting on its first day (no gifted progress)', () => {
	it('ignores a task completed before the start', () => {
		expect(rowsToAppend([], [observation({ date: '2026-11-02' })], '2026-11-03')).toEqual([]);
	});

	it('counts a task completed on the start day or later', () => {
		expect(rowsToAppend([], [observation({ date: '2026-11-03' }), observation({ habiticaId: 'b', date: '2026-11-05' })], '2026-11-03')).toHaveLength(2);
	});

	it('still reverts a task that was counted, even if it is dated before the start', () => {
		const history = [row({ date: '2026-11-03' })];

		const rows = rowsToAppend(history, [observation({ completed: false, date: '2026-11-04' })], '2026-11-03');

		expect(rows).toEqual([row({ date: '2026-11-04', xp: -10, source: 'revert' })]);
	});
});

describe('rowsToAppend: a whole sync', () => {
	it('adds the completion and the streak bonus of a daily', () => {
		const daily = observation({ kind: 'daily', habiticaId: 'd', title: 'Stretch', skills: ['atleta'], streak: 7 });

		const rows = rowsToAppend([], [daily], '2026-11-03');

		expect(rows.map((item) => [item.source, item.xp, item.kind])).toEqual([
			['complete', 5, 'daily'],
			['streak', 10, 'daily'],
		]);
	});

	it('sees the rows it just planned, so one task twice in a list is not counted twice', () => {
		const rows = rowsToAppend([], [observation(), observation()], '2026-11-03');

		expect(rows).toHaveLength(1);
	});

	it('is idempotent: planning again over its own rows adds nothing', () => {
		const tasks = [observation(), observation({ kind: 'daily', habiticaId: 'd', streak: 7, skills: [] })];
		const first = rowsToAppend([], tasks, '2026-11-03');

		expect(rowsToAppend(first, tasks, '2026-11-03')).toEqual([]);
	});
});

describe('resolveGameStart', () => {
	it('keeps the start the character already has', () => {
		expect(resolveGameStart('2026-11-01', [row({ date: '2026-10-01' })], '2026-11-09')).toBe('2026-11-01');
	});

	it('starts today on the very first sync', () => {
		expect(resolveGameStart(null, [], '2026-11-09')).toBe('2026-11-09');
	});

	it('uses the oldest ledger row when the ledger has rows but the character has no start', () => {
		expect(resolveGameStart(null, [row({ date: '2026-11-05' }), row({ date: '2026-11-02', habiticaId: 'b' })], '2026-11-09')).toBe('2026-11-02');
	});
});
