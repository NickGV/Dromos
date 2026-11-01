/**
 * The XP table of `Dromos/Rules.md`: what a completed Habitica task is worth.
 * The numbers in the vault note win; these constants are the defaults.
 */
export type XpKind = 'todo' | 'daily';
export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard';

export interface XpTable {
	readonly todo: Readonly<Record<Difficulty, number>>;
	readonly daily: Readonly<Record<Difficulty, number>>;
	readonly streakBonus: { readonly every: number; readonly xp: number };
}

export const XP_TABLE: XpTable = {
	todo: { trivial: 5, easy: 10, medium: 15, hard: 25 },
	daily: { trivial: 3, easy: 5, medium: 8, hard: 12 },
	streakBonus: { every: 7, xp: 10 },
};

/**
 * Habitica priorities are 0.1, 1, 1.5 and 2. A value between two levels takes the
 * level below; a missing or invalid priority is `easy`, Habitica's own default.
 */
export function difficultyFor(priority: number): Difficulty {
	if (!Number.isFinite(priority)) return 'easy';
	if (priority < 1) return 'trivial';
	if (priority < 1.5) return 'easy';
	if (priority < 2) return 'medium';
	return 'hard';
}

export function xpForTask(kind: XpKind, priority: number, table: XpTable = XP_TABLE): number {
	return table[kind][difficultyFor(priority)];
}

/** The bonus of a daily streak: paid once per milestone, that is on every multiple of `every` days. */
export function streakBonusFor(streak: number, table: XpTable = XP_TABLE): number {
	const { every, xp } = table.streakBonus;
	return Number.isInteger(streak) && streak > 0 && streak % every === 0 ? xp : 0;
}
