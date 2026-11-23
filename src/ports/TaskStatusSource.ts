import type { Checklist } from '../domain';

/** What Habitica says about one linked task (S4 of M2). `checklist` is there only when the task has subtasks (missions S2). */
export type TaskStatus =
	/** `title` is there only for an answer from the open list (`LinkedTasks.openTodos`). */
	| { readonly kind: 'open'; readonly checklist?: Checklist; readonly title?: string }
	/** `completedOn` is the local day (`YYYY-MM-DD`), or `null` when Habitica sent no date. */
	| { readonly kind: 'completed'; readonly completedOn: string | null; readonly checklist?: Checklist }
	/** A daily, the one a campaign habit builds: its current streak, which one missed day sends back to zero. */
	| { readonly kind: 'daily'; readonly streak: number }
	/**
	 * Habitica confirmed it no longer has it (ADR-021): a daily whose id is not in its list of
	 * dailies, or a to-do whose lookup answered 404. A 404 alone does not prove a delete: Habitica
	 * forgets old completed to-dos too, so the use case checks the ledger before believing it.
	 */
	| { readonly kind: 'deleted' }
	/** Its id is not a Habitica id, so it was never asked for. */
	| { readonly kind: 'missing' };

/** The linked ids of one sync, apart by kind (ADR-021): the to-dos of campaign tasks and the dailies of habits. */
export interface LinkedTasks {
	readonly todos: readonly string[];
	readonly dailies: readonly string[];
	/**
	 * Also answer every open to-do of the account, with its title: the list a campaign task can be
	 * linked from (link-existing-todo S5). Read from the same list as the linked to-dos.
	 */
	readonly openTodos?: boolean;
}

/** Where the state of linked tasks comes from (Habitica in M2). */
export interface TaskStatusSource {
	/**
	 * Status of each id. An id the source could not answer within its request budget is left out
	 * of the map, so it is never taken for deleted. Rejects only with a `TaskSourceError`.
	 */
	fetchStatuses(linked: LinkedTasks): Promise<ReadonlyMap<string, TaskStatus>>;
}
