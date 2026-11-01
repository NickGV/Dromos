/** Levels at which every skill changes rank (S4). The names and descriptions live in each skill note. */
export const RANK_LEVELS = [1, 5, 10, 15, 20] as const;
export const RANK_COUNT = RANK_LEVELS.length;

/** Index of the rank a skill holds at `level`, or `null` below level 1 (a locked skill is level 0). */
export function rankIndexFor(level: number): number | null {
	if (!Number.isFinite(level) || level < RANK_LEVELS[0]) return null;
	let index = 0;
	RANK_LEVELS.forEach((threshold, position) => {
		if (level >= threshold) index = position;
	});
	return index;
}
