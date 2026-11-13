import { TaskSourceError, type LinkedTasks, type TaskStatus, type TaskStatusSource } from '../../ports';
import type { HabiticaClient } from './HabiticaClient';
import { readHabiticaTask, readHabiticaTasks, type HabiticaTaskDto } from './habiticaTask';
import { checklistOf, localDate } from './questMapper';

const TODOS_PATH = '/tasks/user?type=todos';
/** Habitica returns only the 30 most recently completed to-dos here. */
const COMPLETED_PATH = '/tasks/user?type=completedTodos';
/** Every daily of the account, due today or not: the one the quests read too. */
const DAILIES_PATH = '/tasks/user?type=dailys';
const HABITICA_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Habitica allows 30 requests per minute; a sync already spends two on quests and up to three on lists. */
const DEFAULT_MAX_LOOKUPS = 10;
const DELETED: TaskStatus = { kind: 'deleted' };

/**
 * Status of linked Habitica tasks (S4, ADR-021). For the to-dos, reads the open and the recently
 * completed lists, then looks up one by one the ids neither answered, because `completedTodos`
 * forgets everything past the 30 most recent; a 404 there is `deleted`. For the dailies, reads the
 * one list of dailies: a daily in it has its streak, one not in it is `deleted`, so a daily never
 * spends a lookup. A list is only asked for when some id needs it. Rejects only with
 * `TaskSourceError`, and then answers nothing, so nothing is taken for deleted.
 */
export class HabiticaTaskStatusSource implements TaskStatusSource {
	constructor(
		private readonly client: HabiticaClient,
		private readonly maxLookups: number = DEFAULT_MAX_LOOKUPS,
	) {}

	async fetchStatuses({ todos, dailies }: LinkedTasks): Promise<ReadonlyMap<string, TaskStatus>> {
		const statuses = new Map<string, TaskStatus>();
		const wantedDailies = [...new Set(dailies)];
		const wantedTodos = [...new Set(todos)].filter((id) => !wantedDailies.includes(id));
		for (const id of [...wantedTodos, ...wantedDailies]) if (!HABITICA_ID.test(id)) statuses.set(id, { kind: 'missing' });

		const validTodos = wantedTodos.filter((id) => !statuses.has(id));
		const validDailies = wantedDailies.filter((id) => !statuses.has(id));
		if (validTodos.length === 0 && validDailies.length === 0) return statuses;

		try {
			if (validTodos.length > 0) {
				for (const path of [TODOS_PATH, COMPLETED_PATH]) {
					for (const dto of readHabiticaTasks(await this.client.get(path))) {
						const id = idOf(dto);
						if (validTodos.includes(id) && !statuses.has(id)) statuses.set(id, statusOf(dto));
					}
				}
			}
			if (validDailies.length > 0) {
				const listed = new Map(readHabiticaTasks(await this.client.get(DAILIES_PATH)).map((dto) => [idOf(dto), dto]));
				for (const id of validDailies) {
					const dto = listed.get(id);
					statuses.set(id, dto ? statusOf(dto) : DELETED);
				}
			}
			for (const id of validTodos.filter((candidate) => !statuses.has(candidate)).slice(0, this.maxLookups)) {
				const data = await this.client.find(`/tasks/${encodeURIComponent(id)}`);
				statuses.set(id, data === null ? DELETED : statusOf(readHabiticaTask(data)));
			}
			return statuses;
		} catch (error) {
			if (error instanceof TaskSourceError) throw error;
			// Unexpected errors are replaced, not wrapped: their messages may carry credentials.
			throw new TaskSourceError('Unknown', null, 'Habitica tasks could not be read');
		}
	}
}

function idOf(dto: HabiticaTaskDto): string {
	return dto.id ?? dto._id ?? '';
}

function statusOf(dto: HabiticaTaskDto): TaskStatus {
	if (dto.type === 'daily') return { kind: 'daily', streak: typeof dto.streak === 'number' && Number.isFinite(dto.streak) && dto.streak > 0 ? Math.floor(dto.streak) : 0 };
	const subtasks = checklistOf(dto.checklist);
	return dto.completed === true ? { kind: 'completed', completedOn: localDate(dto.dateCompleted), ...subtasks } : { kind: 'open', ...subtasks };
}
