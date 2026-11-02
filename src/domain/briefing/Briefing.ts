/** The command of Esdras's job, which writes the briefing. It runs in OpenCode, from the vault's folder. */
export const BRIEFING_COMMAND = '/dromos-briefing';

/** The mission of the day, as Esdras wrote it. */
export interface BriefingMission {
	readonly title: string;
	readonly why: string | null;
}

/** `Dromos/Briefing.md`. Esdras writes it every day and Dromos only reads it. */
export interface Briefing {
	readonly path: string;
	/** The day it was written, `YYYY-MM-DD`; `null` when the note does not say. */
	readonly created: string | null;
	readonly mission: BriefingMission | null;
	/** The skill Esdras says is close. What it still asks comes from the game, not from the note. */
	readonly nearSkillId: string | null;
	/** The note without its frontmatter. */
	readonly body: string;
}

/** Whether the briefing was written on `day`. A note that names no day was written on none. */
export function isBriefingOf(briefing: Briefing, day: string): boolean {
	return briefing.created === day;
}
