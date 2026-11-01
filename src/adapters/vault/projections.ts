import { STAT_IDS, type StatId } from '../../domain';
import { asRecord } from './frontmatterFields';

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

/** Writes the projection into the frontmatter of `Character.md`. Meant for the callback of `processFrontMatter`. */
export function applyCharacterProjection(frontmatter: Record<string, unknown>, projection: CharacterProjection): void {
	const stats = asRecord(frontmatter.stats);
	for (const id of STAT_IDS) stats[id] = projection.stats[id];
	frontmatter.level = projection.level;
	frontmatter.total_xp = projection.totalXp;
	frontmatter.xp_to_next = projection.xpToNext;
	frontmatter.stats = stats;
	frontmatter.last_sync = projection.lastSync;
	frontmatter.updated_by = 'dromos';
}

/**
 * True when the note disagrees with the projection. `last_sync` and `updated_by`
 * are left out on purpose: a new day alone must not rewrite the note.
 */
export function characterProjectionChanged(frontmatter: unknown, projection: CharacterProjection): boolean {
	const fields = asRecord(frontmatter);
	const stats = asRecord(fields.stats);
	return (
		fields.level !== projection.level ||
		fields.total_xp !== projection.totalXp ||
		fields.xp_to_next !== projection.xpToNext ||
		STAT_IDS.some((id) => stats[id] !== projection.stats[id])
	);
}

export function applySkillProjection(frontmatter: Record<string, unknown>, projection: SkillProjection): void {
	frontmatter.unlocked = projection.unlocked;
	frontmatter.unlocked_on = projection.unlockedOn;
	frontmatter.level = projection.level;
	frontmatter.xp = projection.xp;
	frontmatter.xp_to_next = projection.xpToNext;
}

export function skillProjectionChanged(frontmatter: unknown, projection: SkillProjection): boolean {
	const fields = asRecord(frontmatter);
	return (
		fields.unlocked !== projection.unlocked ||
		(fields.unlocked_on ?? null) !== projection.unlockedOn ||
		fields.level !== projection.level ||
		fields.xp !== projection.xp ||
		(fields.xp_to_next ?? null) !== projection.xpToNext
	);
}
