import { describe, expect, it } from 'vitest';
import { DEFAULT_HABIT_DAYS, habitProgress } from '../../../src/domain/campaign/habitProgress';

describe('habitProgress: a habit is built by a strict streak (S8)', () => {
	it('uses 21 days by default', () => {
		expect(DEFAULT_HABIT_DAYS).toBe(21);
	});

	it('shows the streak over the target days', () => {
		expect(habitProgress(12, 21)).toEqual({ done: 12, total: 21, ratio: 12 / 21 });
	});

	it('is complete at the target and never goes past it', () => {
		expect(habitProgress(21, 21)).toEqual({ done: 21, total: 21, ratio: 1 });
		expect(habitProgress(30, 21)).toEqual({ done: 21, total: 21, ratio: 1 });
	});

	it('a broken streak starts again at zero', () => {
		expect(habitProgress(0, 21)).toEqual({ done: 0, total: 21, ratio: 0 });
	});

	it.each([Number.NaN, -4, Number.POSITIVE_INFINITY])('reads a streak of %s as zero, never NaN', (streak) => {
		expect(habitProgress(streak, 21).done).toBe(0);
	});

	it.each([0, -1, Number.NaN])('a target of %s falls back to one day', (days) => {
		expect(habitProgress(0, days)).toEqual({ done: 0, total: 1, ratio: 0 });
	});
});
