import type { Progress } from './Campaign';

/**
 * Progress of a campaign habit: the streak of its daily over the target days.
 * Strict: a missed day sends Habitica's streak back to zero, and so the progress.
 */
export function habitProgress(streak: number, days: number): Progress {
	const total = Number.isFinite(days) && days >= 1 ? Math.floor(days) : 1;
	const done = Number.isFinite(streak) && streak > 0 ? Math.min(total, Math.floor(streak)) : 0;
	return { done, total, ratio: done / total };
}
