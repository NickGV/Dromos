/** Levels at which every skill changes rank (S4). The names and descriptions live in each skill note. */
export const RANK_LEVELS = [1, 5, 10, 15, 20] as const;
export const RANK_COUNT = RANK_LEVELS.length;

/** Index of the rank a skill holds at `level`, or `null` below the first one (a locked skill is level 0). */
export function rankIndexFor(level: number, levels: readonly number[] = RANK_LEVELS): number | null {
	if (!Number.isFinite(level)) return null;
	let index: number | null = null;
	for (const [position, threshold] of levels.entries()) {
		if (level >= threshold) index = position;
	}
	return index;
}
