import type { Weekday } from '../../domain';
import { TaskSourceError, type NewDaily, type NewTodo, type TaskCreator } from '../../ports';
import type { HabiticaClient } from './HabiticaClient';
import { readHabiticaTask } from './habiticaTask';

/** Habitica's key for each weekday in a daily's `repeat`. */
const REPEAT_KEYS: Readonly<Record<Weekday, string>> = { mon: 'm', tue: 't', wed: 'w', thu: 'th', fri: 'f', sat: 's', sun: 'su' };

/** Creates to-dos and dailies in Habitica with `POST /tasks/user`; Habitica answers with the created task. */
export class HabiticaTaskCreator implements TaskCreator {
	constructor(private readonly client: HabiticaClient) {}

	createTodo(todo: NewTodo): Promise<string> {
		return this.create('todo', todo);
	}

	/**
	 * A daily always carries its schedule (ADR-021): weekly, every week, on its weekdays. Every day
	 * is sent as all seven days on, never left to Habitica's default, so every daily is sent alike.
	 */
	createDaily(daily: NewDaily): Promise<string> {
		return this.create('daily', daily, { frequency: 'weekly', everyX: 1, repeat: repeatOf(daily.repeat) });
	}

	/** Posts the task; `schedule` holds a daily's `frequency`, `everyX` and `repeat`, and nothing for a to-do. */
	private async create(type: 'todo' | 'daily', task: NewTodo, schedule: Readonly<Record<string, unknown>> = {}): Promise<string> {
		try {
			const created = readHabiticaTask(
				await this.client.post('/tasks/user', {
					text: task.title,
					type,
					notes: task.notes,
					...(task.tags && task.tags.length > 0 ? { tags: task.tags } : {}),
					...(task.checklist && task.checklist.length > 0 ? { checklist: task.checklist.map((text) => ({ text, completed: false })) } : {}),
					...schedule,
				}),
			);
			const id = created.id ?? created._id;
			if (!id) throw new TaskSourceError('Unknown', null, 'Habitica sent an unexpected task');
			return id;
		} catch (error) {
			if (error instanceof TaskSourceError) throw error;
			// Unexpected errors are replaced, not wrapped: their messages may carry credentials.
			throw new TaskSourceError('Unknown', null, 'Habitica task could not be created');
		}
	}
}

/** Habitica's `repeat` for `days`: each of them on, the rest off; no day at all is every day, so a daily is never due on none. */
function repeatOf(days: readonly Weekday[]): Record<string, boolean> {
	const on = new Set(days.length > 0 ? days : (Object.keys(REPEAT_KEYS) as Weekday[]));
	return Object.fromEntries((Object.entries(REPEAT_KEYS) as [Weekday, string][]).map(([day, key]) => [key, on.has(day)]));
}
