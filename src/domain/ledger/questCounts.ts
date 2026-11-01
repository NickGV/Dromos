import type { LedgerRow } from './LedgerRow';

/**
 * Distinct to-dos that count as quests toward the unlock of a skill: completed
 * with its tag and not reverted since. Dailies never count (they unlock through
 * habits), and neither do streak bonuses. Rows before the unlock count too: the
 * quests done while a skill is locked are what unlock it (S3).
 */
export function completedQuestCount(rows: readonly LedgerRow[], skillId: string): number {
	const byTask = new Map<string, LedgerRow[]>();
	for (const row of rows) {
		if (row.skill !== skillId || row.kind !== 'todo') continue;
		byTask.set(row.habiticaId, [...(byTask.get(row.habiticaId) ?? []), row]);
	}
	let count = 0;
	for (const own of byTask.values()) if (lastComplete(own).active) count += 1;
	return count;
}

export interface LastComplete {
	/** Highest `complete` sequence number, 0 when the task was never completed. */
	readonly n: number;
	/** True when that completion has no `revert` yet. */
	readonly active: boolean;
}

/** The last completion of one task and whether it still stands. */
export function lastComplete(taskRows: readonly LedgerRow[]): LastComplete {
	const n = taskRows.filter((row) => row.source === 'complete').reduce((highest, row) => Math.max(highest, row.n), 0);
	const reverted = taskRows.some((row) => row.source === 'revert' && row.n === n);
	return { n, active: n > 0 && !reverted };
}
