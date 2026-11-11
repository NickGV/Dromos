import { describe, expect, it } from 'vitest';
import { DEFAULT_GOLD_PER_LEVEL, lastPurchases, levelBonus, levelsReached, paidLevels, unpaidLevels, type PurseEntry } from '../../../src/domain';

const bonus = (level: number, gold = level * 10): PurseEntry => ({ date: '2026-11-10', kind: 'bonus', what: `Level ${level}`, gold, level, offer: null });
const purchase = (date: string, what: string, gold: number, offer: string | null = null): PurseEntry => ({ date, kind: 'purchase', what, gold, level: null, offer });

describe('the level bonus (M10 S3)', () => {
	it('is goldPerLevel times the level reached, 10 a level by default', () => {
		expect(DEFAULT_GOLD_PER_LEVEL).toBe(10);
		expect(levelBonus(DEFAULT_GOLD_PER_LEVEL, 3)).toBe(30);
		expect(levelBonus(25, 4)).toBe(100);
	});

	it('is owed for each level a level-up reached, two levels at once both', () => {
		expect(levelsReached(2, 3)).toEqual([3]);
		expect(levelsReached(2, 4)).toEqual([3, 4]);
		expect(levelsReached(4, 4)).toEqual([]);
		expect(levelsReached(5, 3)).toEqual([]);
	});

	it('is never owed twice: a level with a bonus row in the purse is paid', () => {
		const purse = [bonus(3), purchase('2026-11-10', 'Coffee', -20)];

		expect([...paidLevels(purse)]).toEqual([3]);
		expect(unpaidLevels([4, 3, 4, 5], purse)).toEqual([4, 5]);
	});
});

describe('lastPurchases (M10 S4)', () => {
	it('lists the purchases only, newest first, at most the number asked', () => {
		const purse = [purchase('2026-11-01', 'Tea', -5), bonus(3), purchase('2026-11-03', 'Coffee', -20), purchase('2026-11-02', 'Film', -15), purchase('2026-11-03', 'Book', -75)];

		expect(lastPurchases(purse, 3).map((entry) => entry.what)).toEqual(['Book', 'Coffee', 'Film']);
	});
});
