import { describe, expect, it } from 'vitest';
import { difficultyFor, streakBonusFor, xpForTask } from '../../../src/domain/rules/XpRules';

describe('difficultyFor: Habitica priority to difficulty', () => {
	it.each([
		[0.1, 'trivial'],
		[1, 'easy'],
		[1.5, 'medium'],
		[2, 'hard'],
	] as const)('priority %s is %s', (priority, difficulty) => {
		expect(difficultyFor(priority)).toBe(difficulty);
	});

	it('rounds values between the four levels down to the level below', () => {
		expect(difficultyFor(0.5)).toBe('trivial');
		expect(difficultyFor(1.2)).toBe('easy');
		expect(difficultyFor(1.9)).toBe('medium');
		expect(difficultyFor(3)).toBe('hard');
	});

	it('reads a missing or invalid priority as Habitica does by default: easy', () => {
		expect(difficultyFor(Number.NaN)).toBe('easy');
		expect(difficultyFor(Number.POSITIVE_INFINITY)).toBe('easy');
	});
});

describe('xpForTask: the XP table of Rules.md', () => {
	it.each([
		['todo', 0.1, 5],
		['todo', 1, 10],
		['todo', 1.5, 15],
		['todo', 2, 25],
		['daily', 0.1, 3],
		['daily', 1, 5],
		['daily', 1.5, 8],
		['daily', 2, 12],
	] as const)('a %s with priority %s is worth %i XP', (kind, priority, xp) => {
		expect(xpForTask(kind, priority)).toBe(xp);
	});
});

describe('streakBonusFor: 10 XP every 7 days of daily streak', () => {
	it.each([
		[7, 10],
		[14, 10],
		[70, 10],
	])('a streak of %i days earns %i XP', (streak, xp) => {
		expect(streakBonusFor(streak)).toBe(xp);
	});

	it.each([0, 1, 6, 8, 13, -7, Number.NaN, 3.5])('a streak of %s earns nothing', (streak) => {
		expect(streakBonusFor(streak)).toBe(0);
	});
});
