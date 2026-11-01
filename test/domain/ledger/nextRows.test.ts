import { describe, expect, it } from 'vitest';
import type { LedgerRow } from '../../../src/domain/ledger/LedgerRow';
import { nextRows, type TaskObservation } from '../../../src/domain/ledger/nextRows';
import { row } from './ledgerFixtures';

function observation(overrides: Partial<TaskObservation> = {}): TaskObservation {
	return {
		habiticaId: 'task-1',
		title: 'Read chapter 3',
		kind: 'todo',
		priority: 1,
		skills: ['lector'],
		completed: true,
		date: '2026-11-03',
		...overrides,
	};
}

describe('nextRows: a to-do that becomes completed', () => {
	it('appends complete#1 worth the XP of its priority', () => {
		expect(nextRows([], observation())).toEqual([row({ xp: 10, source: 'complete', n: 1 })]);
	});

	it.each([
		[0.1, 5],
		[1, 10],
		[1.5, 15],
		[2, 25],
	])('priority %s is worth %i XP', (priority, xp) => {
		expect(nextRows([], observation({ priority }))[0]?.xp).toBe(xp);
	});

	it('gives the full XP to every skill of the quest, one row per skill (S13)', () => {
		const rows = nextRows([], observation({ skills: ['atleta', 'arbitro'] }));

		expect(rows).toEqual([row({ skill: 'atleta' }), row({ skill: 'arbitro' })]);
	});

	it('writes a single row without skill when the quest has none: character XP only', () => {
		expect(nextRows([], observation({ skills: [] }))).toEqual([row({ skill: null })]);
	});

	it('dates the row with the observation date', () => {
		expect(nextRows([], observation({ date: '2026-11-09' }))[0]?.date).toBe('2026-11-09');
	});
});

describe('nextRows: idempotence (S15)', () => {
	it('adds nothing when the task is completed and its last transition is an active complete', () => {
		const history = nextRows([], observation());

		expect(nextRows(history, observation())).toEqual([]);
	});

	it('adds nothing for a task that was never completed and is not completed', () => {
		expect(nextRows([], observation({ completed: false }))).toEqual([]);
	});

	it('syncing three times in a row appends the rows only once', () => {
		let history: LedgerRow[] = [];
		for (let sync = 0; sync < 3; sync += 1) history = [...history, ...nextRows(history, observation())];

		expect(history).toHaveLength(1);
	});

	it('ignores the rows of other tasks', () => {
		const history = [row({ habiticaId: 'other', source: 'complete', n: 1 })];

		expect(nextRows(history, observation())).toEqual([row()]);
	});
});

describe('nextRows: unchecking reverts the XP (S9)', () => {
	const completed = [row({ skill: 'atleta' }), row({ skill: 'arbitro' })];

	it('appends revert#1 with the negative XP of the complete it cancels, one row per skill', () => {
		const rows = nextRows(completed, observation({ completed: false, date: '2026-11-04', skills: ['atleta', 'arbitro'] }));

		expect(rows).toEqual([
			row({ skill: 'atleta', xp: -10, source: 'revert', n: 1, date: '2026-11-04' }),
			row({ skill: 'arbitro', xp: -10, source: 'revert', n: 1, date: '2026-11-04' }),
		]);
	});

	it('cancels the XP that was paid, not the XP the priority is worth now', () => {
		const rows = nextRows(completed, observation({ completed: false, priority: 2, skills: [] }));

		expect(rows.map((item) => item.xp)).toEqual([-10, -10]);
	});

	it('adds nothing once the revert is there', () => {
		const history = [...completed, ...nextRows(completed, observation({ completed: false, skills: [] }))];

		expect(nextRows(history, observation({ completed: false }))).toEqual([]);
	});

	it('checking it again appends complete#2 without annulling the revert', () => {
		const reverted = [...completed, ...nextRows(completed, observation({ completed: false, skills: [] }))];

		const rows = nextRows(reverted, observation({ skills: ['atleta'] }));

		expect(rows).toEqual([row({ skill: 'atleta', source: 'complete', n: 2 })]);
	});

	it('unchecking the second completion appends revert#2', () => {
		const first = [row(), row({ source: 'revert', n: 1, xp: -10 }), row({ source: 'complete', n: 2 })];

		const rows = nextRows(first, observation({ completed: false }));

		expect(rows).toEqual([row({ source: 'revert', n: 2, xp: -10 })]);
	});
});

describe('nextRows: dailies have one set of transitions per day', () => {
	const daily = (overrides: Partial<TaskObservation> = {}) => observation({ kind: 'daily', title: 'Stretching', ...overrides });

	it('a daily completed today earns the daily XP', () => {
		expect(nextRows([], daily({ priority: 1 }))[0]?.xp).toBe(5);
	});

	it('completing it on a new day starts again at complete#1', () => {
		const yesterday = nextRows([], daily({ date: '2026-11-02' }));

		const today = nextRows(yesterday, daily({ date: '2026-11-03' }));

		expect(today.map((item) => [item.date, item.source, item.n])).toEqual([['2026-11-03', 'complete', 1]]);
	});

	it('marks its rows as coming from a daily, and a revert keeps the mark', () => {
		const completed = nextRows([], daily());
		const reverted = nextRows(completed, daily({ completed: false }));

		expect([...completed, ...reverted].map((item) => item.kind)).toEqual(['daily', 'daily']);
	});

	it('does not add anything twice on the same day', () => {
		const history = nextRows([], daily());

		expect(nextRows(history, daily())).toEqual([]);
	});

	it('unchecking today reverts only today', () => {
		const history = [...nextRows([], daily({ date: '2026-11-02' })), ...nextRows([], daily({ date: '2026-11-03' }))];

		const rows = nextRows(history, daily({ completed: false, date: '2026-11-03' }));

		expect(rows.map((item) => [item.date, item.source, item.n, item.xp])).toEqual([['2026-11-03', 'revert', 1, -5]]);
	});
});
