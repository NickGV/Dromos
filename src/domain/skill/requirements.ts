import type { Requirement } from './Skill';

/** What the plugin counted for one skill: the input of the countable requirements. */
export interface UnlockEvidence {
	/** Distinct completed to-dos with the skill tag. */
	readonly quests: number;
	/** Completed campaigns whose skills include the skill. */
	readonly campaigns: number;
	/** Longest current streak among the campaign habits of the skill. */
	readonly habitStreak: number;
}

export interface RequirementProgress {
	readonly requirement: Requirement;
	readonly done: number;
	readonly total: number;
	readonly met: boolean;
}

export interface UnlockCheck {
	readonly items: readonly RequirementProgress[];
	/** True when there is at least one requirement and all of them are met. */
	readonly met: boolean;
}

/** Progress of one requirement, shown as "3 of 5"; `done` never passes `total`. */
export function requirementProgress(requirement: Requirement, evidence: UnlockEvidence): RequirementProgress {
	switch (requirement.kind) {
		case 'quests':
			return counted(requirement, requirement.count, evidence.quests);
		case 'campaigns':
			return counted(requirement, requirement.count, evidence.campaigns);
		case 'habit':
			return counted(requirement, requirement.days, evidence.habitStreak);
		case 'manual':
			return { requirement, done: requirement.confirmed ? 1 : 0, total: 1, met: requirement.confirmed };
	}
}

/**
 * Every requirement must be met (S7). A skill without requirements is never met
 * here: it unlocks only when someone sets `unlocked` by hand.
 */
export function evaluateUnlock(requirements: readonly Requirement[], evidence: UnlockEvidence): UnlockCheck {
	const items = requirements.map((requirement) => requirementProgress(requirement, evidence));
	return { items, met: items.length > 0 && items.every((item) => item.met) };
}

/** A target below one (or not a number) still asks for one, so a typo is never a free unlock. */
function counted(requirement: Requirement, target: number, value: number): RequirementProgress {
	const total = Number.isFinite(target) && target >= 1 ? Math.floor(target) : 1;
	const done = Number.isFinite(value) && value > 0 ? Math.min(total, Math.floor(value)) : 0;
	return { requirement, done, total, met: done >= total };
}
