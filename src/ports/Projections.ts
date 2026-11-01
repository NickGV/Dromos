import type { StatId } from '../domain';

/** The fields of `Character.md` that Dromos derives from the ledger. The rest of the note is not Dromos's. */
export interface CharacterProjection {
	readonly level: number;
	readonly totalXp: number;
	/** XP the current level asks for, as the note has always shown it. */
	readonly xpToNext: number;
	readonly stats: Readonly<Record<StatId, number>>;
	/** Local date as `YYYY-MM-DD` of the sync that wrote this. */
	readonly lastSync: string;
}

/** The fields of a skill note that Dromos derives; `requirements`, ranks and text are never touched. */
export interface SkillProjection {
	readonly unlocked: boolean;
	readonly unlockedOn: string | null;
	readonly level: number;
	readonly xp: number;
	/** `null` while the skill is locked. */
	readonly xpToNext: number | null;
}
