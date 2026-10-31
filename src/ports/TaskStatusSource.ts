/** What Habitica says about one linked task (S4 of M2). */
export type TaskStatus =
	| { readonly kind: 'open' }
	/** `completedOn` is the local day (`YYYY-MM-DD`), or `null` when Habitica sent no date. */
	| { readonly kind: 'completed'; readonly completedOn: string | null }
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
