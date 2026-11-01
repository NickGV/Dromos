import { evaluateUnlock, type UnlockEvidence } from './requirements';
import type { Skill } from './Skill';

export interface UnlockState {
	readonly unlocked: boolean;
	readonly unlockedOn: string | null;
	/** True when this evaluation is the one that unlocked the skill: a level-up style moment. */
	readonly justUnlocked: boolean;
}

/**
 * The unlock state of a skill after a sync (S2). An unlock is permanent: once a
 * skill is unlocked it stays so, whatever the evidence says later. A skill the
 * user unlocked by hand keeps `unlocked` and gets today's date if it has none.
 */
export function resolveUnlock(skill: Skill, evidence: UnlockEvidence, today: string): UnlockState {
	if (skill.unlocked) {
		return skill.unlockedOn === null
			? { unlocked: true, unlockedOn: today, justUnlocked: true }
			: { unlocked: true, unlockedOn: skill.unlockedOn, justUnlocked: false };
	}
	if (evaluateUnlock(skill.requirements, evidence).met) return { unlocked: true, unlockedOn: today, justUnlocked: true };
	return { unlocked: false, unlockedOn: null, justUnlocked: false };
}
