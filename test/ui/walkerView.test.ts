import { describe, expect, it } from 'vitest';
import { FAR_SCALE, GATE, WALK_START, levelFraction, walkerPlacement, walkerTransform, walkerView } from '../../src/ui/presenters/walkerView';

const distance = (a: { x: number; y: number }, b: { x: number; y: number }): number => Math.hypot(a.x - b.x, a.y - b.y);

// game-ui S16: the walker stands along the road at the share of the level done.
describe('walkerPlacement', () => {
	it('stands where the road comes out from under the card at 0 %, full size', () => {
		expect(walkerPlacement(0)).toEqual({ x: WALK_START.x, y: WALK_START.y, scale: 1 });
		expect(WALK_START).toEqual({ x: 539, y: 238 });
	});

	it('stands at the gate at the far end at 100 %, smaller with the distance', () => {
		expect(walkerPlacement(1)).toEqual({ x: GATE.x, y: GATE.y, scale: FAR_SCALE });
		expect(FAR_SCALE).toBeGreaterThan(0.6);
		expect(FAR_SCALE).toBeLessThan(1);
	});

	it('stands half way along the road at 50 %, measured along it, and half way in scale', () => {
		const half = walkerPlacement(0.5);
		const start = walkerPlacement(0);
		const end = walkerPlacement(1);

		// Half the length of the road lies behind and half ahead, within a fraction of a unit.
		const behind = [0, 0.1, 0.2, 0.3, 0.4, 0.5].map(walkerPlacement).reduce((sum, point, index, all) => (index === 0 ? 0 : sum + distance(all[index - 1]!, point)), 0);
		const ahead = [0.5, 0.6, 0.7, 0.8, 0.9, 1].map(walkerPlacement).reduce((sum, point, index, all) => (index === 0 ? 0 : sum + distance(all[index - 1]!, point)), 0);
		expect(Math.abs(behind - ahead)).toBeLessThan(0.5);
		expect(half.x).toBeGreaterThan(start.x);
		expect(half.x).toBeLessThan(end.x);
		expect(half.y).toBeLessThan(start.y);
		expect(half.y).toBeGreaterThan(end.y);
		expect(half.scale).toBeCloseTo((1 + FAR_SCALE) / 2, 5);
	});

	it('moves forward and up the road as the share grows', () => {
		const points = [0, 0.25, 0.5, 0.75, 1].map(walkerPlacement);
		for (let index = 1; index < points.length; index += 1) {
			expect(points[index]!.y).toBeLessThan(points[index - 1]!.y);
			expect(points[index]!.scale).toBeLessThan(points[index - 1]!.scale);
		}
	});

	it('clamps a share outside the level to the road, and a share that is not a number to its start', () => {
		expect(walkerPlacement(-0.4)).toEqual(walkerPlacement(0));
		expect(walkerPlacement(1.7)).toEqual(walkerPlacement(1));
		expect(walkerPlacement(Number.NaN)).toEqual(walkerPlacement(0));
	});

	it('is drawn as an SVG transform of the figure', () => {
		expect(walkerTransform(walkerPlacement(0))).toBe('translate(539 238) scale(1)');
	});
});

describe('levelFraction', () => {
	it('is the XP into the level over the XP the level needs, inside 0..1', () => {
		expect(levelFraction(140, 400)).toBe(0.35);
		expect(levelFraction(-5, 400)).toBe(0);
		expect(levelFraction(500, 400)).toBe(1);
		expect(levelFraction(10, 0)).toBe(0);
	});
});

describe('walkerView: where the walker goes and what the gate says', () => {
	const standing = { level: 5, xpIntoLevel: 140, xpToNext: 400 };

	it('stands at the share of the level and the gate names the next level', () => {
		expect(walkerView(standing, null, null)).toEqual({ fraction: 0.35, gateLevel: 6 });
	});

	it('waits where the record left it while the open sync runs', () => {
		expect(walkerView(standing, 0.2, null)).toEqual({ fraction: 0.2, gateLevel: 6 });
	});

	it('reaches the gate of the level being reached during the ceremony, then stands on the new level', () => {
		expect(walkerView(standing, 0.2, { level: 5, phase: 'fill' })).toEqual({ fraction: 1, gateLevel: 5 });
		expect(walkerView(standing, null, { level: 5, phase: 'medal' })).toEqual({ fraction: 1, gateLevel: 5 });
		expect(walkerView(standing, null, { level: 5, phase: 'final' })).toEqual({ fraction: 0.35, gateLevel: 6 });
	});

	it('names no level and stands at the start without a character', () => {
		expect(walkerView(null, null, null)).toEqual({ fraction: null, gateLevel: null });
	});
});
