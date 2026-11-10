import { describe, expect, it } from 'vitest';
import { LoadLibrary } from '../../src/application';
import { aBook } from '../fakes/books';
import { aResource } from '../fakes/resources';

const noResources = { list: () => Promise.resolve([]) };

describe('LoadLibrary (M7 S5)', () => {
	it('lists the books the repository reads, archived ones included: the screen decides what it shows', async () => {
		const books = [aBook({ title: 'A' }), aBook({ title: 'B', status: 'archived' })];
		const load = new LoadLibrary({ books: { list: () => Promise.resolve(books) }, resources: noResources });

		expect(await load.execute()).toEqual({ kind: 'loaded', books, resources: [] });
	});

	it('reads the vault again on every call, so a book added since shows', async () => {
		let books = [aBook({ title: 'A' })];
		const load = new LoadLibrary({ books: { list: () => Promise.resolve(books) }, resources: noResources });
		await load.execute();
		books = [...books, aBook({ title: 'B' })];

		expect(await load.execute()).toEqual({ kind: 'loaded', books, resources: [] });
	});

	it('says the library is unreadable instead of rejecting when the books cannot be read', async () => {
		const load = new LoadLibrary({ books: { list: () => Promise.reject(new Error('cache not ready')) }, resources: noResources });

		expect(await load.execute()).toEqual({ kind: 'unreadable' });
	});
});

describe('LoadLibrary: the archive (M8 S3)', () => {
	it('lists the resources of the archive with the books, read again on every call', async () => {
		let resources = [aResource({ title: 'A' })];
		const load = new LoadLibrary({ books: { list: () => Promise.resolve([]) }, resources: { list: () => Promise.resolve(resources) } });
		expect(await load.execute()).toEqual({ kind: 'loaded', books: [], resources });

		resources = [...resources, aResource({ title: 'B', path: 'b.md' })];
		expect(await load.execute()).toEqual({ kind: 'loaded', books: [], resources });
	});

	it('says the library is unreadable when the resources cannot be read', async () => {
		const load = new LoadLibrary({ books: { list: () => Promise.resolve([aBook()]) }, resources: { list: () => Promise.reject(new Error('cache not ready')) } });

		expect(await load.execute()).toEqual({ kind: 'unreadable' });
	});
});
