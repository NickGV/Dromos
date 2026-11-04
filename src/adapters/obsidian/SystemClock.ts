import type { Clock } from '../../ports';
import { localDateOf } from '../localDate';

/** System clock whose calendar day is the one in Dromos' time zone (`DROMOS_TIME_ZONE`). */
export class SystemClock implements Clock {
	/** `currentInstant` is injectable so tests can pin the time. */
	constructor(private readonly currentInstant: () => Date = () => new Date()) {}

	today(): string {
		return localDateOf(this.currentInstant());
	}

	now(): Date {
		return this.currentInstant();
	}
}
