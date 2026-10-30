import type { Clock } from '../../src/ports';

/** Clock frozen at one instant and one local date. */
export class FixedClock implements Clock {
	constructor(
		private readonly instant: Date,
		private readonly day: string,
	) {}

	today(): string {
		return this.day;
	}

	now(): Date {
		return new Date(this.instant.getTime());
	}
}
