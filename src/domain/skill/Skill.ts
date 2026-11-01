import type { StatId } from '../character/Character';

export interface SkillRank {
	readonly name: string;
	readonly description: string;
}

/**
 * What a skill asks before it unlocks (S7). The first three are counted by the
 * plugin; `manual` is confirmed by the user or by Esdras.
 * - `quests`: distinct completed to-dos with the skill tag (dailies never count).
 * - `campaigns`: completed campaigns whose skills include this one.
 * - `habit`: a daily tagged with the skill (a campaign habit is one) reached that many days of streak (strict).
 */
export type Requirement =
	| { readonly kind: 'quests'; readonly count: number }
	| { readonly kind: 'campaigns'; readonly count: number }
	| { readonly kind: 'habit'; readonly days: number }
	| { readonly kind: 'manual'; readonly id: string; readonly text: string; readonly confirmed: boolean; readonly confirmedOn: string | null };

/** A skill as `Dromos/Skills/<id>.md` describes it. All 16 start locked and are earned (S2). */
export interface Skill {
	readonly id: string;
	readonly name: string;
	readonly icon: string;
	readonly stat: StatId;
	readonly description: string;
	/** Habitica tag, `skill/<id>`. */
	readonly habiticaTag: string;
	/** Five ranks in order; the levels they start at are shared (`RANK_LEVELS`). */
	readonly ranks: readonly SkillRank[];
	/** All of them must be met to unlock. */
	readonly requirements: readonly Requirement[];
	readonly unlocked: boolean;
	/** Local date as `YYYY-MM-DD` of the unlock, or `null` while locked. */
	readonly unlockedOn: string | null;
}

const TAG_PREFIX = 'skill/';

export function skillTag(id: string): string {
	return `${TAG_PREFIX}${id}`;
}

/** The skill id of a `skill/<id>` tag, or `null` when the tag is not one or the id has spaces, slashes or pipes (it is a file name and a ledger cell). */
export function skillIdFromTag(tag: string): string | null {
	const trimmed = tag.trim().toLowerCase();
	if (!trimmed.startsWith(TAG_PREFIX)) return null;
	const id = trimmed.slice(TAG_PREFIX.length).trim();
	return id === '' || /[\s/|\\]/.test(id) ? null : id;
}
