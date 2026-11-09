import { describe, expect, it } from 'vitest';
import { bookFromNote, buildBooks, isBookNote, reflectionFrom, type BookNote } from '../../../src/adapters/vault/bookMapper';
import { block, heading, metadataOf, templateMetadata, writtenMetadata, type NoteMetadata } from '../../fakes/noteMetadata';

const KLARA_PATH = '03 - Areas/Bibliotheke/Klara y el Sol - Kazuo Ishiguro.md';

function note(frontmatter: unknown, metadata: NoteMetadata = templateMetadata(), path = KLARA_PATH): BookNote {
	return { path, frontmatter, ...metadata };
}

const written = (metadata: NoteMetadata): boolean[] => reflectionFrom(metadata.headings, metadata.sections).map((section) => section.written);

describe('isBookNote: a book is any `type: book` note (S1)', () => {
	it('is a book whatever its folder', () => {
		expect(isBookNote(note({ type: 'book' }))).toBe(true);
		expect(isBookNote(note({ type: 'book' }, templateMetadata(), 'Inbox/Un libro.md'))).toBe(true);
	});

	it.each([{ type: 'resource' }, { type: 'Book' }, {}, undefined, 'book'])('is not a book with frontmatter %j', (frontmatter) => {
		expect(isBookNote(note(frontmatter))).toBe(false);
	});

	it('is not a book inside the templates folder, where `Templates/book.md` says `type: book` (area habits F1)', () => {
		expect(isBookNote(note({ type: 'book', status: 'planning', title: '{{title}}' }, templateMetadata(), 'Templates/book.md'))).toBe(false);
		expect(isBookNote(note({ type: 'book' }, templateMetadata(), 'Templates/Libros/book.md'))).toBe(false);
	});

	it('is still a book in a folder that only starts like the templates folder, or holds one of its own', () => {
		expect(isBookNote(note({ type: 'book' }, templateMetadata(), 'Templates viejos/Un libro.md'))).toBe(true);
		expect(isBookNote(note({ type: 'book' }, templateMetadata(), '03 - Areas/Bibliotheke/Templates/Un libro.md'))).toBe(true);
	});
});

describe('bookFromNote: the fields of a book note (S1)', () => {
	it('reads every field Esdras and Dromos write', () => {
		const book = bookFromNote(
			note({
				type: 'book',
				title: 'Klara y el Sol',
				author: 'Kazuo Ishiguro',
				shelf: 'Ficción',
				status: 'completed',
				started: '2026-10-01',
				finished: '2026-11-05',
				habitica_id: ' 3f2a1c8e-0000-4000-8000-000000000001 ',
			}),
		);

		expect(book).toEqual({
			path: KLARA_PATH,
			title: 'Klara y el Sol',
			author: 'Kazuo Ishiguro',
			shelf: 'Ficción',
			status: 'completed',
			started: '2026-10-01',
			finished: '2026-11-05',
			habiticaId: '3f2a1c8e-0000-4000-8000-000000000001',
			reflection: [
				{ id: 'about', heading: 'De qué trata', written: false },
				{ id: 'kept', heading: 'Qué me quedó', written: false },
				{ id: 'changes', heading: 'Qué cambia en mí', written: false },
				{ id: 'connects', heading: 'Con qué lo conecto', written: false },
			],
		});
	});

	it('the note as the template leaves it: empty author and shelf read as none', () => {
		const book = bookFromNote(note({ type: 'book', title: 'Klara y el Sol', status: 'planning', author: '', shelf: '', tags: [] }));

		expect(book).toMatchObject({ author: null, shelf: null, status: 'planning', started: null, finished: null, habiticaId: null });
	});

	it('a book without a shelf has none, so it goes to "Sin estante"', () => {
		expect(bookFromNote(note({ type: 'book', status: 'planning' })).shelf).toBeNull();
	});

	it.each([['   '], [42], [['Teología']], [null]])('a shelf of %j reads as none', (shelf) => {
		expect(bookFromNote(note({ type: 'book', shelf })).shelf).toBeNull();
	});

	it('trims the shelf, the title and the author', () => {
		const book = bookFromNote(note({ type: 'book', shelf: '  Teología ', title: ' Confesiones ', author: ' Agustín ' }));

		expect(book).toMatchObject({ shelf: 'Teología', title: 'Confesiones', author: 'Agustín' });
	});

	it.each([[undefined], [''], ['  ']])('a title of %j falls back to the file name', (title) => {
		expect(bookFromNote(note({ type: 'book', title })).title).toBe('Klara y el Sol - Kazuo Ishiguro');
	});

	it.each([['reading'], ['done'], [''], [7], [undefined]])('a status of %j falls back to planning, so a broken book is never offered to finish', (status) => {
		expect(bookFromNote(note({ type: 'book', status })).status).toBe('planning');
	});

	it.each(['planning', 'active', 'paused', 'completed', 'archived'])('keeps a %s status', (status) => {
		expect(bookFromNote(note({ type: 'book', status })).status).toBe(status);
	});

	it('reads dates as YYYY-MM-DD, a Date as its local day, and anything else as none', () => {
		const book = bookFromNote(note({ type: 'book', started: new Date(2026, 9, 1), finished: '5 de noviembre' }));

		expect(book.started).toBe('2026-10-01');
		expect(book.finished).toBeNull();
	});

	it('a note with no frontmatter at all falls back to defaults, without throwing', () => {
		const book = bookFromNote({ path: KLARA_PATH, frontmatter: undefined, headings: [], sections: [] });

		expect(book).toMatchObject({ title: 'Klara y el Sol - Kazuo Ishiguro', author: null, shelf: null, status: 'planning', started: null, finished: null, habiticaId: null });
		expect(book.reflection.map((section) => section.written)).toEqual([false, false, false, false]);
	});
});

