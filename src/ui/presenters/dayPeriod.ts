/** The four times of day the sky of the scene follows (game-ui S17). */
export type DayPeriod = 'dawn' | 'day' | 'dusk' | 'night';

/** The local hour each period starts at; night runs past midnight to dawn. */
export const PERIOD_START = { dawn: 5, day: 8, dusk: 18, night: 21 } as const;

/**
 * The time of day at `now` on the device's own clock: dawn from 05:00, day from 08:00, dusk from
 * 18:00 and night from 21:00 to 05:00. A time that is not a valid date reads as day.
 */
export function dayPeriod(now: Date): DayPeriod {
	const hour = now.getHours();
	if (!Number.isFinite(hour)) return 'day';
	if (hour >= PERIOD_START.night || hour < PERIOD_START.dawn) return 'night';
	if (hour >= PERIOD_START.dusk) return 'dusk';
	if (hour >= PERIOD_START.day) return 'day';
	return 'dawn';
}
