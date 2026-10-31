import { TaskSourceError, type NewTodo, type TaskCreator } from '../../ports';
import type { HabiticaClient } from './HabiticaClient';
import { readHabiticaTask } from './habiticaTask';

/** Creates to-dos in Habitica with `POST /tasks/user`; Habitica answers with the created task. */
export class HabiticaTaskCreator implements TaskCreator {
	constructor(private readonly client: HabiticaClient) {}

	async createTodo(todo: NewTodo): Promise<string> {
		try {
			const created = readHabiticaTask(await this.client.post('/tasks/user', { text: todo.title, type: 'todo', notes: todo.notes }));
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
