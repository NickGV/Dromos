import type { Checklist } from '../domain';

/** What Habitica says about one linked task (S4 of M2). `checklist` is there only when the task has subtasks (missions S2). */
export type TaskStatus =
	| { readonly kind: 'open'; readonly checklist?: Checklist }
	/** `completedOn` is the local day (`YYYY-MM-DD`), or `null` when Habitica sent no date. */
	| { readonly kind: 'completed'; readonly completedOn: string | null; readonly checklist?: Checklist }
	/** A daily, the one a campaign habit builds: its current streak, which one missed day sends back to zero. */
	| { readonly kind: 'daily'; readonly streak: number }
	/** The task no longer exists, or its id is not a Habitica id. */
	| { readonly kind: 'missing' };

/** Where the state of linked tasks comes from (Habitica in M2). */
export interface TaskStatusSource {
	/**
	 * Status of each id. An id the source could not answer within its request
	 * budget is left out of the map. Rejects only with a `TaskSourceError`.
	 */
	fetchStatuses(ids: readonly string[]): Promise<ReadonlyMap<string, TaskStatus>>;
}
