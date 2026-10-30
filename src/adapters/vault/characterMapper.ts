import { CHARACTER_CURVE, LevelCurve, STAT_IDS, type Character, type StatId } from '../../domain';

const curve = new LevelCurve(CHARACTER_CURVE);

/**
 * Maps the frontmatter of `Character.md` to a `Character` (S2). Reads `name`,
 * `title`, `total_xp` and `stats.<StatId>`; `level`, `xpIntoLevel` and `xpToNext`
 * are derived from `total_xp` (D2), so the stored `level` and `xp_to_next` are
 * ignored. A missing or wrongly typed text falls back to `''`; a missing,
 * non-numeric, negative or non-finite number falls back to `0`. Never `NaN`.
 */
export function characterFromFrontmatter(frontmatter: unknown): Character {
	const fields = asRecord(frontmatter);
	const totalXp = countOrZero(fields.total_xp);
	const { level, xpIntoLevel, xpToNext } = curve.progressFor(totalXp);
	return {
		name: textOrEmpty(fields.name),
		title: textOrEmpty(fields.title),
		level,
		totalXp,
		xpIntoLevel,
		xpToNext,
		stats: statsFrom(fields.stats),
	};
}

function asRecord(value: unknown): Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function textOrEmpty(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

function countOrZero(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function statsFrom(value: unknown): Record<StatId, number> {
	const raw = asRecord(value);
	return Object.fromEntries(STAT_IDS.map((id) => [id, countOrZero(raw[id])])) as Record<StatId, number>;
}
