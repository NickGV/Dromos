import { describe, expect, it } from 'vitest';
import { StartReading, type ReadingTodo } from '../../src/application/StartReading';
import type { Book, LifecycleStatus } from '../../src/domain';
import { TaskSourceError } from '../../src/ports/TaskSourceError';
import { aBook } from '../fakes/books';
import { FakeTagCatalog } from '../fakes/FakeTagCatalog';
import { FakeTaskCreator } from '../fakes/FakeTaskCreator';
import { FixedClock } from '../fakes/FixedClock';
import { InMemoryBookRepository } from '../fakes/InMemoryBookRepository';

const PATH = aBook().path;
const TODAY = '2026-11-09';
const ID = '3f2a1c8e-0000-4000-8000-000000000001';
const CHECKLIST = ['Terminar de leer', 'De qué trata', 'Qué me quedó', 'Qué cambia en mí', 'Con qué lo conecto'];

/** Stands in for the copy the composition root builds from i18n. */
const readingTodo = (book: Book): ReadingTodo => ({ title: `Leer: ${book.title}`, notes: `Dromos · Biblioteca\nlink:${book.path}`, checklist: CHECKLIST });

function setup(books: readonly Book[] = [aBook()]) {
	const repository = new InMemoryBookRepository(books);
	const creator = new FakeTaskCreator();
	const tags = new FakeTagCatalog();
	const clock = new FixedClock(new Date('2026-11-09T15:00:00Z'), TODAY);
	return { repository, creator, tags, start: new StartReading({ repository, creator, tags, clock, readingTodo }) };
}

describe('StartReading: "Empezar a leer" (S3, S4)', () => {
	it('ensures the lector tag, creates one to-do with the five-item checklist, then writes active, started and habitica_id', async () => {
		const { repository, creator, tags, start } = setup();

		const outcome = await start.execute(PATH);

		expect(outcome).toEqual({ kind: 'started', habiticaId: ID });
		expect(tags.asked).toEqual([['lector']]);
		expect(creator.created).toEqual([{ title: 'Leer: Klara y el Sol', notes: `Dromos · Biblioteca\nlink:${PATH}`, tags: ['tag-lector'], checklist: CHECKLIST }]);
		expect(repository.writes).toEqual([{ method: 'startReading', path: PATH, fields: { started: TODAY, habiticaId: ID } }]);
		expect((await repository.list())[0]).toMatchObject({ status: 'active', started: TODAY, habiticaId: ID });
	});

	it('shares one to-do between two taps that arrive together', async () => {
		const { repository, creator, start } = setup();

		const [first, second] = await Promise.all([start.execute(PATH), start.execute(PATH)]);

		expect(creator.created).toHaveLength(1);
		expect(repository.writes).toHaveLength(1);
		expect(first).toEqual(second);
	});

	it('a tap after the first one finished finds the book being read and creates nothing', async () => {
		const { creator, start } = setup();

		await start.execute(PATH);

		expect(await start.execute(PATH)).toEqual({ kind: 'not-pending' });
		expect(creator.created).toHaveLength(1);
	});

	it('a book that already has a habitica_id gets only its state and date: no tag, no second to-do', async () => {
		const { repository, creator, tags, start } = setup([aBook({ habiticaId: 'existing-id' })]);

		expect(await start.execute(PATH)).toEqual({ kind: 'started', habiticaId: 'existing-id' });
		expect(tags.asked).toEqual([]);
		expect(creator.created).toEqual([]);
		expect(repository.writes).toEqual([{ method: 'startReading', path: PATH, fields: { started: TODAY, habiticaId: 'existing-id' } }]);
	});

	it('writes nothing and creates nothing when the tags fail (A2)', async () => {
		const { repository, creator, tags, start } = setup();
		tags.failWith = new TaskSourceError('Offline');

		expect(await start.execute(PATH)).toEqual({ kind: 'habitica-failed', error: 'Offline' });
		expect(creator.created).toEqual([]);
		expect(repository.writes).toEqual([]);
		expect((await repository.list())[0]?.status).toBe('planning');
	});

	it('writes nothing when creating the to-do fails, whatever the error (A2)', async () => {
		for (const [error, kind] of [
			[new TaskSourceError('RateLimited', 30), 'RateLimited'],
			[new Error('socket hang up'), 'Unknown'],
		] as const) {
			const { repository, creator, start } = setup();
			creator.failWith = error;

			expect(await start.execute(PATH)).toEqual({ kind: 'habitica-failed', error: kind });
			expect(repository.writes).toEqual([]);
		}
	});

	it('reports the id of a to-do that was created when the note could not be saved', async () => {
		const { repository, creator, start } = setup();
		repository.failWritesWith = new Error('EACCES');

		expect(await start.execute(PATH)).toEqual({ kind: 'write-failed', habiticaId: ID });
		expect(creator.created).toHaveLength(1);
	});

	it('reports the id of a to-do that was created when the note vanished meanwhile', async () => {
		const { repository, start } = setup();
		repository.startReading = () => Promise.resolve('not-found');

		expect(await start.execute(PATH)).toEqual({ kind: 'write-failed', habiticaId: ID });
	});

	it('reports a duplicate when the note already held another to-do the stale list did not show', async () => {
		const { repository, start } = setup([aBook({ habiticaId: 'linked-meanwhile' })]);
		repository.list = () => Promise.resolve([aBook()]);

		expect(await start.execute(PATH)).toEqual({ kind: 'duplicate', habiticaId: ID });
		expect(repository.writes).toEqual([]);
	});

	it('does nothing for a book that is not pending', async () => {
		for (const status of ['active', 'paused', 'completed', 'archived'] satisfies LifecycleStatus[]) {
			const { repository, creator, tags, start } = setup([aBook({ status })]);

			expect(await start.execute(PATH)).toEqual({ kind: 'not-pending' });
			expect(tags.asked).toEqual([]);
			expect(creator.created).toEqual([]);
			expect(repository.writes).toEqual([]);
		}
	});

	it('is not-found for a path that is not a listed book', async () => {
		const { creator, start } = setup();

		expect(await start.execute('Inbox/Nothing.md')).toEqual({ kind: 'not-found' });
		expect(creator.created).toEqual([]);
	});

	it('without creating anything, still reports the to-do id when the note cannot be saved, and not-found when it vanished', async () => {
		const failing = setup([aBook({ habiticaId: 'existing-id' })]);
		failing.repository.failWritesWith = new Error('EACCES');
		expect(await failing.start.execute(PATH)).toEqual({ kind: 'write-failed', habiticaId: 'existing-id' });

		const vanished = setup([aBook({ habiticaId: 'existing-id' })]);
		vanished.repository.startReading = () => Promise.resolve('not-a-book');
		expect(await vanished.start.execute(PATH)).toEqual({ kind: 'not-found' });
	});

	it('without creating anything, is not-pending when the note already holds another to-do the list did not show', async () => {
		const { repository, creator, start } = setup([aBook({ habiticaId: 'linked-meanwhile' })]);
		repository.list = () => Promise.resolve([aBook({ habiticaId: 'existing-id' })]);

		expect(await start.execute(PATH)).toEqual({ kind: 'not-pending' });
		expect(creator.created).toEqual([]);
		expect(repository.writes).toEqual([]);
	});
});
