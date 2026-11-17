import type { CheshbonReport, KairosReport, PhoneDay, WeekReport } from '../../domain';
import { plural, type Translator } from '../../i18n';
import { dayMonth, longDate, monthLong, weekdayLong, weekdayShort } from './dates';

/** One day of the phone strip, Monday first. */
export interface PhoneDayView {
	readonly key: string;
	/** "lun". */
	readonly label: string;
	/** The day of the month, "9". */
	readonly date: string;
	/** Above the bar: "38", "0"; empty for a day without a note. */
	readonly value: string;
	/** In percent of the strip; 0 for a day without a note. */
	readonly height: number;
	/** Some watched app went over its free limit that day. */
	readonly over: boolean;
	/** No note for that day: no data, drawn hatched, never a zero. */
	readonly missing: boolean;
	/** Its words for screen readers: "miércoles 11 nov: 71 min, Instagram sobre el límite libre". */
	readonly text: string;
}

/** The phone half (from Kairos): the week's minutes and seven bars, or one quiet line. */
export type PhoneView =
	| {
			readonly kind: 'data';
			readonly title: string;
			readonly source: string;
			/** "6 h 35 min". */
			readonly total: string;
			/** "en apps vigiladas". */
			readonly totalLabel: string;
			/** "56 min al día de media · 7 días con nota". */
			readonly average: string;
			readonly days: readonly PhoneDayView[];
			/** "2 de 7 días sobre el límite libre: Instagram y YouTube." or "Ningún día pasó el límite libre.". */
			readonly over: string;
			readonly anyOver: boolean;
	  }
	| { readonly kind: 'none'; readonly title: string; readonly source: string; readonly text: string };

/** The money half (from Cheshbon): Gastos, Ingresos and Neto, or one quiet line. */
export type MoneyView =
	| {
			readonly kind: 'data';
			readonly title: string;
			readonly source: string;
			readonly rows: readonly { readonly label: string; readonly value: string }[];
			readonly net: { readonly label: string; readonly value: string };
	  }
	| { readonly kind: 'none'; readonly title: string; readonly source: string; readonly text: string };

/** The card "Tu semana" (app-reports S7, option C): folded to one row, open in place. */
export interface WeekReportView {
	readonly title: string;
	/** "La semana pasada, del 9 al 15 de noviembre". */
	readonly period: string;
	/** The folded line, its parts with data only: ["6 h 35 min en apps vigiladas", "gastos $ 412.300"]. */
	readonly summary: readonly string[];
	/** "Kairos no escribe desde el 13 de noviembre."; one per late app, shown folded or open. */
	readonly late: readonly string[];
	readonly phone: PhoneView;
	readonly money: MoneyView;
}

const KAIROS = 'Kairos';
const CHESHBON = 'Cheshbon';
/** A quiet week is drawn against an hour, so a few minutes stay a low bar. */
const MIN_SCALE_MINUTES = 60;
const MINUTES_PER_HOUR = 60;

/**
 * The card "Your week" (app-reports S1, S2, S7) from one read of the vault, or `null` when there is
 * nothing to draw: before the first read, or while neither Kairos nor Cheshbon has ever written a
 * note of its type. An app that never wrote gets one quiet line in its half. It shows only what the
 * report holds: never merchants, accounts, `first_app` or written reasons.
 */
export function weekReportView(report: WeekReport | null, today: string, t: Translator): WeekReportView | null {
	if (report === null || (report.kairos === null && report.cheshbon === null)) return null;
	const phone = phoneView(report.kairos, t);
	const money = moneyView(report.cheshbon, t);
	return {
		title: t('report.title'),
		period: periodText(report.week.start, report.week.end, today, t),
		summary: summaryOf(phone, money, t),
		late: [
			...(report.kairos?.late ? [t('report.late.kairos', { date: longDate(report.kairos.newest, today, t) })] : []),
			...(report.cheshbon?.late && report.cheshbon.newestWeek !== null ? [t('report.late.cheshbon', { date: longDate(report.cheshbon.newestWeek, today, t) })] : []),
		],
		phone,
		money,
	};
}

