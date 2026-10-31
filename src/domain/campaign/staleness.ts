import type { Campaign } from './Campaign';

/** Plugin-wide default; a campaign may override it with `stale_after_days`. */
export const DEFAULT_STALE_AFTER_DAYS = 14;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcDay(date: string): number {
	return Date.parse(`${date}T00:00:00Z`) / MS_PER_DAY;
}

/** Calendar days from `from` to `to`, both `YYYY-MM-DD`. */
export function daysSince(from: string, to: string): number {
	return Math.round(toUtcDay(to) - toUtcDay(from));
}

/**
 * Latest completion date among the tasks; `created` when nothing was ever
 * completed. Completed tasks with an unknown date are ignored.
 */
export function lastActivity(campaign: Campaign): string {
	const dates = campaign.tasks.flatMap((task) => (task.completed && task.completedOn ? [task.completedOn] : []));
	return dates.length === 0 ? campaign.created : dates.reduce((latest, date) => (date > latest ? date : latest));
}

/**
 * An active campaign is stale once `staleAfterDays` days have passed since its
 * last activity (13 days is fine, 14 is stale). Other statuses are never stale.
 */
export function isStale(campaign: Campaign, today: string, defaultStaleAfterDays = DEFAULT_STALE_AFTER_DAYS): boolean {
	if (campaign.status !== 'active') return false;

	const threshold = campaign.staleAfterDays ?? defaultStaleAfterDays;
	return daysSince(lastActivity(campaign), today) >= threshold;
}
