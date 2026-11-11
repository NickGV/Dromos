import type { WeekEntry } from '../../application';
import { mondayOf, STAT_IDS } from '../../domain';
import type { Translator } from '../../i18n';
import { statLabel } from './characterCardView';
import { deedLines, type DeedLineView } from './chronicleView';
import { dayMonth, weekdayLong, weekdayShort } from './dates';

/** The way back from the Chronicle screen, "← Path" (M9 S3); the organism adds what it does. */
export interface HistoryBackView {
	readonly label: string;
	/** "Back to the path": holds the label. */
	readonly ariaLabel: string;
}

/** One bar of the weeks: a button that selects its week (M9 S2). */
export interface WeekBarView {
	/** The week's Monday, which selects it. */
	readonly key: string;
	/** Under the bar: "3 Nov", or "This week" for the current one. */
	readonly label: string;
	/** "Week of 3 Nov: 120 XP"; the current one starts with "This week". */
	readonly ariaLabel: string;
	/** At the bar's end while it is selected, hovered or focused: "120", "−20". */
	readonly value: string;
	readonly current: boolean;
	readonly selected: boolean;
	/** The first or the last bar, whose label stays where the others' have no room. */
	readonly edge: boolean;
	/** Where the bar starts and how tall it is, in percent of the plot from its foot. */
	readonly bottom: number;
	readonly height: number;
	/** Below the baseline: the week lost XP. */
	readonly negative: boolean;
}

export interface WeekChartView {
	/** The name of the group of bars: "XP by week". */
	readonly ariaLabel: string;
	/** The round value of the plot's top, "150 XP". */
	readonly top: string;
	/** The round value of its foot when a week fell below zero, "−20 XP"; otherwise `null`. */
	readonly bottom: string | null;
	/** Where the baseline sits, in percent of the plot from its foot. */
	readonly zero: number;
	/** Oldest first. */
	readonly bars: readonly WeekBarView[];
}

/** One day of the selected week (M9 S2). */
export interface DayBarView {
	readonly key: string;
	/** "Mon". */
	readonly label: string;
	/** The day of the month, "9". */
	readonly date: string;
	/** Above the bar: "20", "0", "−10"; empty for a day still ahead. */
	readonly value: string;
	/** Its words for screen readers: "Monday 9 Nov: 20 XP". */
	readonly text: string;
	/** In percent of the week's best day. */
	readonly height: number;
	readonly today: boolean;
	/** After today: nothing can have happened yet. */
	readonly ahead: boolean;
	readonly negative: boolean;
}

/** One row of the XP by stat: a stat, or the deeds with no skill last (M9 S2). */
export interface StatShareView {
	readonly key: string;
	/** "Strength", or "No skill". */
	readonly label: string;
	/** "40 XP", "−15 XP". */
	readonly value: string;
	/** In percent of the week's largest row. */
	readonly width: number;
	readonly negative: boolean;
	readonly unskilled: boolean;
}

/** What the screen says about the selected week (M9 S2). */
export interface SelectedWeekView {
	/** "This week", or "Week of 3 Nov". */
	readonly title: string;
	/** "120 XP". */
	readonly xp: string;
	/** "+40 XP vs the week before"; `null` for the first week of the ledger. */
	readonly comparison: string | null;
	readonly days: readonly DayBarView[];
	readonly stats: readonly StatShareView[];
	/** Newest first, as the chronicle words them. */
	readonly deeds: readonly DeedLineView[];
	/** "No deeds this week.", or `null` when it has some. */
	readonly deedsEmpty: string | null;
	readonly titles: { readonly days: string; readonly stats: string; readonly deeds: string };
}

/** The Chronicle screen (M9 S2): its weeks and the selected one, or the sentence of an empty ledger. */
export type HistoryView =
	| { readonly kind: 'empty'; readonly title: string; readonly back: HistoryBackView; readonly text: string }
	| { readonly kind: 'weeks'; readonly title: string; readonly back: HistoryBackView; readonly chart: WeekChartView; readonly week: SelectedWeekView };

/** Round tops of the plot, as multiples of a power of ten. */
const ROUND_STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

/** The top of a plot whose weeks have no XP above zero: the baseline still has room over it. */
const EMPTY_TOP = 10;

/**
 * The Chronicle screen from the game's history (M9 S2, S3): the bars of the weeks, oldest first, the
 * current one marked; the week `selected` (its Monday), or the current one when it is not shown,
 * with its days, its XP by stat and its deeds. `today` is `Clock.today()`. Without weeks (before the
 * first game sync or with an empty ledger) the screen says so in one sentence.
 */
export function historyView(history: readonly WeekEntry[] | undefined, selected: string | null, today: string, t: Translator): HistoryView {
	const title = t('screen.chronicle');
	const back = { label: t('nav.home'), ariaLabel: t('chronicle.back.aria') };
	if (history === undefined || history.length === 0) return { kind: 'empty', title, back, text: t('history.empty') };

	const current = mondayOf(today);
	const chosen = history.find((week) => week.start === selected) ?? history.find((week) => week.start === current) ?? history[history.length - 1];
	if (chosen === undefined) return { kind: 'empty', title, back, text: t('history.empty') };
	return { kind: 'weeks', title, back, chart: chartOf(history, chosen.start, current, t), week: weekOf(chosen, current, today, t) };
}

