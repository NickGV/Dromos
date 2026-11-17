import { daysSince } from '../campaign/staleness';
import { isWeekPeriod, type AppNotes, type KairosDay, type SpendingNote } from './AppNotes';
import { addDays, isoWeekStart, lastCompleteWeek, type ReportWeek } from './isoWeek';

/**
 * Kairos writes yesterday's note every few hours, so a newest day older than the day before
 * yesterday means it stopped writing (app-reports S2).
 */
const KAIROS_LATE_AFTER_DAYS = 2;
/** Cheshbon's weekly note arrives on Monday morning: one that ended more than 8 days ago is late (S2). */
const CHESHBON_LATE_AFTER_DAYS = 8;
const DAYS_PER_WEEK = 7;

/** One day of the week's phone strip: Kairos's note for it, or `null` for no data, never a zero. */
export interface PhoneDay {
	readonly date: string;
	readonly note: KairosDay | null;
}

/** The phone of the week, from the Kairos days inside it. */
export interface PhoneWeek {
	/** Monday first, all seven. */
	readonly days: readonly PhoneDay[];
	/** Minutes in watched apps over the days with a note. */
	readonly minutes: number;
	readonly daysWithNote: number;
	/** Days with a note whose `exceeded` is not empty. */
	readonly overDays: number;
	/** The apps that went over their free limit, each once, in the order the week met them. */
	readonly overApps: readonly string[];
}

/** Kairos in the report: present only once it has written some `kairos-day` note. */
export interface KairosReport {
	readonly phone: PhoneWeek;
	/** Its newest day, in any week. */
	readonly newest: string;
	readonly late: boolean;
}

/** The money of the week, from Cheshbon's weekly note for it. */
export interface MoneyWeek {
	readonly spent: number;
	readonly income: number;
	readonly net: number;
}

/** Cheshbon in the report: present only once it has written some `cheshbon-spending-note`, daily ones included. */
export interface CheshbonReport {
	/** `null` when Cheshbon wrote no weekly note for the week. */
	readonly money: MoneyWeek | null;
	/** The Monday of its newest weekly note; `null` while it wrote daily notes only. */
	readonly newestWeek: string | null;
	readonly late: boolean;
}

/**
 * The card "Your week" (app-reports S1, S2): the last complete ISO week, its phone and its money.
 * An app that never wrote a note of its type is `null`; when both are, there is nothing to show.
 */
export interface WeekReport {
	readonly week: ReportWeek;
	readonly kairos: KairosReport | null;
	readonly cheshbon: CheshbonReport | null;
}

/** The report of the last complete week before `today`, read from the notes both apps wrote. */
export function weekReport(notes: AppNotes, today: string): WeekReport {
	const week = lastCompleteWeek(today);
	return { week, kairos: kairosReport(notes.kairos, week, today), cheshbon: cheshbonReport(notes.cheshbon, week, today) };
}

function kairosReport(days: readonly KairosDay[], week: ReportWeek, today: string): KairosReport | null {
	if (days.length === 0) return null;
	// One day per date: a copy of a note never counts twice.
	const byDate = new Map<string, KairosDay>();
	for (const day of days) if (!byDate.has(day.date)) byDate.set(day.date, day);
	const newest = [...byDate.keys()].reduce((latest, date) => (date > latest ? date : latest));
	return { phone: phoneWeek(week, byDate), newest, late: newest < addDays(today, -KAIROS_LATE_AFTER_DAYS) };
}

function phoneWeek(week: ReportWeek, byDate: ReadonlyMap<string, KairosDay>): PhoneWeek {
	const days = week.dates.map((date): PhoneDay => ({ date, note: byDate.get(date) ?? null }));
	const noted = days.flatMap((day) => (day.note ? [day.note] : []));
	const over = noted.filter((note) => note.exceeded.length > 0);
	return {
		days,
		minutes: noted.reduce((sum, note) => sum + note.screenMinutes, 0),
		daysWithNote: noted.length,
		overDays: over.length,
		overApps: [...new Set(over.flatMap((note) => note.exceeded))],
	};
}

function cheshbonReport(notes: readonly SpendingNote[], week: ReportWeek, today: string): CheshbonReport | null {
	if (notes.length === 0) return null;
	const weekly = notes.filter((note) => isWeekPeriod(note.period));
	const own = weekly.find((note) => note.period === week.label);
	const newest = weekly.reduce<SpendingNote | null>((latest, note) => (latest === null || note.period > latest.period ? note : latest), null);
	const newestWeek = newest === null ? null : (newest.start ?? isoWeekStart(newest.period));
	const newestEnd = newest === null ? null : (newest.end ?? (newestWeek === null ? null : addDays(newestWeek, DAYS_PER_WEEK - 1)));
	return {
		money: own ? { spent: own.spent, income: own.income, net: own.net } : null,
		newestWeek,
		late: newestEnd !== null && daysSince(newestEnd, today) > CHESHBON_LATE_AFTER_DAYS,
	};
}
