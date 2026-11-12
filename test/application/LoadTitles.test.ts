import { describe, expect, it } from 'vitest';
import { LoadTitles } from '../../src/application/LoadTitles';
import { aTitle, InMemoryTitleRepository } from '../fakes/InMemoryTitleRepository';

describe('LoadTitles: the titles Esdras granted, from the vault alone (titles S3, S5)', () => {
	it('answers the readable titles newest grant first, and the rows it could not read', async () => {
		const unreadable = [{ path: 'Dromos/Titles.md', line: 6, text: '| x | X |' }];
		const titles = new InMemoryTitleRepository([aTitle('corredor', '2026-11-01'), aTitle('perseverante', '2027-10-21'), aTitle('lector', '2027-03-14')], unreadable);

		const reading = await new LoadTitles({ titles }).execute();

		expect(reading.titles.map((title) => title.id)).toEqual(['perseverante', 'lector', 'corredor']);
		expect(reading.unreadable).toEqual(unreadable);
	});

	it('has no titles when the note cannot be read, and never rejects', async () => {
		const titles = new InMemoryTitleRepository([aTitle('corredor', '2026-11-01')]);
		titles.failWith = new Error('disk');

		expect(await new LoadTitles({ titles }).execute()).toEqual({ titles: [], unreadable: [] });
	});
});
