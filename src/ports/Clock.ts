/** Time source, so rules never read the system clock themselves. */
export interface Clock {
	/** Today's local date as `YYYY-MM-DD` (America/Bogota for Dromos). */
	today(): string;
	/** The current instant. */
	now(): Date;
}
