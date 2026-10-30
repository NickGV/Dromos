import { describe, expect, it } from 'vitest';
import { CHARACTER_CURVE, LevelCurve } from '../../../src/domain/rules/LevelCurve';

describe('LevelCurve (character curve: round(100 * level^1.5))', () => {
	const curve = new LevelCurve(CHARACTER_CURVE);

	it.each([
		[1, 100],
		[2, 283],
		[3, 520],
		[5, 1118],
		[10, 3162],
	])('needs %i -> %i XP to leave level %i', (level, xp) => {
		expect(curve.xpToNext(level)).toBe(xp);
	});

	it.each([
		[0, 1],
		[99, 1],
		[100, 2],
		[382, 2],
		[383, 3],
		[903, 4],
	])('total XP %i is level %i', (totalXp, level) => {
		expect(curve.levelFor(totalXp)).toBe(level);
	});

	it('reports progress inside the current level', () => {
		expect(curve.progressFor(150)).toEqual({ level: 2, xpIntoLevel: 50, xpToNext: 283 });
	});

	it('treats negative, fractional and invalid XP as the start of the race', () => {
		expect(curve.progressFor(-40)).toEqual({ level: 1, xpIntoLevel: 0, xpToNext: 100 });
		expect(curve.progressFor(99.9)).toEqual({ level: 1, xpIntoLevel: 99, xpToNext: 100 });
		expect(curve.progressFor(Number.NaN)).toEqual({ level: 1, xpIntoLevel: 0, xpToNext: 100 });
	});

	it('caps absurd totals so computing the level always ends', () => {
		const progress = curve.progressFor(1e300);
		expect(progress).toEqual(curve.progressFor(Number.MAX_SAFE_INTEGER));
		expect(Number.isFinite(progress.level)).toBe(true);
	});
});
