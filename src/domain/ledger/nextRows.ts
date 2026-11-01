import { xpForTask, type XpKind } from '../rules/XpRules';
import type { LedgerRow } from './LedgerRow';

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
}

/**
 * The rows to append so the ledger agrees with Habitica, derived from the state
 * of this task in `history` (S15). Syncing twice adds nothing: a completed task
 * whose last transition is an active `complete` adds no row, and neither does an
 * uncompleted one whose last transition is a `revert` (or that never had one).
 * Dailies keep one set of transitions per day; to-dos keep one set for good.
 */
export function nextRows(history: readonly LedgerRow[], observation: TaskObservation): LedgerRow[] {
	const own = history.filter(
		(row) => row.habiticaId === observation.habiticaId && (observation.kind === 'todo' || row.date === observation.date),
	);
	const completes = own.filter((row) => row.source === 'complete');
	const reverted = new Set(own.filter((row) => row.source === 'revert').map((row) => row.n));
	const lastComplete = completes.reduce((highest, row) => Math.max(highest, row.n), 0);
	const active = lastComplete > 0 && !reverted.has(lastComplete);

	if (observation.completed && !active) return completeRows(observation, lastComplete + 1);
	if (!observation.completed && active) return revertRows(observation, completes.filter((row) => row.n === lastComplete));
	return [];
}

function completeRows(observation: TaskObservation, n: number): LedgerRow[] {
	const xp = xpForTask(observation.kind, observation.priority);
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
