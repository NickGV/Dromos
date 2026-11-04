/**
 * Time zone that decides what "today" means in Dromos. The clock and every date read from
 * Habitica go through `localDateOf`, so the two can never disagree about the day.
 */
export const DROMOS_TIME_ZONE = 'America/Bogota';

const DATE_PARTS = new Intl.DateTimeFormat('en-US', {
	timeZone: DROMOS_TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
});

/** `YYYY-MM-DD` of an instant in `DROMOS_TIME_ZONE`. */
export function localDateOf(instant: Date): string {
	const parts = DATE_PARTS.formatToParts(instant);
	const part = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? '';
	return `${part('year')}-${part('month')}-${part('day')}`;
}
