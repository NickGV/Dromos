import { describe, expect, it } from 'vitest';
import { FinishReading } from '../../src/application/FinishReading';
import type { Book, LifecycleStatus } from '../../src/domain';
import { aBook } from '../fakes/books';
import { FixedClock } from '../fakes/FixedClock';
import { InMemoryBookRepository } from '../fakes/InMemoryBookRepository';

const PATH = aBook().path;
const TODAY = '2026-11-09';
const ID = '3f2a1c8e-0000-4000-8000-000000000001';

function setup(books: readonly Book[]) {
	const repository = new InMemoryBookRepository(books);
	const clock = new FixedClock(new Date('2026-11-09T15:00:00Z'), TODAY);
	return { repository, finish: new FinishReading({ repository, clock }) };
}

describe('FinishReading: "Terminar" (S4)', () => {
	it('moves a book being read to completed, with today as finished', async () => {
		const { repository, finish } = setup([aBook({ status: 'active', started: '2026-11-01', habiticaId: ID })]);

		expect(await finish.execute(PATH)).toEqual({ kind: 'finished' });
		expect(repository.writes).toEqual([{ method: 'finishReading', path: PATH, fields: { finished: TODAY } }]);
		expect((await repository.list())[0]).toMatchObject({ status: 'completed', started: '2026-11-01', finished: TODAY });
	});

	it('leaves the reading to-do alone: its id stays and the use case has no Habitica port (A2)', async () => {
		const deps = { repository: new InMemoryBookRepository([aBook({ status: 'active', habiticaId: ID })]), clock: new FixedClock(new Date(), TODAY) };

		await new FinishReading(deps).execute(PATH);

		expect(Object.keys(deps)).toEqual(['repository', 'clock']);
		expect((await deps.repository.list())[0]?.habiticaId).toBe(ID);
	});

	it('does nothing for a book that is not being read', async () => {
		for (const status of ['planning', 'paused', 'completed', 'archived'] satisfies LifecycleStatus[]) {
			const { repository, finish } = setup([aBook({ status })]);

			expect(await finish.execute(PATH)).toEqual({ kind: 'not-reading' });
			expect(repository.writes).toEqual([]);
		}
	});

	it('is not-found for a path that is not a listed book, or a note that vanished or stopped being a book', async () => {
		expect(await setup([]).finish.execute(PATH)).toEqual({ kind: 'not-found' });

		for (const result of ['not-found', 'not-a-book'] as const) {
			const { repository, finish } = setup([aBook({ status: 'active' })]);
			repository.finishReading = () => Promise.resolve(result);

			expect(await finish.execute(PATH)).toEqual({ kind: 'not-found' });
		}
	});

	it('reports write-failed when the note cannot be saved, and never rejects', async () => {
		const { repository, finish } = setup([aBook({ status: 'active' })]);
		repository.failWritesWith = new Error('EACCES');

		expect(await finish.execute(PATH)).toEqual({ kind: 'write-failed' });
	});
});
