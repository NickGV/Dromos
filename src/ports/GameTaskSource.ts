import type { TaskObservation } from '../domain';

/** A Habitica task as the game reads it: what the ledger needs, plus the streak of a daily. */
export interface ObservedTask extends TaskObservation {
	/** Current streak of a daily; `null` for a to-do. */
	readonly streak: number | null;
}

/** Where the game reads Habitica's state from (Habitica in M3). */
export interface GameTaskSource {
	/**
	 * Every daily and to-do the game may need: the dailies, the open to-dos and the recently
	 * completed ones, each with the skills of its `skill/<id>` tags. `today` is the local date
	 * (`YYYY-MM-DD`) a daily completed now is dated with. Rejects only with a `TaskSourceError`.
	 */
	fetchObservations(today: string): Promise<ObservedTask[]>;
}
