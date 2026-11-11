import type { DeedEntry, SkillRef } from '../../application';
import { daysSince } from '../../domain';
import type { Translator } from '../../i18n';
import { dayMonth } from './dates';
import { limitRows, type ListToggleView } from './listLimit';

/** Up to this many days back a deed's day is said in words; older ones show the short date. */
const DAYS_IN_WORDS = 6;

/** The deeds the chronicle shows before "View more" (home-fit S2); the game keeps five. */
export const CHRONICLE_LIMIT = 3;

/** One journal line of the chronicle: "Yesterday · Read 20 pages · Reader +10 XP". */
export interface DeedLineView {
	readonly key: string;
	/** "Today", "Yesterday", "3 days ago" or "28 Oct". */
	readonly day: string;
	/** What follows the day, in reading order: "Undone" when it was undone, the task, and what it gained. */
	readonly parts: readonly string[];
	/** A revert, or a streak bonus taken back. */
	readonly undone: boolean;
	/** The whole line, as it reads. */
	readonly text: string;
}

/** The chronicle of the home screen (game-ui S18). */
export interface ChronicleView {
	readonly title: string;
	/** Newest first: the three newest while folded (home-fit S2), every deed once expanded. */
	readonly lines: readonly DeedLineView[];
	/** "View more (N)" or "View less", only with more than three deeds. */
	readonly more?: ListToggleView;
	/** "View history": the way into the Chronicle screen (M9 S3), with any number of deeds. */
	readonly history: string;
}

export interface ChronicleOptions {
	/** Shows every deed the game kept; folded, the three newest (home-fit S2). */
	readonly expanded?: boolean;
}

/**
 * The last deeds of the ledger as journal lines (game-ui S18), or `null` when there is none to tell:
 * before the first game sync, or while the ledger is empty. `today` is `Clock.today()`, so the days
 * follow the clock. A streak bonus reads "Streak bonus", and anything undone reads "Undone". Folded,
 * it shows the three newest under "View more" (home-fit S2). "View history" leads to the Chronicle
 * screen (M9 S3).
 */
export function chronicleView(deeds: readonly DeedEntry[] | undefined, today: string, t: Translator, options: ChronicleOptions = {}): ChronicleView | null {
	if (deeds === undefined || deeds.length === 0) return null;
	const { rows, more } = limitRows(deedLines(deeds, today, t), options.expanded ?? false, t, () => false, CHRONICLE_LIMIT);
	return { title: t('chronicle.title'), lines: rows, ...(more ? { more } : {}), history: t('chronicle.history') };
}

/** Every deed as a journal line of the chronicle, in the order given; the Chronicle screen lists a week's with it (M9 S2). */
export function deedLines(deeds: readonly DeedEntry[], today: string, t: Translator): DeedLineView[] {
	return deeds.map((deed, index) => lineOf(deed, index, today, t));
}

function lineOf(deed: DeedEntry, index: number, today: string, t: Translator): DeedLineView {
	const undone = deed.xp < 0;
	const day = deedDayText(deed.date, today, t);
	const what = deed.source === 'streak' ? t('chronicle.streak') : deed.task;
	const parts = [...(undone ? [t('chronicle.undone')] : []), what, gainText(deed.xp, deed.skills, t)];
	return { key: `${index}|${deed.date}|${deed.source}|${deed.task}`, day, parts, undone, text: [day, ...parts].join(' · ') };
}

/** "Reader +10 XP", "Reader and Scribe +10 XP" (each skill gained it), "+10 XP" without skill, "−10 XP" undone. */
function gainText(xp: number, skills: readonly SkillRef[], t: Translator): string {
	const amount = xp < 0 ? t('skills.detail.revert', { xp: -xp }) : t('quests.xp', { xp });
	if (skills.length === 0) return amount;
	return t('chronicle.skills', { skills: listOf(skills.map((skill) => skill.name), t), xp: amount });
}

/** "Reader", "Reader and Scribe", "Reader, Scribe and Caregiver". */
function listOf(names: readonly string[], t: Translator): string {
	if (names.length < 2) return names[0] ?? '';
	return t('chronicle.and', { list: names.slice(0, -1).join(', '), last: names[names.length - 1] ?? '' });
}

/**
 * The day of a deed next to `today`: "Today", "Yesterday", "N days ago" for the last week, then
 * the short date of the campaigns. A day after today is shown as its short date, and one it cannot
 * read as written.
 */
export function deedDayText(date: string, today: string, t: Translator): string {
	const days = daysSince(date, today);
	if (!Number.isFinite(days) || days < 0 || days > DAYS_IN_WORDS) return dayMonth(date, t);
	if (days === 0) return t('chronicle.day.today');
	if (days === 1) return t('chronicle.day.yesterday');
	return t('chronicle.day.ago', { count: days });
}
