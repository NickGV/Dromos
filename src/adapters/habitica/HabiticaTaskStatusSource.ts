import { TaskSourceError, type TaskStatus, type TaskStatusSource } from '../../ports';
import type { HabiticaClient } from './HabiticaClient';
import { readHabiticaTask, readHabiticaTasks, type HabiticaTaskDto } from './habiticaTask';
import { localDate } from './questMapper';

const TODOS_PATH = '/tasks/user?type=todos';
/** Habitica returns only the 30 most recently completed to-dos here. */
const COMPLETED_PATH = '/tasks/user?type=completedTodos';
const HABITICA_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Habitica allows 30 requests per minute; a sync already spends two on quests and two on lists. */
const DEFAULT_MAX_LOOKUPS = 10;

/**
 * Status of linked Habitica tasks (S4). Reads the open and the recently completed
 * to-dos, then looks up one by one the ids neither list answered, because
 * `completedTodos` forgets everything past the 30 most recent. Rejects only with
 * `TaskSourceError`.
 */
export class HabiticaTaskStatusSource implements TaskStatusSource {
	constructor(
		private readonly client: HabiticaClient,
		private readonly maxLookups: number = DEFAULT_MAX_LOOKUPS,
	) {}

	async fetchStatuses(ids: readonly string[]): Promise<ReadonlyMap<string, TaskStatus>> {
		const statuses = new Map<string, TaskStatus>();
		const wanted = [...new Set(ids)];
		for (const id of wanted) if (!HABITICA_ID.test(id)) statuses.set(id, { kind: 'missing' });

		const valid = wanted.filter((id) => !statuses.has(id));
		if (valid.length === 0) return statuses;

		try {
			for (const path of [TODOS_PATH, COMPLETED_PATH]) {
				for (const dto of readHabiticaTasks(await this.client.get(path))) {
					const id = dto.id ?? dto._id ?? '';
					if (valid.includes(id) && !statuses.has(id)) statuses.set(id, statusOf(dto));
				}
			}
			for (const id of valid.filter((candidate) => !statuses.has(candidate)).slice(0, this.maxLookups)) {
				const data = await this.client.find(`/tasks/${encodeURIComponent(id)}`);
				statuses.set(id, data === null ? { kind: 'missing' } : statusOf(readHabiticaTask(data)));
			}
			return statuses;
		} catch (error) {
			if (error instanceof TaskSourceError) throw error;
			// Unexpected errors are replaced, not wrapped: their messages may carry credentials.
			throw new TaskSourceError('Unknown', null, 'Habitica tasks could not be read');
		}
	}
}

function statusOf(dto: HabiticaTaskDto): TaskStatus {
	return dto.completed === true ? { kind: 'completed', completedOn: localDate(dto.dateCompleted) } : { kind: 'open' };
}
