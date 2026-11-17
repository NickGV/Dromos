import { isCalendarDate, isoWeekStart, isWeekPeriod, type AppNotes, type KairosDay, type SpendingNote } from '../../domain';
import { asRecord, fileName } from './frontmatterFields';

/** The note type Kairos writes, one per local day (Dromos ADR-022). */
export const KAIROS_DAY_TYPE = 'kairos-day';
/** The note type Cheshbon writes, one per finished period (Dromos ADR-022). */
export const CHESHBON_NOTE_TYPE = 'cheshbon-spending-note';

/** A note of either type as the mapper sees it: its path and its cached frontmatter, no `obsidian` types. */
export interface AppNote {
	readonly path: string;
	readonly frontmatter: unknown;
}

/** " (1)" at the end of a file name: the copy a sync leaves next to the note. */
const NUMBERED_COPY = / \(\d+\)$/;
const WHOLE_NUMBER = /^\s*-?\d+\s*$/;

/**
 * The pure core of the repository (app-reports S3): the Kairos days and the Cheshbon periods of
 * `notes`, by `type` alone. Only the keys the week card needs are read; a note that cannot be placed
 * (no valid `date`, no valid `period`) is skipped, and any other bad value falls back to 0 or to an
 * empty list, never `NaN`. A copy counts once: one Kairos day per `date`, the note named exactly
 * `<date>.md` first, and one Cheshbon note per `period`, a note that is not a numbered copy first.
 */
export function buildAppNotes(notes: readonly AppNote[]): AppNotes {
	const kairos = new Map<string, { readonly path: string; readonly day: KairosDay }>();
	const cheshbon = new Map<string, { readonly path: string; readonly note: SpendingNote }>();
	for (const { path, frontmatter } of notes) {
		const fields = asRecord(frontmatter);
		if (fields.type === KAIROS_DAY_TYPE) {
			const day = kairosDayFrom(fields);
			const kept = day && kairos.get(day.date);
			if (day && (!kept || prefersKairos(path, kept.path, day.date))) kairos.set(day.date, { path, day });
		} else if (fields.type === CHESHBON_NOTE_TYPE) {
			const note = spendingNoteFrom(fields);
			const kept = note && cheshbon.get(note.period);
			if (note && (!kept || prefersCheshbon(path, kept.path))) cheshbon.set(note.period, { path, note });
		}
	}
	return {
		kairos: [...kairos.values()].map((entry) => entry.day).sort((a, b) => compare(a.date, b.date)),
		cheshbon: [...cheshbon.values()].map((entry) => entry.note).sort((a, b) => compare(a.period, b.period)),
	};
}

function kairosDayFrom(fields: Record<string, unknown>): KairosDay | null {
	if (!isCalendarDate(fields.date)) return null;
	return { date: fields.date, screenMinutes: Math.max(0, wholeNumber(fields.screen_minutes)), underLimit: names(fields.under_limit), exceeded: names(fields.exceeded) };
}

function spendingNoteFrom(fields: Record<string, unknown>): SpendingNote | null {
	const period = fields.period;
	if (typeof period !== 'string' || !(isWeekPeriod(period) ? isoWeekStart(period) !== null : isCalendarDate(period))) return null;
	return {
		period,
		start: isCalendarDate(fields.start) ? fields.start : null,
		end: isCalendarDate(fields.end) ? fields.end : null,
		spent: wholeNumber(fields.spent),
		income: wholeNumber(fields.income),
		net: wholeNumber(fields.net),
	};
}

/** A whole number, written as a number or as digits in a text; a fraction is rounded; anything else is 0. */
function wholeNumber(value: unknown): number {
	const number = typeof value === 'string' && WHOLE_NUMBER.test(value) ? Number(value) : value;
	return typeof number === 'number' && Number.isFinite(number) ? Math.round(number) : 0;
}

/** The app names of a list, trimmed; a value that is not a list is none, and an entry that is not a name is skipped. */
function names(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((entry) => (typeof entry === 'string' && entry.trim() !== '' ? [entry.trim()] : []));
}

/** True when the note at `path` should replace the one kept for `date`: it is named `<date>.md` and the kept one is not, or neither is and it sorts first. */
function prefersKairos(path: string, kept: string, date: string): boolean {
	const exact = fileName(path) === date;
	const keptExact = fileName(kept) === date;
	return exact === keptExact ? compare(path, kept) < 0 : exact;
}

/** True when the note at `path` should replace the kept one of its period: it is not a numbered copy and the kept one is, or both are alike and it sorts first. */
function prefersCheshbon(path: string, kept: string): boolean {
	const original = !NUMBERED_COPY.test(fileName(path));
	const keptOriginal = !NUMBERED_COPY.test(fileName(kept));
	return original === keptOriginal ? compare(path, kept) < 0 : original;
}

function compare(a: string, b: string): number {
	return a < b ? -1 : a > b ? 1 : 0;
}
