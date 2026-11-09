import { describe, expect, it } from 'vitest';
import type { Book } from '../../../src/domain/library/Book';
import { groupByShelf } from '../../../src/domain/library/shelves';
import { aBook } from '../../fakes/books';

function book(title: string, shelf: string | null, path = `03 - Areas/Bibliotheke/${title}.md`): Book {
	return aBook({ title, shelf, path });
}

const titles = (books: readonly Book[]): string[] => books.map((entry) => entry.title);

describe('groupByShelf: the shelves of the library (S1, Q025)', () => {
	it('puts each book on its shelf, with its count', () => {
		const shelves = groupByShelf([book('Klara y el Sol', 'Ficción'), book('Mero cristianismo', 'Teología'), book('Ensayo sobre la ceguera', 'Ficción')]);

		expect(shelves.map((shelf) => [shelf.name, shelf.count, titles(shelf.books)])).toEqual([
			['Ficción', 2, ['Ensayo sobre la ceguera', 'Klara y el Sol']],
			['Teología', 1, ['Mero cristianismo']],
		]);
	});

	it('a book without a shelf goes to the no-shelf group, last', () => {
		const shelves = groupByShelf([book('Sin casa', null), book('Mero cristianismo', 'Teología'), book('Klara y el Sol', 'Ficción')]);

		expect(shelves.map((shelf) => shelf.name)).toEqual(['Ficción', 'Teología', null]);
		expect(titles(shelves[2]?.books ?? [])).toEqual(['Sin casa']);
		expect(shelves[2]?.count).toBe(1);
	});

	it('shelves that differ only in case are one shelf (Q025)', () => {
		const shelves = groupByShelf([book('Mero cristianismo', 'teología'), book('Confesiones', 'Teología')]);

		expect(shelves).toHaveLength(1);
		expect(shelves[0]?.count).toBe(2);
		expect(titles(shelves[0]?.books ?? [])).toEqual(['Confesiones', 'Mero cristianismo']);
	});

	it('names a shelf with the spelling of its first book in title order, whatever the input order', () => {
		const lower = book('Mero cristianismo', 'teología');
		const upper = book('Confesiones', 'Teología');

		expect(groupByShelf([lower, upper])[0]?.name).toBe('Teología');
		expect(groupByShelf([upper, lower])[0]?.name).toBe('Teología');
	});

	it('sorts shelves alphabetically in Spanish', () => {
		const shelves = groupByShelf([book('B', 'Zoología'), book('C', 'Ñandúes'), book('D', 'Arte'), book('E', 'Nadar'), book('F', 'Ética')]);

		expect(shelves.map((shelf) => shelf.name)).toEqual(['Arte', 'Ética', 'Nadar', 'Ñandúes', 'Zoología']);
	});

	it('breaks a tie between equal titles by path, so the order never depends on the vault', () => {
		const first = book('Biblia', 'Teología', 'a/Biblia.md');
		const second = book('Biblia', 'Teología', 'b/Biblia.md');

		expect(groupByShelf([second, first])[0]?.books.map((entry) => entry.path)).toEqual(['a/Biblia.md', 'b/Biblia.md']);
	});

	it('has no groups for no books, and no empty no-shelf group', () => {
		expect(groupByShelf([])).toEqual([]);
		expect(groupByShelf([book('Klara y el Sol', 'Ficción')]).map((shelf) => shelf.name)).toEqual(['Ficción']);
	});
});