function chartOf(history: readonly WeekEntry[], selected: string, current: string, t: Translator): WeekChartView {
	const highest = Math.max(0, ...history.map((week) => week.xp));
	const lowest = Math.max(0, ...history.map((week) => -week.xp));
	const top = highest > 0 ? roundUp(highest) : EMPTY_TOP;
	const bottom = lowest > 0 ? roundUp(lowest) : 0;
	const span = top + bottom;
	const zero = (bottom / span) * 100;
	const bars = history.map((week, index): WeekBarView => {
		const height = (Math.abs(week.xp) / span) * 100;
		const isCurrent = week.start === current;
		const date = dayMonth(week.start, t);
		const xp = xpText(week.xp, t);
		return {
			key: week.start,
			label: isCurrent ? t('history.week.current') : date,
			ariaLabel: isCurrent ? t('history.week.aria.current', { date, xp }) : t('history.week.aria', { date, xp }),
			value: signed(week.xp),
			current: isCurrent,
			selected: week.start === selected,
			edge: index === 0 || index === history.length - 1,
			bottom: twoDecimals(week.xp < 0 ? zero - height : zero),
			height: twoDecimals(height),
			negative: week.xp < 0,
		};
	});
	return { ariaLabel: t('history.weeks.aria'), top: xpText(top, t), bottom: bottom > 0 ? xpText(-bottom, t) : null, zero: twoDecimals(zero), bars };
}

function weekOf(week: WeekEntry, current: string, today: string, t: Translator): SelectedWeekView {
	const deeds = deedLines(week.deeds, today, t);
	return {
		title: week.start === current ? t('history.week.current') : t('history.week', { date: dayMonth(week.start, t) }),
		xp: xpText(week.xp, t),
		comparison: comparisonOf(week, t),
		days: daysOf(week, today, t),
		stats: statsOf(week, t),
		deeds,
		deedsEmpty: deeds.length === 0 ? t('history.deeds.none') : null,
		titles: { days: t('history.days'), stats: t('history.stats'), deeds: t('history.deeds') },
	};
}

/** "+40 XP vs the week before", "−90 XP …", "Same XP as the week before"; nothing before the ledger's first week. */
function comparisonOf(week: WeekEntry, t: Translator): string | null {
	if (week.previousXp === null) return null;
	const difference = week.xp - week.previousXp;
	if (difference > 0) return t('history.compare.more', { xp: difference });
	if (difference < 0) return t('history.compare.less', { xp: -difference });
	return t('history.compare.same');
}

function daysOf(week: WeekEntry, today: string, t: Translator): DayBarView[] {
	const dates = Array.from({ length: 7 }, (_, index) => addDays(week.start, index));
	const best = Math.max(0, ...week.days.filter((_, index) => (dates[index] ?? '') <= today));
	return dates.map((date, index): DayBarView => {
		const xp = week.days[index] ?? 0;
		const ahead = date > today;
		const isToday = date === today;
		const words = { weekday: weekdayLong(index, t), date: dayMonth(date, t), xp: xpText(xp, t) };
		return {
			key: date,
			label: weekdayShort(index, t),
			date: String(Number(date.slice(8, 10))),
			value: ahead ? '' : signed(xp),
			text: ahead ? t('history.day.ahead', words) : isToday ? t('history.day.today', words) : t('history.day', words),
			height: !ahead && xp > 0 && best > 0 ? twoDecimals((xp / best) * 100) : 0,
			today: isToday,
			ahead,
			negative: xp < 0,
		};
	});
}

function statsOf(week: WeekEntry, t: Translator): StatShareView[] {
	const rows = [
		...STAT_IDS.map((id) => ({ key: id, label: statLabel(id, t), xp: week.statXp[id], unskilled: false })),
		{ key: 'unskilled', label: t('history.unskilled'), xp: week.unskilledXp, unskilled: true },
	];
	const largest = Math.max(0, ...rows.map((row) => row.xp));
	return rows.map(({ key, label, xp, unskilled }) => ({
		key,
		label,
		value: xpText(xp, t),
		width: xp > 0 && largest > 0 ? twoDecimals((xp / largest) * 100) : 0,
		negative: xp < 0,
		unskilled,
	}));
}

/** "120 XP", "−20 XP": the minus sign of the chronicle, never a hyphen. */
function xpText(xp: number, t: Translator): string {
	return t('history.xp', { xp: signed(xp) });
}

function signed(value: number): string {
	return value < 0 ? `−${-value}` : String(value);
}

/** The smallest round value at or above `value`: 120 is drawn against 150, 80 against 80. */
function roundUp(value: number): number {
	const power = 10 ** Math.floor(Math.log10(value));
	const step = ROUND_STEPS.find((candidate) => candidate * power >= value) ?? 10;
	return step * power;
}

function twoDecimals(value: number): number {
	return Math.round(value * 100) / 100;
}

/** A calendar day `days` after `date`, read through UTC so no time zone moves it. */
function addDays(date: string, days: number): string {
	return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}
