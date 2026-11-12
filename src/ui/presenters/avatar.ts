import type { StageId } from '../../domain/character/Stage';

/** Where a skill's object sits on the figure, the same on the plaque's bust and on the road's walker. */
export type ObjectSpot = 'head' | 'back' | 'hand' | 'staff' | 'belt' | 'strap' | 'clasp' | 'satchel' | 'neck' | 'hem';

/**
 * The object each skill gives the figure (M11 L10), by skill id, and the spot it takes. Two skills
 * share a spot only when their objects cannot be worn together; a skill with no entry gives nothing.
 */
export const SKILL_OBJECT_SPOTS: Readonly<Record<string, ObjectSpot>> = {
	atleta: 'head',
	centinela: 'back',
	cronista: 'hand',
	cuidador: 'staff',
	desarrollador: 'belt',
	escriba: 'strap',
	estudiante: 'clasp',
	exegeta: 'hand',
	labiolector: 'strap',
	lector: 'satchel',
	maestro: 'neck',
	mayordomo: 'belt',
	mnemonista: 'hem',
	reposo: 'neck',
};

/** How many skill objects the figure carries at once: a fourth crowds the bust and is lost on the walker (L10). */
export const MAX_SKILL_OBJECTS = 3;

/** What the plaque's portrait and the road's walker draw: the stage, and the skills whose objects show. */
export interface AvatarView {
	readonly stage: StageId;
	/** Skill ids with an entry in `SKILL_OBJECT_SPOTS`, one per spot, at most `MAX_SKILL_OBJECTS`, the highest skill first. */
	readonly objects: readonly string[];
}

/** The figure before anything is known: the young runner, carrying nothing. */
export const FIRST_AVATAR: AvatarView = { stage: 'runner', objects: [] };
