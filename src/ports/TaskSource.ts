import type { Quest } from '../domain';

/** Where quests come from (Habitica in M1). */
export interface TaskSource {
	/**
	 * Today's quests, already passed through `selectTodaysQuests` with `Clock.today()`.
	 * Rejects only with a `TaskSourceError`.
	 */
	fetchToday(): Promise<Quest[]>;
}
