import { STAT_IDS, type StatId } from '../character/Character';
import type { LedgerRow } from './LedgerRow';

/** What the fold needs to know about a skill. A `Skill` fits this shape. */
export interface SkillXpSource {
	readonly id: string;
	readonly stat: StatId;
	/** Local date as `YYYY-MM-DD` of the unlock, or `null` while the skill is locked. */
	readonly unlockedOn: string | null;
}

export interface GameTotals {
	readonly characterXp: number;
	/** XP per known skill; a locked skill is 0. */
	readonly skillXp: Readonly<Record<string, number>>;
	/** Stat value: the XP of the unlocked skills that feed it. */
	readonly stats: Readonly<Record<StatId, number>>;
}

/**
 * Turns the ledger into totals (S1, S3, S13).
 * - Character XP sums each transition once, so a quest with several skills counts once.
 * - Skill XP counts only rows dated after the unlock: the quests that unlocked the
 *   skill, and any earlier one, counted toward its requirements and the character.
 * - A `revert` is dated like the `complete` it cancels, so cancelling work done
 *   before the unlock never makes the skill negative.
 * - No total goes below zero.
 */
export function foldLedger(rows: readonly LedgerRow[], skills: readonly SkillXpSource[]): GameTotals {
	const skillXp = Object.fromEntries(skills.map((skill) => [skill.id, 0]));
	const known = new Map(skills.map((skill) => [skill.id, skill]));
	const completes = completeDatesByTask(rows);

	for (const row of rows) {
		const skill = row.skill === null ? undefined : known.get(row.skill);
		if (skill === undefined || skill.unlockedOn === null) continue;
		if (effectiveDate(row, completes) > skill.unlockedOn) skillXp[skill.id] = (skillXp[skill.id] ?? 0) + row.xp;
	}

	const stats = Object.fromEntries(STAT_IDS.map((id) => [id, 0])) as Record<StatId, number>;
	for (const skill of skills) {
		skillXp[skill.id] = Math.max(0, skillXp[skill.id] ?? 0);
		stats[skill.stat] += skillXp[skill.id] ?? 0;
	}

	return { characterXp: Math.max(0, characterTotal(rows)), skillXp, stats };
}

function characterTotal(rows: readonly LedgerRow[]): number {
	const transitions = new Map<string, number>();
	for (const row of rows) {
		const key = `${row.habiticaId}|${row.source}|${row.n}|${row.date}`;
		if (!transitions.has(key)) transitions.set(key, row.xp);
	}
	let total = 0;
	for (const xp of transitions.values()) total += xp;
	return total;
}

function completeDatesByTask(rows: readonly LedgerRow[]): Map<string, string[]> {
	const dates = new Map<string, string[]>();
	for (const row of rows) {
		if (row.source !== 'complete') continue;
		const key = `${row.habiticaId}|${row.skill ?? ''}|${row.n}`;
		dates.set(key, [...(dates.get(key) ?? []), row.date]);
	}
	return dates;
}

function effectiveDate(row: LedgerRow, completes: Map<string, string[]>): string {
	if (row.source !== 'revert') return row.date;
	const dates = completes.get(`${row.habiticaId}|${row.skill ?? ''}|${row.n}`) ?? [];
	return dates.includes(row.date) ? row.date : (dates[0] ?? row.date);
}
