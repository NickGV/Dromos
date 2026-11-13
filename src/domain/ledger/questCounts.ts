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

/**
 * The local day (`YYYY-MM-DD`) of the last completion of the task `habiticaId` when it still
 * stands, else `null`: never completed, or its last completion reverted. What tells a to-do
 * Habitica forgot after completing it from one deleted by hand (ADR-021).
 */
export function standingCompletionDate(rows: readonly LedgerRow[], habiticaId: string): string | null {
	const own = rows.filter((row) => row.habiticaId === habiticaId);
	const last = lastComplete(own);
	if (!last.active) return null;
	return own.filter((row) => row.source === 'complete' && row.n === last.n).reduce<string | null>((latest, row) => (latest === null || row.date > latest ? row.date : latest), null);
}

/**
 * Completions that still stand across every task (game-ui S15): one per `complete` transition,
 * less one per `revert`. A quest with several skills writes a row per skill that share the
 * transition, and an exact repeat is the same transition, so each counts once. Dailies count
 * like to-dos; streak bonuses are not transitions of a task and never count.
 */
export function standingCompletionCount(rows: readonly LedgerRow[]): number {
	const seen = new Set<string>();
	let count = 0;
	for (const row of rows) {
		if (row.source === 'streak') continue;
		const transition = `${row.source}|${row.date}|${row.habiticaId}|${row.n}`;
		if (seen.has(transition)) continue;
		seen.add(transition);
		count += row.source === 'complete' ? 1 : -1;
	}
	return count;
}