function phoneView(kairos: KairosReport | null, t: Translator): PhoneView {
	const title = t('report.phone.title');
	if (kairos === null) return { kind: 'none', title, source: KAIROS, text: t('report.phone.never') };
	const { phone } = kairos;
	if (phone.daysWithNote === 0) return { kind: 'none', title, source: KAIROS, text: t('report.phone.missing') };
	const scale = Math.max(MIN_SCALE_MINUTES, ...phone.days.map((day) => day.note?.screenMinutes ?? 0));
	const average = phone.minutes / phone.daysWithNote;
	const averageText = average > 0 && average < 1 ? t('report.phone.average.under') : t('report.phone.average', { duration: duration(Math.round(average), t) });
	return {
		kind: 'data',
		title,
		source: KAIROS,
		total: duration(phone.minutes, t),
		totalLabel: t('report.phone.total'),
		average: `${averageText} · ${plural(t, 'report.phone.days', phone.daysWithNote)}`,
		days: phone.days.map((day, index) => dayView(day, index, scale, t)),
		over: phone.overDays === 0 ? t('report.phone.over.none') : plural(t, 'report.phone.over', phone.daysWithNote, { over: phone.overDays, apps: listText(phone.overApps, t) }),
		anyOver: phone.overDays > 0,
	};
}

function dayView({ date, note }: PhoneDay, index: number, scale: number, t: Translator): PhoneDayView {
	const words = { weekday: weekdayLong(index, t), date: dayMonth(date, t) };
	const shared = { key: date, label: weekdayShort(index, t), date: String(Number(date.slice(8, 10))) };
	if (note === null) return { ...shared, value: '', height: 0, over: false, missing: true, text: t('report.day.none', words) };
	const over = note.exceeded.length > 0;
	const minutes = { ...words, duration: duration(note.screenMinutes, t) };
	return {
		...shared,
		value: String(note.screenMinutes),
		height: twoDecimals((note.screenMinutes / scale) * 100),
		over,
		missing: false,
		text: over ? t('report.day.over', { ...minutes, apps: listText(note.exceeded, t) }) : t('report.day', minutes),
	};
}

function moneyView(cheshbon: CheshbonReport | null, t: Translator): MoneyView {
	const title = t('report.money.title');
	if (cheshbon === null) return { kind: 'none', title, source: CHESHBON, text: t('report.money.never') };
	if (cheshbon.money === null) return { kind: 'none', title, source: CHESHBON, text: t('report.money.missing') };
	const { spent, income, net } = cheshbon.money;
	return {
		kind: 'data',
		title,
		source: CHESHBON,
		rows: [
			{ label: t('report.money.spent'), value: moneyText(spent, t) },
			{ label: t('report.money.income'), value: moneyText(income, t) },
		],
		net: { label: t('report.money.net'), value: moneyText(net, t) },
	};
}

/**
 * The folded line: the phone and the spending of the week, each only when it has data. The spending
 * opens the line in sentence case ("Gastos $ 412.300") when the phone has no part.
 */
function summaryOf(phone: PhoneView, money: MoneyView, t: Translator): string[] {
	const phonePart = phone.kind === 'data' ? [t('report.fold.phone', { total: phone.total })] : [];
	const moneyKey = phonePart.length > 0 ? 'report.fold.money' : 'report.fold.moneyFirst';
	const parts = [...phonePart, ...(money.kind === 'data' && money.rows[0] ? [t(moneyKey, { amount: money.rows[0].value })] : [])];
	return parts.length > 0 ? parts : [t('report.fold.none')];
}

/** "La semana pasada, del 9 al 15 de noviembre", or "del 26 de octubre al 1 de noviembre" across two months. */
function periodText(start: string, end: string, today: string, t: Translator): string {
	if (start.slice(0, 7) !== end.slice(0, 7)) return t('report.period.span', { start: longDate(start, today, t), end: longDate(end, today, t) });
	return t('report.period', { startDay: Number(start.slice(8, 10)), endDay: Number(end.slice(8, 10)), endMonth: monthLong(end, t) });
}

/** "6 h 35 min", "2 h", "3 min". */
function duration(minutes: number, t: Translator): string {
	const hours = Math.floor(minutes / MINUTES_PER_HOUR);
	const rest = minutes % MINUTES_PER_HOUR;
	if (hours === 0) return t('report.duration.minutes', { minutes: rest });
	return rest === 0 ? t('report.duration.hours', { hours }) : t('report.duration.hoursMinutes', { hours, minutes: rest });
}

/** "$ 412.300", "−$ 412.300": whole pesos, grouped by thousands, the minus sign of the chronicle. */
function moneyText(amount: number, t: Translator): string {
	const digits = String(Math.abs(Math.round(amount))).replace(/\B(?=(\d{3})+(?!\d))/g, t('report.money.group'));
	return amount < 0 ? t('report.money.amount.negative', { amount: digits }) : t('report.money.amount', { amount: digits });
}

/** "Instagram y YouTube", "A, B y C". */
function listText(names: readonly string[], t: Translator): string {
	if (names.length <= 1) return names.join('');
	return t('chronicle.and', { list: names.slice(0, -1).join(', '), last: names[names.length - 1] ?? '' });
}

function twoDecimals(value: number): number {
	return Math.round(value * 100) / 100;
}
