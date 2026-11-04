import { describe, expect, it } from 'vitest';
import { completedQuestCount, standingCompletionCount } from '../../../src/domain/ledger/questCounts';
import { row } from './ledgerFixtures';

describe('completedQuestCount: quests that count toward an unlock', () => {
	it('counts distinct to-dos completed with the skill', () => {
		const rows = [row({ habiticaId: 'a' }), row({ habiticaId: 'b' }), row({ habiticaId: 'c', skill: 'atleta' })];

		expect(completedQuestCount(rows, 'lector')).toBe(2);
	});

	it('does not count a to-do twice when it was completed again after a revert', () => {
		const rows = [
			row({ n: 1 }),
			row({ n: 1, source: 'revert', xp: -10 }),
			row({ n: 2 }),
		];

		expect(completedQuestCount(rows, 'lector')).toBe(1);
	});

	it('does not count a to-do whose last completion was reverted', () => {
		const rows = [row(), row({ source: 'revert', xp: -10 })];

		expect(completedQuestCount(rows, 'lector')).toBe(0);
	});

	it('never counts dailies: they unlock through habits (S7)', () => {
		const rows = [row({ kind: 'daily', date: '2026-11-01' }), row({ kind: 'daily', date: '2026-11-02' })];

		expect(completedQuestCount(rows, 'lector')).toBe(0);
	});

	it('ignores streak bonuses and rows without skill', () => {
		const rows = [row({ source: 'streak', xp: 10 }), row({ habiticaId: 'b', skill: null })];

		expect(completedQuestCount(rows, 'lector')).toBe(0);
	});

	it('counts the quests done while the skill was locked, that is every row', () => {
		const rows = [row({ date: '2020-01-01' })];

		expect(completedQuestCount(rows, 'lector')).toBe(1);
	});
});

// game-ui S15: what "2 quests since yesterday" counts.
describe('standingCompletionCount: completions that still stand, across every task', () => {
	it('counts each completion once, however many skills its rows feed, dailies and to-dos alike', () => {
		const rows = [
			row({ habiticaId: 'a', skill: 'lector' }),
			row({ habiticaId: 'a', skill: 'escritor' }),
			row({ habiticaId: 'b', skill: null }),
			row({ habiticaId: 'd', kind: 'daily', date: '2026-11-01' }),
			row({ habiticaId: 'd', kind: 'daily', date: '2026-11-02' }),
		];

		expect(standingCompletionCount(rows)).toBe(4);
	});

	it('takes one back for each revert, so a revert reads as a quest less', () => {
		const rows = [row({ habiticaId: 'a' }), row({ habiticaId: 'b' }), row({ habiticaId: 'b', source: 'revert', xp: -10 })];

		expect(standingCompletionCount(rows)).toBe(1);
	});

	it('never counts streak bonuses, and counts an exact repeat once', () => {
		const rows = [row(), row(), row({ source: 'streak', xp: 10 })];

		expect(standingCompletionCount(rows)).toBe(1);
	});

	it('is zero for an empty ledger', () => {
		expect(standingCompletionCount([])).toBe(0);
	});
});
