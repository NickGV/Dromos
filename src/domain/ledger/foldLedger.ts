import { STAT_IDS, type StatId } from '../character/Character';
import { DEFAULT_RULES, type GameRules } from '../rules/GameRules';
import { LevelCurve } from '../rules/LevelCurve';
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
	/** XP behind each stat: the XP of the unlocked skills that feed it, plus the dailies without skill for `disciplina`. */
	readonly statXp: Readonly<Record<StatId, number>>;
	/** What a stat shows: the level that XP would have on the skill curve, 0 without XP. */
	readonly stats: Readonly<Record<StatId, number>>;
}

/**
 * Turns the ledger into totals (S1, S3, S13).
 * - Character XP sums each transition once, so a quest with several skills counts once.
 * - Skill XP counts only rows dated after the unlock: the quests that unlocked the
 *   skill, and any earlier one, counted toward its requirements and the character.
 * - A `revert` is dated like the `complete` it cancels, so cancelling work done
 *   before the unlock never makes the skill negative.
 * - A stat is fed by the XP of its unlocked skills, and `disciplina` also by the dailies
 *   that carry no skill; it shows the level that XP has on the skill curve, so a stat of 3
 *   and a skill of level 3 mean the same.
 * - A line repeated exactly (same unique key) counts once, so a hand edit that copies a row
 *   never doubles XP.
 * - No total goes below zero.
 */
export function foldLedger(rows: readonly LedgerRow[], skills: readonly SkillXpSource[], rules: Pick<GameRules, 'skillCurve'> = DEFAULT_RULES): GameTotals {
	const statCurve = new LevelCurve(rules.skillCurve);
	const unique = uniqueRows(rows);
	const skillXp = Object.fromEntries(skills.map((skill) => [skill.id, 0]));
	const known = new Map(skills.map((skill) => [skill.id, skill]));
	const completes = completeDatesByTask(unique);

	let unskilledDailyXp = 0;
	for (const row of unique) {
		if (row.skill === null) {
			if (row.kind === 'daily') unskilledDailyXp += row.xp;
			continue;
		}
		const skill = known.get(row.skill);
		if (skill === undefined || skill.unlockedOn === null) continue;
		if (effectiveDate(row, completes) > skill.unlockedOn) skillXp[skill.id] = (skillXp[skill.id] ?? 0) + row.xp;
	}

	const statXp = Object.fromEntries(STAT_IDS.map((id) => [id, 0])) as Record<StatId, number>;
	for (const skill of skills) {
		skillXp[skill.id] = Math.max(0, skillXp[skill.id] ?? 0);
		statXp[skill.stat] += skillXp[skill.id] ?? 0;
	}
	statXp.disciplina += Math.max(0, unskilledDailyXp);

	const stats = Object.fromEntries(STAT_IDS.map((id) => [id, statXp[id] > 0 ? statCurve.levelFor(statXp[id]) : 0])) as Record<StatId, number>;
	return { characterXp: Math.max(0, characterTotal(unique)), skillXp, statXp, stats };
}

/** The rows of the ledger without exact repeats of the same unique key. */
function uniqueRows(rows: readonly LedgerRow[]): LedgerRow[] {
	const seen = new Set<string>();
	return rows.filter((row) => {
		const key = `${row.habiticaId}|${row.source}|${row.n}|${row.skill ?? ''}|${row.date}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
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
