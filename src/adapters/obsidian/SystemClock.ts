import type { Clock } from '../../ports';

/** Time zone that decides what "today" means in Dromos. */
export const DROMOS_TIME_ZONE = 'America/Bogota';

const dateParts = new Intl.DateTimeFormat('en-US', {
	timeZone: DROMOS_TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
});

/** System clock whose calendar day is the one in America/Bogota. */
export class SystemClock implements Clock {
	/** `currentInstant` is injectable so tests can pin the time. */
	constructor(private readonly currentInstant: () => Date = () => new Date()) {}

	today(): string {
		const parts = dateParts.formatToParts(this.currentInstant());
		const part = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? '';
		return `${part('year')}-${part('month')}-${part('day')}`;
	}

	now(): Date {
		return this.currentInstant();
	}
}
