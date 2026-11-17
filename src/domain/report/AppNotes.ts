/**
 * The notes two other apps write into the vault (Dromos ADR-022), as Dromos reads them: frontmatter
 * only, never the body, and never written back. Dromos keeps only the keys the week card needs.
 */

/** One day Kairos wrote: a `type: kairos-day` note, one per local day. */
export interface KairosDay {
	/** The local day, `YYYY-MM-DD`. */
	readonly date: string;
	/** Minutes in the watched apps Kairos has enabled, not the total screen time; never negative. */
	readonly screenMinutes: number;
	/** Display names of the watched apps that stayed under their free limit. */
	readonly underLimit: readonly string[];
	/** Display names of the watched apps that went over their free limit that day. */
	readonly exceeded: readonly string[];
}

/** One finished period Cheshbon wrote: a `type: cheshbon-spending-note` note, one per period. */
export interface SpendingNote {
	/** `2026-W46` for a week, `2026-11-16` for a day. */
	readonly period: string;
	/** First day of the period, inclusive, `YYYY-MM-DD`; `null` when the note has no valid one. */
	readonly start: string | null;
	/** Last day of the period, inclusive, `YYYY-MM-DD`; `null` when the note has no valid one. */
	readonly end: string | null;
	/** Whole COP. */
	readonly spent: number;
	/** Whole COP. */
	readonly income: number;
	/** Whole COP, as Cheshbon wrote it; may be negative. */
	readonly net: number;
}

/** Everything both apps wrote, one note per Kairos day and one per Cheshbon period. */
export interface AppNotes {
	readonly kairos: readonly KairosDay[];
	readonly cheshbon: readonly SpendingNote[];
}

const WEEK_PERIOD = /^\d{4}-W\d{2}$/;

/** True for a weekly period, `2026-W46`; a day, `2026-11-16`, is not one. */
export function isWeekPeriod(period: string): boolean {
	return WEEK_PERIOD.test(period);
}
