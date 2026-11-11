import { rankOf, type Skill, type SkillStanding } from '../domain';

/**
 * Something worth a banner the next time the view opens (S10). A level's gold bonus (M10 S3) is
 * only told, as a toast: the ceremony is the level's.
 */
export type GameEvent =
	| { readonly kind: 'character-level'; readonly level: number }
	/** `gold` was added to Habitica for reaching `level`; `recorded` is false when the purse could not keep its row. */
	| { readonly kind: 'level-bonus'; readonly level: number; readonly gold: number; readonly recorded: boolean }
	| { readonly kind: 'skill-unlocked'; readonly skillId: string; readonly name: string }
	| {
			readonly kind: 'skill-level';
			readonly skillId: string;
			readonly name: string;
			readonly level: number;
			/** Name of the rank the skill holds now, or `null` when the note does not describe it. */
			readonly rank: string | null;
			readonly rankChanged: boolean;
	  };

/** What one sync did to one skill. `skill` is the skill as it stands after the sync. */
export interface SkillChange {
	readonly skill: Skill;
	readonly justUnlocked: boolean;
	readonly before: SkillStanding;
	readonly after: SkillStanding;
}

/**
 * The events a sync produced, character first and then each skill in the order given.
 * An unlock is one event; a skill that was already unlocked reports a level-up, with its
 * new rank and whether the rank changed.
 */
export function detectEvents(characterLevelBefore: number, characterLevelAfter: number, changes: readonly SkillChange[]): GameEvent[] {
	const events: GameEvent[] = [];
	if (characterLevelAfter > characterLevelBefore) events.push({ kind: 'character-level', level: characterLevelAfter });
	for (const { skill, justUnlocked, before, after } of changes) {
		if (justUnlocked) {
			events.push({ kind: 'skill-unlocked', skillId: skill.id, name: skill.name });
		} else if (before.level >= 1 && after.level > before.level) {
			events.push({
				kind: 'skill-level',
				skillId: skill.id,
				name: skill.name,
				level: after.level,
				rank: rankOf(skill, after.rankIndex)?.name ?? null,
				rankChanged: after.rankIndex !== before.rankIndex,
			});
		}
	}
	return events;
}
