import { TaskSourceError, type NewDaily, type NewTodo, type TaskCreator } from '../../ports';
import type { HabiticaClient } from './HabiticaClient';
import { readHabiticaTask } from './habiticaTask';

/** Creates to-dos and dailies in Habitica with `POST /tasks/user`; Habitica answers with the created task. */
export class HabiticaTaskCreator implements TaskCreator {
	constructor(private readonly client: HabiticaClient) {}

	createTodo(todo: NewTodo): Promise<string> {
		return this.create('todo', todo);
	}

	createDaily(daily: NewDaily): Promise<string> {
		return this.create('daily', daily);
	}

	private async create(type: 'todo' | 'daily', task: NewTodo): Promise<string> {
		try {
			const created = readHabiticaTask(
				await this.client.post('/tasks/user', {
					text: task.title,
					type,
					notes: task.notes,
					...(task.tags && task.tags.length > 0 ? { tags: task.tags } : {}),
					...(task.checklist && task.checklist.length > 0 ? { checklist: task.checklist.map((text) => ({ text, completed: false })) } : {}),
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
