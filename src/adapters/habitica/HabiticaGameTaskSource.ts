import { TaskSourceError, type GameTaskSource, type ObservedTask } from '../../ports';
import type { HabiticaClient } from './HabiticaClient';
import { observedTaskFromHabiticaTask, skillTagIds } from './gameTaskMapper';
import { readHabiticaTags, readHabiticaTasks } from './habiticaTask';

const TAGS_PATH = '/tags';
const DAILIES_PATH = '/tasks/user?type=dailys';
const TODOS_PATH = '/tasks/user?type=todos';
/** Habitica returns only the most recently completed to-dos here. */
const COMPLETED_PATH = '/tasks/user?type=completedTodos';

/**
 * What the game reads from Habitica: four requests, one after the other so a failure (401,
 * 429) spends no further request. Rejects only with `TaskSourceError`.
 */
export class HabiticaGameTaskSource implements GameTaskSource {
	constructor(private readonly client: HabiticaClient) {}

	async fetchObservations(today: string): Promise<ObservedTask[]> {
		try {
			const skillTags = skillTagIds(readHabiticaTags(await this.client.get(TAGS_PATH)));
			const tasks = [];
			for (const path of [DAILIES_PATH, TODOS_PATH, COMPLETED_PATH]) tasks.push(...readHabiticaTasks(await this.client.get(path)));
			return tasks.flatMap((task) => observedTaskFromHabiticaTask(task, skillTags, today) ?? []);
		} catch (error) {
			if (error instanceof TaskSourceError) throw error;
			// Unexpected errors are replaced, not wrapped: their messages may carry credentials.
			throw new TaskSourceError('Unknown', null, 'Habitica tasks could not be read');
		}
	}
}
