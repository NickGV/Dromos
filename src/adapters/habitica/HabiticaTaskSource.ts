import { selectTodaysQuests, type Quest } from '../../domain';
import { TaskSourceError, type Clock, type TaskSource } from '../../ports';
import type { HabiticaClient } from './HabiticaClient';
import { readHabiticaTasks } from './habiticaTask';
import { questFromHabiticaTask } from './questMapper';

const DAILIES_PATH = '/tasks/user?type=dailys';
const TODOS_PATH = '/tasks/user?type=todos';

/** Today's quests from Habitica (S6): dailies and to-dos, filtered by `selectTodaysQuests`. */
export class HabiticaTaskSource implements TaskSource {
	constructor(
		private readonly client: HabiticaClient,
		private readonly clock: Clock,
	) {}

	/**
	 * Requests dailies, then to-dos, one after the other so a failure (401, 429)
	 * spends no second request. Rejects only with `TaskSourceError`.
	 */
	async fetchToday(): Promise<Quest[]> {
		try {
			const dailies = readHabiticaTasks(await this.client.get(DAILIES_PATH));
			const todos = readHabiticaTasks(await this.client.get(TODOS_PATH));
			const quests = [...dailies, ...todos]
				.map(questFromHabiticaTask)
				.filter((quest): quest is Quest => quest !== null);
			return selectTodaysQuests(quests, this.clock.today());
		} catch (error) {
			if (error instanceof TaskSourceError) throw error;
			// Unexpected errors are replaced, not wrapped: their messages may carry credentials.
			throw new TaskSourceError('Unknown', null, 'Habitica tasks could not be read');
		}
	}
}
