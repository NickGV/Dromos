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
