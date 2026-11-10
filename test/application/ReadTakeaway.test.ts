import { describe, expect, it } from 'vitest';
import { ReadTakeaway } from '../../src/application';
import { InMemoryResourceRepository } from '../fakes/InMemoryResourceRepository';
import { aResource } from '../fakes/resources';

describe('ReadTakeaway: "Lo que me dejó", for the card (M8 S6)', () => {
	it('answers what the note holds under the heading', async () => {
		const repository = new InMemoryResourceRepository([aResource()]);
		repository.takeaways.set(aResource().path, 'Un módulo es una decisión.');

		expect(await new ReadTakeaway({ resources: repository }).execute(aResource().path)).toBe('Un módulo es una decisión.');
	});

	it('answers null for a missing note and for a read that fails, never a rejection', async () => {
		const repository = new InMemoryResourceRepository([aResource()]);
		const read = new ReadTakeaway({ resources: repository });
		expect(await read.execute('otro.md')).toBeNull();

		repository.failReadsWith = new Error('disk');
		expect(await read.execute(aResource().path)).toBeNull();
	});
});
