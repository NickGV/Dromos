import { describe, expect, it } from 'vitest';
import { resolveUnlock } from '../../../src/domain/skill/unlock';
import { skill } from './skillFixtures';

const MET = { quests: 5, campaigns: 0, habitStreak: 0 };
const NOT_MET = { quests: 4, campaigns: 0, habitStreak: 0 };

describe('resolveUnlock', () => {
	it('stays locked while the requirements are not met', () => {
		expect(resolveUnlock(skill(), NOT_MET, '2026-11-03')).toEqual({ unlocked: false, unlockedOn: null, justUnlocked: false });
	});

	it('unlocks today the moment the requirements are met', () => {
		expect(resolveUnlock(skill(), MET, '2026-11-03')).toEqual({ unlocked: true, unlockedOn: '2026-11-03', justUnlocked: true });
	});

	it('an unlock is permanent: it stays even if the evidence drops (S2)', () => {
		const owned = skill({ unlocked: true, unlockedOn: '2026-11-03' });

		expect(resolveUnlock(owned, NOT_MET, '2026-12-01')).toEqual({ unlocked: true, unlockedOn: '2026-11-03', justUnlocked: false });
	});

	it('keeps the original date when it is evaluated again', () => {
		const owned = skill({ unlocked: true, unlockedOn: '2026-11-03' });

		expect(resolveUnlock(owned, MET, '2026-12-01').unlockedOn).toBe('2026-11-03');
	});

	it('a skill the user unlocked by hand gets the date of the first sync', () => {
		const byHand = skill({ unlocked: true, unlockedOn: null });

		expect(resolveUnlock(byHand, NOT_MET, '2026-11-09')).toEqual({ unlocked: true, unlockedOn: '2026-11-09', justUnlocked: true });
	});

	it('a skill without requirements unlocks only by hand', () => {
		expect(resolveUnlock(skill({ requirements: [] }), MET, '2026-11-03').unlocked).toBe(false);
		expect(resolveUnlock(skill({ requirements: [], unlocked: true }), MET, '2026-11-03').unlocked).toBe(true);
	});
});
