import { XP_TABLE, type XpTable } from '../rules/XpRules';
import { uniqueRows } from './foldLedger';
import type { LedgerRow } from './LedgerRow';
import { nextRows, type TaskObservation } from './nextRows';
import { streakRows } from './streakRows';

/**
 * The rows one sync appends. A task completed before `gameStart` is ignored: the game never
 * hands out progress for what was done before it began. A task already counted can still be
 * reverted, whatever its date. Each task sees the rows planned for the ones before it, so the
 * result is the same if the list repeats a task, and planning over its own rows adds nothing.
 * It plans over the rows `foldLedger` counts (`uniqueRows`), so the copies a merge leaves in a
 * note never make an uncheck take a completion or a streak bonus back twice (ledger-repeats S6).
 */
export function rowsToAppend(history: readonly LedgerRow[], observations: readonly TaskObservation[], gameStart: string, table: XpTable = XP_TABLE): LedgerRow[] {
	const counted = uniqueRows(history);
	const planned: LedgerRow[] = [];
	for (const observation of observations) {
		if (observation.completed && observation.date < gameStart) continue;
		const seen = [...counted, ...planned];
		const rows = nextRows(seen, observation, table);
		planned.push(...rows, ...streakRows([...seen, ...rows], observation, table));
	}
	return planned;
}

/**
 * The day the game started counting: the one the character already holds, else the oldest day
 * in the ledger, else today (the very first sync).
 */
export function resolveGameStart(current: string | null, history: readonly LedgerRow[], today: string): string {
	if (current !== null) return current;
	return history.reduce((oldest, row) => (row.date < oldest ? row.date : oldest), today);
}
