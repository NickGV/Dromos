import { describe, expect, it } from 'vitest';
import { LoadLibrary } from '../../src/application';
import { aBook } from '../fakes/books';

describe('LoadLibrary (M7 S5)', () => {
	it('lists the books the repository reads, archived ones included: the screen decides what it shows', async () => {
		const books = [aBook({ title: 'A' }), aBook({ title: 'B', status: 'archived' })];
		const load = new LoadLibrary({ books: { list: () => Promise.resolve(books) } });

		expect(await load.execute()).toEqual({ kind: 'loaded', books });
	});

	it('reads the vault again on every call, so a book added since shows', async () => {
		let books = [aBook({ title: 'A' })];
		const load = new LoadLibrary({ books: { list: () => Promise.resolve(books) } });
		await load.execute();
		books = [...books, aBook({ title: 'B' })];

		expect(await load.execute()).toEqual({ kind: 'loaded', books });
	});

	it('says the library is unreadable instead of rejecting when the books cannot be read', async () => {
		const load = new LoadLibrary({ books: { list: () => Promise.reject(new Error('cache not ready')) } });

		expect(await load.execute()).toEqual({ kind: 'unreadable' });
	});
});
