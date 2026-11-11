import { STAT_IDS, type StatId } from '../character/Character';
import { uniqueRows, type SkillXpSource } from './foldLedger';
import type { LedgerRow } from './LedgerRow';
import { recentDeeds, type Deed } from './recentRows';

/** How many weeks the history of the chronicle shows at most, the current one last (M9 S1). */
export const HISTORY_WEEKS = 12;

/** One week of the ledger, Monday to Sunday on its local dates (M9 S1). */
export interface WeekTally {
	/** The week's Monday as `YYYY-MM-DD`. */
	readonly start: string;
	/** Signed: the character's XP over the week, each deed once, a revert or a bonus taken back negative. */
	readonly xp: number;
	/** The XP of the week before, or `null` when that week is before the week of the ledger's first row. */
	readonly previousXp: number | null;
	/** The XP of each of the seven days, Monday first. */
	readonly days: readonly number[];
	/** The XP of the week's skill rows by the stat each skill feeds; a skill the vault does not know feeds none. */
	readonly statXp: Readonly<Record<StatId, number>>;
	/** The XP of the week's deeds with no skill. */
	readonly unskilledXp: number;
	/** Every deed of the week, newest first, grouped as the chronicle groups them. */
	readonly deeds: readonly Deed[];
}

const MS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;
const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The history of the chronicle (M9 S1): the last `limit` weeks of the ledger, oldest first and ending
 * with the week of `today`, starting no earlier than the week of the ledger's first row; a week
 * without deeds is 0, and an empty ledger has no weeks.
 * - A week's XP is the character's: each deed once, however many skill rows it wrote, so the weeks
 *   add up to the XP the character counts over them. Every row counts on the date it was written.
 * - The XP by stat sums every skill row, as each skill gains the deed's XP; the deeds with no skill
 *   keep their own share. The stat comes from the skill as the vault knows it now.
 * - An exact repeat of a row counts once, as in `foldLedger`. A row whose date cannot be read is left out.
 */
export function weeklyHistory(rows: readonly LedgerRow[], skills: readonly Pick<SkillXpSource, 'id' | 'stat'>[], today: string, limit = HISTORY_WEEKS): WeekTally[] {
	const dated = uniqueRows(rows).filter((row) => LOCAL_DATE.test(row.date));
	if (dated.length === 0 || !LOCAL_DATE.test(today)) return [];

	const firstWeek = mondayOf(dated.reduce((earliest, row) => (row.date < earliest ? row.date : earliest), today));
	const current = mondayOf(today);
	const count = Math.max(1, Math.min(limit, weeksBetween(firstWeek, current) + 1));
	// One week more than shown, when the ledger has it: the oldest week shown is compared with it.
	const starts = Array.from({ length: count + 1 }, (_, index) => addDays(current, -DAYS_PER_WEEK * (count - index)));
	const tallies = new Map(starts.map((start) => [start, emptyTally(start)]));

	for (const deed of recentDeeds(dated, Number.POSITIVE_INFINITY)) {
		const tally = tallies.get(mondayOf(deed.date));
		if (tally === undefined) continue;
		tally.xp += deed.xp;
		const day = dayIndex(tally.start, deed.date);
		tally.days[day] = (tally.days[day] ?? 0) + deed.xp;
		tally.deeds.push(deed);
		if (deed.skills.length === 0) tally.unskilledXp += deed.xp;
	}

	const stats = new Map(skills.map((skill) => [skill.id, skill.stat]));
	for (const row of dated) {
		const stat = row.skill === null ? undefined : stats.get(row.skill);
		const tally = tallies.get(mondayOf(row.date));
		if (stat !== undefined && tally !== undefined) tally.statXp[stat] += row.xp;
	}

	const weeks = starts.map((start) => tallies.get(start) ?? emptyTally(start));
	return weeks.slice(1).map((week, index) => {
		const before = weeks[index];
		return { ...week, previousXp: before === undefined || before.start < firstWeek ? null : before.xp };
	});
}

interface OpenTally {
	readonly start: string;
	xp: number;
	readonly days: number[];
	readonly statXp: Record<StatId, number>;
	unskilledXp: number;
	readonly deeds: Deed[];
}

function emptyTally(start: string): OpenTally {
	return { start, xp: 0, days: Array.from({ length: DAYS_PER_WEEK }, () => 0), statXp: Object.fromEntries(STAT_IDS.map((id) => [id, 0])) as Record<StatId, number>, unskilledXp: 0, deeds: [] };
}

function toUtc(date: string): number {
	return Date.parse(`${date}T00:00:00Z`);
}

function addDays(date: string, days: number): string {
	return new Date(toUtc(date) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** The Monday of the week of `date`, read as a calendar day so no time zone moves it; anything else comes back as it is. */
export function mondayOf(date: string): string {
	if (!LOCAL_DATE.test(date)) return date;
	const weekday = new Date(toUtc(date)).getUTCDay();
	return addDays(date, -((weekday + 6) % DAYS_PER_WEEK));
}

function dayIndex(start: string, date: string): number {
	return Math.round((toUtc(date) - toUtc(start)) / MS_PER_DAY);
}

function weeksBetween(from: string, to: string): number {
	return Math.round((toUtc(to) - toUtc(from)) / (MS_PER_DAY * DAYS_PER_WEEK));
}
