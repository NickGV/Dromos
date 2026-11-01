import { describe, expect, it } from 'vitest';
import { RANK_COUNT, RANK_LEVELS, rankIndexFor } from '../../../src/domain/rules/Ranks';

describe('ranks: five ranks at levels 1, 5, 10, 15 and 20', () => {
	it('has the shared thresholds in one place', () => {
		expect(RANK_LEVELS).toEqual([1, 5, 10, 15, 20]);
		expect(RANK_COUNT).toBe(5);
	});

	it.each([
		[1, 0],
		[4, 0],
		[5, 1],
		[9, 1],
		[10, 2],
		[14, 2],
		[15, 3],
		[19, 3],
		[20, 4],
		[99, 4],
	])('level %i is rank index %i', (level, index) => {
		expect(rankIndexFor(level)).toBe(index);
	});

	it.each([0, -3, Number.NaN])('level %s has no rank (a locked skill is level 0)', (level) => {
		expect(rankIndexFor(level)).toBeNull();
	});
});
