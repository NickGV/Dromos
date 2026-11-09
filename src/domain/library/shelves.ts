import { compareBooks, type Book } from './Book';

/** One shelf of the library: its books and how many. `name` is `null` for books with no shelf. */
export interface Shelf {
	readonly name: string | null;
	readonly books: readonly Book[];
	readonly count: number;
}

/**
 * The books grouped by shelf (Q025). Shelves match without regard to case, and a shelf is
 * named as its first book (in title order) writes it. Shelves are sorted alphabetically in
 * Spanish, with the no-shelf group last; books keep `compareBooks` order inside a shelf.
 */
export function groupByShelf(books: readonly Book[]): Shelf[] {
	const groups = new Map<string | null, Book[]>();
	for (const book of [...books].sort(compareBooks)) {
		const key = book.shelf === null ? null : shelfKey(book.shelf);
		const group = groups.get(key);
		if (group) group.push(book);
		else groups.set(key, [book]);
	}

	return [...groups.values()]
		.map((group): Shelf => ({ name: group[0]?.shelf ?? null, books: group, count: group.length }))
		.sort(byShelfName);
}

/** Case-insensitive key; NFC so an accent typed as two characters still lands on the same shelf. */
function shelfKey(shelf: string): string {
	return shelf.normalize('NFC').toLowerCase();
}

function byShelfName(left: Shelf, right: Shelf): number {
	if (left.name === null) return right.name === null ? 0 : 1;
	if (right.name === null) return -1;
	return left.name.localeCompare(right.name, 'es');
}
