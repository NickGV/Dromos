/** What a row of the purse records (M10 S3, ADR-019): a purchase, or the gold bonus of a level. */
export type PurseKind = 'purchase' | 'bonus';

/**
 * One row of the purse, `<Dromos folder>/Purse.md`, which only Dromos writes and only once Habitica
 * confirmed: a purchase (its price as negative gold, with the offer's `id` when it was one of
 * Esdras's offers) or a level's bonus (with its level).
 */
export interface PurseEntry {
	/** Local date as `YYYY-MM-DD`. */
	readonly date: string;
	readonly kind: PurseKind;
	/** The reward or offer bought, or the level a bonus paid ("Level 3"). */
	readonly what: string;
	/** Signed: a purchase is negative, a bonus positive. */
	readonly gold: number;
	/** The level a bonus paid; `null` on a purchase. */
	readonly level: number | null;
	/** The `id` of the offer a purchase bought; `null` otherwise. */
	readonly offer: string | null;
}

/** The gold of a new level when the rules note does not set `goldPerLevel`. */
export const DEFAULT_GOLD_PER_LEVEL = 10;

/** The bonus of reaching `level` (M10 S3): `goldPerLevel` gold for each level, so level 3 pays 30 by default. */
export function levelBonus(goldPerLevel: number, level: number): number {
	return goldPerLevel * level;
}

/** The levels a level-up from `before` to `after` reached, lowest first: two levels at once are both. */
export function levelsReached(before: number, after: number): number[] {
	const levels: number[] = [];
	for (let level = before + 1; level <= after; level += 1) levels.push(level);
	return levels;
}

/** The levels whose bonus the purse already holds. */
export function paidLevels(entries: readonly PurseEntry[]): Set<number> {
	return new Set(entries.flatMap((entry) => (entry.kind === 'bonus' && entry.level !== null ? [entry.level] : [])));
}

/** `levels` without the ones the purse already paid, each once, lowest first: a level is never paid twice. */
export function unpaidLevels(levels: readonly number[], entries: readonly PurseEntry[]): number[] {
	const paid = paidLevels(entries);
	return [...new Set(levels)].filter((level) => !paid.has(level)).sort((left, right) => left - right);
}

/** The last `count` purchases of the purse, newest first; a later row of the same day counts as newer. */
export function lastPurchases(entries: readonly PurseEntry[], count: number): PurseEntry[] {
	return entries
		.map((entry, index) => ({ entry, index }))
		.filter(({ entry }) => entry.kind === 'purchase')
		.sort((left, right) => right.entry.date.localeCompare(left.entry.date) || right.index - left.index)
		.slice(0, count)
		.map(({ entry }) => entry);
}
