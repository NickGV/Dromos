import { describe, expect, it } from 'vitest';
import { evaluateUnlock, requirementProgress, type UnlockEvidence } from '../../../src/domain/skill/requirements';

const NOTHING: UnlockEvidence = { quests: 0, campaigns: 0, habitStreak: 0 };

describe('requirementProgress: countable requirements', () => {
	it('quests: distinct completed to-dos with the skill tag over the count ("3 de 5")', () => {
		expect(requirementProgress({ kind: 'quests', count: 5 }, { ...NOTHING, quests: 3 })).toMatchObject({ done: 3, total: 5, met: false });
	});

	it('campaigns: completed campaigns of the skill over the count', () => {
		expect(requirementProgress({ kind: 'campaigns', count: 1 }, { ...NOTHING, campaigns: 1 })).toMatchObject({ done: 1, total: 1, met: true });
	});

	it('habit: the streak of the habit over its target days (strict streak)', () => {
		expect(requirementProgress({ kind: 'habit', days: 21 }, { ...NOTHING, habitStreak: 12 })).toMatchObject({ done: 12, total: 21, met: false });
		expect(requirementProgress({ kind: 'habit', days: 21 }, { ...NOTHING, habitStreak: 21 })).toMatchObject({ done: 21, total: 21, met: true });
	});

	it('never shows more done than the total', () => {
		expect(requirementProgress({ kind: 'quests', count: 5 }, { ...NOTHING, quests: 9 })).toMatchObject({ done: 5, total: 5, met: true });
	});

	it.each([0, -3, Number.NaN])('a count of %s still asks for one, so it is never a free unlock', (count) => {
		expect(requirementProgress({ kind: 'quests', count }, NOTHING)).toMatchObject({ done: 0, total: 1, met: false });
	});

	it('reads missing or invalid evidence as zero', () => {
		const broken = { quests: Number.NaN, campaigns: -2, habitStreak: Number.POSITIVE_INFINITY };

		expect(requirementProgress({ kind: 'quests', count: 2 }, broken).done).toBe(0);
		expect(requirementProgress({ kind: 'campaigns', count: 2 }, broken).done).toBe(0);
		expect(requirementProgress({ kind: 'habit', days: 2 }, broken).done).toBe(0);
	});
});

describe('requirementProgress: manual requirements', () => {
	const manual = (confirmed: boolean) => ({ kind: 'manual' as const, id: 'deep-work-test', text: 'Passed the week-1 Deep Work Test', confirmed, confirmedOn: null });

	it('is met only when someone confirmed it', () => {
		expect(requirementProgress(manual(false), NOTHING)).toMatchObject({ done: 0, total: 1, met: false });
		expect(requirementProgress(manual(true), NOTHING)).toMatchObject({ done: 1, total: 1, met: true });
	});
});

describe('evaluateUnlock: every requirement must be met (S7)', () => {
	const requirements = [
		{ kind: 'quests' as const, count: 2 },
		{ kind: 'habit' as const, days: 21 },
		{ kind: 'manual' as const, id: 'check', text: 'Medical check', confirmed: true, confirmedOn: '2026-11-01' },
	];

	it('is met when all of them are', () => {
		const result = evaluateUnlock(requirements, { quests: 2, campaigns: 0, habitStreak: 21 });

		expect(result.met).toBe(true);
		expect(result.items.map((item) => item.met)).toEqual([true, true, true]);
	});

	it('is not met when one is missing, and still reports the others', () => {
		const result = evaluateUnlock(requirements, { quests: 2, campaigns: 0, habitStreak: 20 });

		expect(result.met).toBe(false);
		expect(result.items.map((item) => item.met)).toEqual([true, false, true]);
	});

	it('a skill without requirements is never met by itself: only a hand edit unlocks it', () => {
		expect(evaluateUnlock([], NOTHING)).toEqual({ items: [], met: false });
	});
});
