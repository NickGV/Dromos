import { describe, expect, it } from 'vitest';
import { HabiticaClient } from '../../../src/adapters/habitica/HabiticaClient';
import { HabiticaTaskCreator } from '../../../src/adapters/habitica/HabiticaTaskCreator';
import { TaskSourceError } from '../../../src/ports/TaskSourceError';
import { FakeHttp, habiticaFixture, respond, type FakeOutcome } from './FakeHttp';

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

	it('sends the tag ids when the to-do has them, and no tags key when it has none', async () => {
		const tagged = creatorWith(respond(201, { success: true, data: { _id: ID, id: ID, text: 'Task', type: 'todo' } }));
		await tagged.creator.createTodo({ title: 'Task', notes: '', tags: ['t-lector', 't-atleta'] });
		expect(JSON.parse(tagged.http.requests[0]?.body ?? '{}')).toEqual({ text: 'Task', type: 'todo', notes: '', tags: ['t-lector', 't-atleta'] });

		const plain = creatorWith(respond(201, { success: true, data: { _id: ID, id: ID, text: 'Task', type: 'todo' } }));
		await plain.creator.createTodo({ title: 'Task', notes: '', tags: [] });
		expect(JSON.parse(plain.http.requests[0]?.body ?? '{}')).toEqual({ text: 'Task', type: 'todo', notes: '' });
	});

	it('sends each checklist item as an unchecked Habitica checklist entry, in order', async () => {
		const { http, creator } = creatorWith(respond(201, { success: true, data: { _id: ID, id: ID, text: 'Leer: Klara y el Sol', type: 'todo' } }));

		await creator.createTodo({ title: 'Leer: Klara y el Sol', notes: 'Dromos', tags: ['t-lector'], checklist: ['Terminar de leer', 'De qué trata'] });

		expect(JSON.parse(http.requests[0]?.body ?? '{}')).toEqual({
			text: 'Leer: Klara y el Sol',
			type: 'todo',
			notes: 'Dromos',
			tags: ['t-lector'],
			checklist: [
				{ text: 'Terminar de leer', completed: false },
				{ text: 'De qué trata', completed: false },
			],
		});
	});

	it('sends no checklist key when the to-do has none or an empty one, so the body is the same as before checklists', async () => {
		for (const todo of [{ title: 'Task', notes: 'Dromos · Kairos' }, { title: 'Task', notes: 'Dromos · Kairos', checklist: [] }]) {
			const { http, creator } = creatorWith(respond(201, { success: true, data: { _id: ID, id: ID, text: 'Task', type: 'todo' } }));

			await creator.createTodo(todo);

			expect(http.requests[0]?.body).toBe(JSON.stringify({ text: 'Task', type: 'todo', notes: 'Dromos · Kairos' }));
		}
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

const EVERY_DAY = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
/** Habitica's schedule of a daily due every day: weekly, every week, all seven days on (ADR-021). */
const DAILY_EVERY_DAY = { frequency: 'weekly', everyX: 1, repeat: { m: true, t: true, w: true, th: true, f: true, s: true, su: true } };

describe('HabiticaTaskCreator.createDaily', () => {
    it('posts one daily with its title, notes, tags and schedule and resolves with the new id', async () => {
        const { http, creator } = creatorWith(respond(201, { success: true, data: { _id: ID, id: ID, text: 'Stretch', type: 'daily' } }));

        const id = await creator.createDaily({ title: 'Stretch', notes: 'Dromos · Salto', tags: ['t-atleta'], repeat: EVERY_DAY });

        expect(id).toBe(ID);
        expect(JSON.parse(http.requests[0]?.body ?? '{}')).toEqual({ text: 'Stretch', type: 'daily', notes: 'Dromos · Salto', tags: ['t-atleta'], ...DAILY_EVERY_DAY });
    });

    it('sends no tags key without tags and rejects with the typed errors', async () => {
        const plain = creatorWith(respond(201, { success: true, data: { _id: ID, id: ID, text: 'Stretch', type: 'daily' } }));
        await plain.creator.createDaily({ title: 'Stretch', notes: '', repeat: EVERY_DAY });
        expect(JSON.parse(plain.http.requests[0]?.body ?? '{}')).toEqual({ text: 'Stretch', type: 'daily', notes: '', ...DAILY_EVERY_DAY });

        await expect(creatorWith(respond(401, {})).creator.createDaily({ title: 'Stretch', notes: '', repeat: EVERY_DAY })).rejects.toMatchObject({ kind: 'Unauthorized' });
        await expect(creatorWith(respond(201, { success: true, data: [{ id: ID }] })).creator.createDaily({ title: 'Stretch', notes: '', repeat: EVERY_DAY })).rejects.toMatchObject({
            kind: 'Unknown',
        });
    });

    it('repeats on the chosen weekdays only: weekly, every week, those days true and the rest false (ADR-021)', async () => {
        const { http, creator } = creatorWith(respond(201, { success: true, data: { _id: ID, id: ID, text: 'Fuerza', type: 'daily' } }));

        await creator.createDaily({ title: 'Fuerza', notes: '', repeat: ['mon', 'wed', 'fri'] });

        expect(JSON.parse(http.requests[0]?.body ?? '{}')).toMatchObject({
            frequency: 'weekly',
            everyX: 1,
            repeat: { m: true, t: false, w: true, th: false, f: true, s: false, su: false },
        });
    });

    it('always sends the schedule: every day is all seven days true, never an omitted repeat', async () => {
        const { http, creator } = creatorWith(respond(201, { success: true, data: { _id: ID, id: ID, text: 'Stretch', type: 'daily' } }));

        await creator.createDaily({ title: 'Stretch', notes: '', repeat: EVERY_DAY });

        expect(JSON.parse(http.requests[0]?.body ?? '{}')).toMatchObject(DAILY_EVERY_DAY);
    });

    it('never creates a daily due on no day: an empty list of weekdays is every day', async () => {
        const { http, creator } = creatorWith(respond(201, { success: true, data: { _id: ID, id: ID, text: 'Stretch', type: 'daily' } }));

        await creator.createDaily({ title: 'Stretch', notes: '', repeat: [] });

        expect(JSON.parse(http.requests[0]?.body ?? '{}')).toMatchObject(DAILY_EVERY_DAY);
    });

    it('sends the checklist as unchecked items, in order, and no checklist key when it is empty', async () => {
        const listed = creatorWith(respond(201, { success: true, data: { _id: ID, id: ID, text: 'Rutina de mañana', type: 'daily' } }));
        await listed.creator.createDaily({ title: 'Rutina de mañana', notes: '', repeat: EVERY_DAY, checklist: ['Agua', 'Estirar'] });
        expect(JSON.parse(listed.http.requests[0]?.body ?? '{}')).toMatchObject({
            checklist: [
                { text: 'Agua', completed: false },
                { text: 'Estirar', completed: false },
            ],
        });

        const plain = creatorWith(respond(201, { success: true, data: { _id: ID, id: ID, text: 'Stretch', type: 'daily' } }));
        await plain.creator.createDaily({ title: 'Stretch', notes: '', repeat: EVERY_DAY, checklist: [] });
        expect(JSON.parse(plain.http.requests[0]?.body ?? '{}')).not.toHaveProperty('checklist');
    });

    it('uses the field names of a recorded Habitica daily for the schedule', async () => {
        // "Weekly review" in the fixture repeats on Sundays only.
        const recorded = ((await habiticaFixture('dailys')) as { data: Record<string, unknown>[] }).data[2] ?? {};
        const { http, creator } = creatorWith(respond(201, { success: true, data: { _id: ID, id: ID, text: 'Weekly review', type: 'daily' } }));

        await creator.createDaily({ title: 'Weekly review', notes: '', repeat: ['sun'] });

        const body = JSON.parse(http.requests[0]?.body ?? '{}') as Record<string, unknown>;
        expect({ frequency: body.frequency, everyX: body.everyX, repeat: body.repeat }).toEqual({ frequency: recorded.frequency, everyX: recorded.everyX, repeat: recorded.repeat });
    });
});