describe('reflectionFrom: which reflection sections have text, from the cache only (S2, U3)', () => {
	it('the template shape: the callout before the headings counts for no section, and all four are empty', () => {
		expect(written(templateMetadata())).toEqual([false, false, false, false]);
	});

	it('all four written', () => {
		expect(written(writtenMetadata())).toEqual([true, true, true, true]);
	});

	it('a heading followed directly by the next heading is not written', () => {
		const metadata = metadataOf(
			heading(2, 'De qué trata'),
			block('paragraph'),
			heading(2, 'Qué me quedó'),
			heading(2, 'Qué cambia en mí'),
			block('paragraph'),
			heading(2, 'Con qué lo conecto'),
			block('paragraph'),
		);

		expect(written(metadata)).toEqual([true, false, true, true]);
	});

	it('a sub-heading belongs to its section: a `### Cita` with a paragraph under `## Qué me quedó` makes that part written', () => {
		const metadata = metadataOf(heading(2, 'De qué trata'), block('paragraph'), heading(2, 'Qué me quedó'), heading(3, 'Cita'), block('paragraph'), heading(2, 'Qué cambia en mí'));

		expect(written(metadata)).toEqual([true, true, false, false]);
	});

	it('the next heading of the same level still ends the part', () => {
		const metadata = metadataOf(heading(2, 'Qué me quedó'), heading(2, 'Otra cosa'), block('paragraph'));

		expect(written(metadata)[1]).toBe(false);
	});

	it('a heading of a higher level ends the part too', () => {
		const metadata = metadataOf(heading(2, 'Con qué lo conecto'), heading(1, 'Apéndice'), block('paragraph'));

		expect(written(metadata)[3]).toBe(false);
	});

	it('the last section runs to the end of the note', () => {
		const metadata = metadataOf(heading(2, 'Con qué lo conecto'), block('list'));

		expect(written(metadata)[3]).toBe(true);
	});

	it('a missing heading is not written', () => {
		const metadata = metadataOf(heading(2, 'De qué trata'), block('paragraph'), heading(2, 'Qué me quedó'), block('paragraph'));

		expect(written(metadata)).toEqual([true, true, false, false]);
	});

	it('when a heading appears twice, the first one counts', () => {
		const metadata = metadataOf(heading(2, 'De qué trata'), heading(2, 'De qué trata'), block('paragraph'));

		expect(written(metadata)[0]).toBe(false);
	});

	it('matches the heading after trimming, at any level', () => {
		const metadata = metadataOf(heading(3, '  De qué trata  '), block('paragraph'), heading(1, 'Qué me quedó'), block('paragraph'));

		expect(written(metadata)).toEqual([true, true, false, false]);
	});

	it('matches the heading exactly: another spelling is a missing heading', () => {
		const metadata = metadataOf(heading(2, 'de qué trata'), block('paragraph'), heading(2, 'Que me quedo'), block('paragraph'));

		expect(written(metadata)).toEqual([false, false, false, false]);
	});

	it('matches an accent typed as two characters', () => {
		const metadata = metadataOf(heading(2, 'De qué trata'), block('paragraph'));

		expect(written(metadata)[0]).toBe(true);
	});

	it.each(['paragraph', 'list', 'blockquote', 'callout', 'table', 'code', 'math', 'html', 'element'])('a %s is content', (type) => {
		expect(written(metadataOf(heading(2, 'De qué trata'), block(type)))[0]).toBe(true);
	});

	it.each(['comment', 'thematicBreak', 'yaml'])('a %s alone is not content', (type) => {
		expect(written(metadataOf(heading(2, 'De qué trata'), block(type)))[0]).toBe(false);
	});

	it('a note with no headings or sections has nothing written', () => {
		expect(written({ headings: [], sections: [] })).toEqual([false, false, false, false]);
	});
});

describe('buildBooks: the books of a vault (S1)', () => {
	it('keeps only `type: book` notes, sorted by title then path', () => {
		const books = buildBooks([
			note({ type: 'book', title: 'Mero cristianismo' }, templateMetadata(), 'b.md'),
			note({ type: 'resource', title: 'The Green Mile' }, templateMetadata(), 'c.md'),
			note({ type: 'book', title: 'Confesiones' }, templateMetadata(), 'z.md'),
			note({ type: 'book', title: 'Confesiones' }, templateMetadata(), 'a.md'),
		]);

		expect(books.map((book) => [book.title, book.path])).toEqual([
			['Confesiones', 'a.md'],
			['Confesiones', 'z.md'],
			['Mero cristianismo', 'b.md'],
		]);
	});
});
