import { mondayOf } from '../ledger/weeklyHistory';

const MS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;
const WEEK_LABEL = /^(\d{4})-W(\d{2})$/;

/** A Monday-to-Sunday week, its days inclusive, and its ISO label. */
export interface ReportWeek {
	/** The Monday, `YYYY-MM-DD`. */
	readonly start: string;
	/** The Sunday, `YYYY-MM-DD`. */
	readonly end: string;
	/** `2026-W46`. */
	readonly label: string;
	/** Its seven days, Monday first. */
	readonly dates: readonly string[];
}

/** True for a real calendar day written `YYYY-MM-DD`: `2026-02-30` and date-times are not. */
export function isCalendarDate(value: unknown): value is string {
	if (typeof value !== 'string' || !CALENDAR_DATE.test(value)) return false;
	const time = toUtc(value);
	return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
}

/** A calendar day `days` after `date`, read through UTC so no time zone moves it. */
export function addDays(date: string, days: number): string {
	return new Date(toUtc(date) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/**
 * The last complete ISO week before `today`, Monday to Sunday (app-reports S1): on Tuesday
 * 2026-11-17 it is 2026-11-09 to 2026-11-15, `2026-W46`; on a Sunday, its own week is not over yet.
 */
export function lastCompleteWeek(today: string): ReportWeek {
	const start = addDays(mondayOf(today), -DAYS_PER_WEEK);
	const dates = Array.from({ length: DAYS_PER_WEEK }, (_, index) => addDays(start, index));
	return { start, end: dates[DAYS_PER_WEEK - 1] ?? start, label: isoWeekLabel(start), dates };
}

/** The ISO week of a calendar day, `2026-W46`: the year is the year of the week's Thursday. */
export function isoWeekLabel(date: string): string {
	const monday = mondayOf(date);
	const year = addDays(monday, 3).slice(0, 4);
	const week = Math.round((toUtc(monday) - toUtc(mondayOf(`${year}-01-04`))) / (MS_PER_DAY * DAYS_PER_WEEK)) + 1;
	return `${year}-W${String(week).padStart(2, '0')}`;
}

/** The Monday of an ISO week label, or `null` when the label names no week (`2025-W53`, `2026-W00`). */
export function isoWeekStart(label: string): string | null {
	const match = WEEK_LABEL.exec(label);
	if (!match) return null;
	const week = Number(match[2]);
	if (week < 1) return null;
	const start = addDays(mondayOf(`${match[1] ?? ''}-01-04`), (week - 1) * DAYS_PER_WEEK);
	return isoWeekLabel(start) === label ? start : null;
}

function toUtc(date: string): number {
	return Date.parse(`${date}T00:00:00Z`);
}
