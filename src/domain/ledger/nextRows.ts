import { XP_TABLE, xpForTask, type XpKind, type XpTable } from '../rules/XpRules';
import type { LedgerRow } from './LedgerRow';
import { lastComplete } from './questCounts';

/** A Habitica task as seen at one sync. */
export interface TaskObservation {
	readonly habiticaId: string;
	readonly title: string;
	readonly kind: XpKind;
	/** Habitica priority: 0.1, 1, 1.5 or 2. */
	readonly priority: number;
	/** Skill ids from the task's `skill/<id>` tags. */
	readonly skills: readonly string[];
	readonly completed: boolean;
	/** Local date as `YYYY-MM-DD` the transition is written under. */
	readonly date: string;
	/** Current streak of a daily, when the source knows it. */
	readonly streak?: number | null;
}

/**
 * The rows to append so the ledger agrees with Habitica, derived from the state
 * of this task in `history` (S15). Syncing twice adds nothing: a completed task
 * whose last transition is an active `complete` adds no row, and neither does an
 * uncompleted one whose last transition is a `revert` (or that never had one).
 * Dailies keep one set of transitions per day; to-dos keep one set for good.
 */
export function nextRows(history: readonly LedgerRow[], observation: TaskObservation, table: XpTable = XP_TABLE): LedgerRow[] {
	const own = history.filter(
		(row) => row.habiticaId === observation.habiticaId && (observation.kind === 'todo' || row.date === observation.date),
	);
	const last = lastComplete(own);

	if (observation.completed && !last.active) return completeRows(observation, last.n + 1, table);
	if (!observation.completed && last.active) return revertRows(observation, own.filter((row) => row.source === 'complete' && row.n === last.n));
	return [];
}

function completeRows(observation: TaskObservation, n: number, table: XpTable): LedgerRow[] {
	const xp = xpForTask(observation.kind, observation.priority, table);
	const skills = observation.skills.length > 0 ? [...new Set(observation.skills)] : [null];
	return skills.map((skill) => ({
		date: observation.date,
		habiticaId: observation.habiticaId,
		task: observation.title,
		kind: observation.kind,
		skill,
		xp,
		source: 'complete',
		n,
	}));
}

/** Cancels the rows that were paid, whatever the task is worth now. */
function revertRows(observation: TaskObservation, paid: readonly LedgerRow[]): LedgerRow[] {
	return paid.map((row) => ({ ...row, date: observation.date, xp: -row.xp, source: 'revert' }));
}
