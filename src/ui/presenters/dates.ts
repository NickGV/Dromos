import type { MessageKey, Translator } from '../../i18n';

const MONTHS = [
	'date.month.jan',
	'date.month.feb',
	'date.month.mar',
	'date.month.apr',
	'date.month.may',
	'date.month.jun',
	'date.month.jul',
	'date.month.aug',
	'date.month.sep',
	'date.month.oct',
	'date.month.nov',
	'date.month.dec',
] as const satisfies readonly MessageKey[];

/**
 * The short date of the campaigns, "28 Nov", for a `YYYY-MM-DD` day; anything else comes back as
 * it is. Read from the string itself, never through a `Date`, so no time zone can move the day.
 */
export function dayMonth(date: string, t: Translator): string {
	const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(date);
	const month = match ? MONTHS[Number(match[1]) - 1] : undefined;
	if (!match || month === undefined) return date;
	return t('date.dayMonth', { day: Number(match[2]), month: t(month) });
}

const LONG_MONTHS = [
	'date.monthLong.jan',
	'date.monthLong.feb',
	'date.monthLong.mar',
	'date.monthLong.apr',
	'date.monthLong.may',
	'date.monthLong.jun',
	'date.monthLong.jul',
	'date.monthLong.aug',
	'date.monthLong.sep',
	'date.monthLong.oct',
	'date.monthLong.nov',
	'date.monthLong.dec',
] as const satisfies readonly MessageKey[];

/**
 * The written date of the library, "25 de octubre", with the year only when it is not the year of
 * `today` ("3 de octubre de 2025"). Read from the strings, never through a `Date`, so no time zone
 * moves the day; a date that is not `YYYY-MM-DD` comes back as it is.
 */
export function longDate(date: string, today: string, t: Translator): string {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
	const month = match ? LONG_MONTHS[Number(match[2]) - 1] : undefined;
	if (!match || month === undefined) return date;
	const params = { day: Number(match[3]), month: t(month), year: match[1] ?? '' };
	return today.startsWith(`${match[1]}-`) ? t('date.long', params) : t('date.long.year', params);
}
