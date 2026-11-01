import { STAT_IDS } from '../../domain';
import type { CharacterProjection, SkillProjection } from '../../ports';
import { asRecord } from './frontmatterFields';

/** Writes the projection into the frontmatter of `Character.md`. Meant for the callback of `processFrontMatter`. */
export function applyCharacterProjection(frontmatter: Record<string, unknown>, projection: CharacterProjection): void {
	const stats = asRecord(frontmatter.stats);
	for (const id of STAT_IDS) stats[id] = projection.stats[id];
	frontmatter.level = projection.level;
	frontmatter.total_xp = projection.totalXp;
	frontmatter.xp_to_next = projection.xpToNext;
	frontmatter.stats = stats;
	frontmatter.game_start = projection.gameStart;
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
		fields.game_start !== projection.gameStart ||
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
