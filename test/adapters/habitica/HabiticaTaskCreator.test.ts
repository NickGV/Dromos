import { describe, expect, it } from 'vitest';
import { HabiticaClient } from '../../../src/adapters/habitica/HabiticaClient';
import { HabiticaTaskCreator } from '../../../src/adapters/habitica/HabiticaTaskCreator';
import { TaskSourceError } from '../../../src/ports/TaskSourceError';
import { FakeHttp, respond, type FakeOutcome } from './FakeHttp';

const URL = 'https://habitica.com/api/v3/tasks/user';
const TOKEN = 'secret-token-0000-4000-8000-123456789abc';
const ID = '3f2a1c8e-0000-4000-8000-000000000001';

function creatorWith(outcome: FakeOutcome) {
	const http = new FakeHttp().on(URL, outcome);
	return { http, creator: new HabiticaTaskCreator(new HabiticaClient(http.send, () => ({ userId: 'user-1', apiToken: TOKEN }))) };
}

describe('HabiticaTaskCreator.createTodo', () => {
	it('posts one to-do with its title and notes and resolves with the new id', async () => {
		const { http, creator } = creatorWith(respond(201, { success: true, data: { _id: ID, id: ID, text: 'Task', type: 'todo' } }));

		const id = await creator.createTodo({ title: 'Task', notes: 'Dromos · Kairos' });

		expect(id).toBe(ID);
		expect(http.requests).toHaveLength(1);
		expect(JSON.parse(http.requests[0]?.body ?? '{}')).toEqual({ text: 'Task', type: 'todo', notes: 'Dromos · Kairos' });
	});

	it('reads the id from _id when id is missing', async () => {
		const { creator } = creatorWith(respond(201, { success: true, data: { _id: ID, text: 'Task', type: 'todo' } }));

		expect(await creator.createTodo({ title: 'Task', notes: '' })).toBe(ID);
	});

	it('rejects with Unknown when Habitica answers with something that is not a task', async () => {
		const { creator } = creatorWith(respond(201, { success: true, data: [{ id: ID }] }));

		await expect(creator.createTodo({ title: 'Task', notes: '' })).rejects.toMatchObject({ kind: 'Unknown' });
	});

	it('rejects with the typed errors and never echoes the token', async () => {
		const unauthorized = creatorWith(respond(401, {})).creator.createTodo({ title: 'Task', notes: '' });
		await expect(unauthorized).rejects.toBeInstanceOf(TaskSourceError);
		await expect(unauthorized).rejects.toMatchObject({ kind: 'Unauthorized' });

		const error: unknown = await creatorWith(respond(500, {})).creator.createTodo({ title: 'Task', notes: '' }).catch((reason: unknown) => reason);
		expect(String((error as Error).message)).not.toContain(TOKEN);
	});
});
