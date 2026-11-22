import { describe, expect, it } from 'vitest';
import { foldLedger, uniqueRows, type SkillXpSource } from '../../../src/domain/ledger/foldLedger';
import { standingCompletionCount } from '../../../src/domain/ledger/questCounts';
import { recentDeeds } from '../../../src/domain/ledger/recentRows';
import { row } from './ledgerFixtures';

const lector: SkillXpSource = { id: 'lector', stat: 'inteligencia', unlockedOn: '2026-11-01' };

/** A to-do that stays completed, then `task-1`: completed, unchecked on 11-05, and unchecked again on 11-08 by a device that missed the first uncheck. */
const staleUncheck = [
	row({ habiticaId: 'kept' }),
	row({ date: '2026-11-03' }),
	row({ date: '2026-11-05', xp: -10, source: 'revert' }),
	row({ date: '2026-11-08', xp: -10, source: 'revert' }),
];

describe('a to-do change counts once whatever its date (ledger-repeats S7)', () => {
	it('counts a stale device uncheck on another day once, for the character and the skill', () => {
		const totals = foldLedger(staleUncheck, [lector]);

		expect(totals.characterXp).toBe(10);
		expect(totals.skillXp.lector).toBe(10);
	});

	it('counts a stale device completion written again under a new date once', () => {
		const rows = [
			row({ date: '2026-11-03' }),
			row({ date: '2026-11-05', xp: -10, source: 'revert' }),
			row({ date: '2026-11-09', n: 2 }),
			row({ date: '2026-11-09', n: 1 }),
		];

		expect(foldLedger(rows, [lector]).characterXp).toBe(10);
	});

	it('keeps the first row, so the chronicle shows one uncheck on its first date', () => {
		const reverts = recentDeeds(staleUncheck, 10).filter((deed) => deed.source === 'revert');

		expect(reverts).toEqual([{ date: '2026-11-05', habiticaId: 'task-1', task: 'Read chapter 3', source: 'revert', xp: -10, skills: ['lector'] }]);
	});

	it('counts the standing completions with the uncheck once', () => {
		expect(standingCompletionCount(staleUncheck)).toBe(1);
	});

	it('still tells apart a daily of two days, whose n restarts every day', () => {
		const daily = (date: string) => row({ habiticaId: 'd', kind: 'daily', xp: 5, date });

		expect(uniqueRows([daily('2026-11-03'), daily('2026-11-04')])).toHaveLength(2);
		expect(standingCompletionCount([daily('2026-11-03'), daily('2026-11-04')])).toBe(2);
	});
});
