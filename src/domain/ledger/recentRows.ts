import type { LedgerRow, LedgerSource } from './LedgerRow';
import { uniqueRows } from './foldLedger';

/**
 * The rows newest first: by date, and within a day the row written later first. An exact repeat
 * counts once, as in `foldLedger`. Each row keeps its place in the ledger as written.
 */
function newestFirst(rows: readonly LedgerRow[]): { readonly row: LedgerRow; readonly index: number }[] {
	return uniqueRows(rows)
		.map((row, index) => ({ row, index }))
		.sort((left, right) => (left.row.date === right.row.date ? right.index - left.index : left.row.date < right.row.date ? 1 : -1));
}

/**
 * The last `limit` rows of each skill, newest first: by date, and within a day the row written
 * later first. An exact repeat counts once, as in `foldLedger`. Rows without a skill are left out.
 */
export function recentRowsBySkill(rows: readonly LedgerRow[], limit: number): Map<string, LedgerRow[]> {
	const bySkill = new Map<string, LedgerRow[]>();
	for (const { row } of newestFirst(rows)) {
		if (row.skill === null) continue;
		const own = bySkill.get(row.skill);
		if (own === undefined) bySkill.set(row.skill, [row]);
		else if (own.length < limit) own.push(row);
	}
	return bySkill;
}

/**
 * One deed of the chronicle (game-ui S18): one state transition of a Habitica task, which writes
 * a row per skill sharing `date`, `habiticaId`, `source` and `n`.
 */
export interface Deed {
	/** Local date as `YYYY-MM-DD`. */
	readonly date: string;
	readonly habiticaId: string;
	readonly task: string;
	readonly source: LedgerSource;
	/** Signed, as the character counts the transition: once, from its first row. */
	readonly xp: number;
	/** The skill ids of its rows in the order they were written; empty for a task without skill. */
	readonly skills: readonly string[];
}

/**
 * The last `limit` deeds of the ledger, newest first in the order of `recentRowsBySkill`: the rows
 * of one transition make one deed with all their skills. An exact repeat counts once.
 */
export function recentDeeds(rows: readonly LedgerRow[], limit: number): Deed[] {
	const deeds = new Map<string, { first: LedgerRow; firstIndex: number; skills: { id: string; index: number }[] }>();
	for (const { row, index } of newestFirst(rows)) {
		const key = `${row.date}|${row.habiticaId}|${row.source}|${row.n}`;
		const deed = deeds.get(key);
		if (deed === undefined) {
			if (deeds.size >= limit) continue;
			deeds.set(key, { first: row, firstIndex: index, skills: row.skill === null ? [] : [{ id: row.skill, index }] });
			continue;
		}
		if (index < deed.firstIndex) {
			deed.first = row;
			deed.firstIndex = index;
		}
		if (row.skill !== null && !deed.skills.some((skill) => skill.id === row.skill)) deed.skills.push({ id: row.skill, index });
	}
	return [...deeds.values()].map(({ first, skills }) => ({
		date: first.date,
		habiticaId: first.habiticaId,
		task: first.task,
		source: first.source,
		xp: first.xp,
		skills: skills.sort((left, right) => left.index - right.index).map((skill) => skill.id),
	}));
}
