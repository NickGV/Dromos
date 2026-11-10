import { describe, expect, it } from 'vitest';
import { MarkResourceFinished } from '../../src/application';
import { FixedClock } from '../fakes/FixedClock';
import { InMemoryResourceRepository } from '../fakes/InMemoryResourceRepository';
import { aResource } from '../fakes/resources';

const PATH = aResource().path;

function markOver(repository: InMemoryResourceRepository): MarkResourceFinished {
	return new MarkResourceFinished({ repository, clock: new FixedClock(new Date(2026, 10, 10, 12), '2026-11-10') });
}

describe('MarkResourceFinished: "Marcar como leído" (M8 S6)', () => {
	it('writes today as `finished` and nothing else', async () => {
		const repository = new InMemoryResourceRepository([aResource()]);

		expect(await markOver(repository).execute(PATH)).toEqual({ kind: 'finished' });
		expect(repository.writes).toEqual([{ path: PATH, fields: { finished: '2026-11-10' } }]);
		expect((await repository.list())[0]?.finished).toBe('2026-11-10');
	});

	it('a resource already marked keeps its date: nothing is written', async () => {
		const repository = new InMemoryResourceRepository([aResource({ finished: '2026-11-09' })]);

		expect(await markOver(repository).execute(PATH)).toEqual({ kind: 'already-finished' });
		expect(repository.writes).toEqual([]);
	});

	it('a path that is not in the archive is not-found', async () => {
		const repository = new InMemoryResourceRepository([aResource()]);

		expect(await markOver(repository).execute('otro.md')).toEqual({ kind: 'not-found' });
		expect(repository.writes).toEqual([]);
	});

	it('a save that fails is write-failed, never a rejection', async () => {
		const repository = new InMemoryResourceRepository([aResource()]);
		repository.failWritesWith = new Error('disk full');

		expect(await markOver(repository).execute(PATH)).toEqual({ kind: 'write-failed' });
	});

	it('a note that changed under it reports what the vault answered', async () => {
		const repository = new InMemoryResourceRepository([aResource()]);
		repository.markFinished = () => Promise.resolve('not-a-resource');

		expect(await markOver(repository).execute(PATH)).toEqual({ kind: 'not-found' });
		repository.markFinished = () => Promise.resolve('already-finished');
		expect(await markOver(repository).execute(PATH)).toEqual({ kind: 'already-finished' });
	});
});
