import type { LedgerRow } from './LedgerRow';
import { uniqueRows } from './foldLedger';

/**
 * The last `limit` rows of each skill, newest first: by date, and within a day the row written
 * later first. An exact repeat counts once, as in `foldLedger`. Rows without a skill are left out.
 */
export function recentRowsBySkill(rows: readonly LedgerRow[], limit: number): Map<string, LedgerRow[]> {
	const newestFirst = uniqueRows(rows)
		.map((row, index) => ({ row, index }))
		.sort((left, right) => (left.row.date === right.row.date ? right.index - left.index : left.row.date < right.row.date ? 1 : -1));
	const bySkill = new Map<string, LedgerRow[]>();
	for (const { row } of newestFirst) {
		if (row.skill === null) continue;
		const own = bySkill.get(row.skill);
		if (own === undefined) bySkill.set(row.skill, [row]);
		else if (own.length < limit) own.push(row);
	}
	return bySkill;
}
