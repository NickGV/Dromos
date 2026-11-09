import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Book } from '../../../src/domain';
import { createTranslator } from '../../../src/i18n';
import { AlcoveButton } from '../../../src/ui/molecules/AlcoveButton';
import { DeskScroll } from '../../../src/ui/molecules/DeskScroll';
import { ShelfScrollButton } from '../../../src/ui/molecules/ShelfScrollButton';
import { BookCard, type BookCardBusy } from '../../../src/ui/organisms/BookCard';
import { LibraryRoom } from '../../../src/ui/organisms/LibraryRoom';
import { LibraryShelf } from '../../../src/ui/organisms/LibraryShelf';
import { bookCardView, type BookCardActions } from '../../../src/ui/presenters/bookCardView';
import { libraryRoomView, libraryShelfView, shelfId } from '../../../src/ui/presenters/libraryView';
import { aBook, aReflection } from '../../fakes/books';
import { clickOf } from './elements';
import { noop } from './homeDeps';

const en = createTranslator('en');
const es = createTranslator('es');
const TODAY = '2026-11-09';
const FULL = aReflection(['about', 'kept', 'changes', 'connects']);

const book = (title: string, overrides: Partial<Book> = {}): Book => aBook({ path: `Bibliotheke/${title}.md`, title, author: null, ...overrides });

const LIBRARY: readonly Book[] = [
	book('Mero cristianismo', { author: 'C. S. Lewis', shelf: 'Teología', status: 'active', started: '2026-10-28' }),
	book('El costo del discipulado', { author: 'Dietrich Bonhoeffer', shelf: 'Teología' }),
	book('El conocimiento del Dios santo', { author: 'A. W. Tozer', shelf: 'Teología', status: 'completed', reflection: FULL }),
	book('Confesiones', { shelf: 'Teología', status: 'paused' }),
	book('Programación pragmática', { shelf: 'Programación', status: 'completed' }),
	book('Hábitos atómicos', { author: 'James Clear' }),
	book('Un libro guardado', { shelf: 'Historia', status: 'archived' }),
];

const room = (books: readonly Book[] = LIBRARY, t = es) => renderToStaticMarkup(<LibraryRoom view={libraryRoomView(books, TODAY, t)} onOpenShelf={noop} onOpenCard={noop} />);
const shelf = (name: string | null, t = es) => {
	const view = libraryShelfView(LIBRARY, shelfId(name), TODAY, t);
	if (!view) throw new Error(`no shelf ${String(name)}`);
	return renderToStaticMarkup(<LibraryShelf view={view} onOpenCard={noop} />);
};
const card = (entry: Book, actions: BookCardActions = { start: true, finish: true }, busy: BookCardBusy = null, t = es) =>
	renderToStaticMarkup(<BookCard view={bookCardView(entry, TODAY, t, actions)} busy={busy} onStart={noop} onFinish={noop} onOpenNote={noop} />);

/** The visible text of every `<button>`, tags stripped. */
const buttonTexts = (html: string): string[] => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((match) => (match[1] ?? '').replace(/<[^>]+>/g, '').trim());
/** The accessible name of every `<button>` that has an aria-label. */
const buttonNames = (html: string): string[] => [...html.matchAll(/<button[^>]*aria-label="([^"]*)"/g)].map((match) => match[1] ?? '');
/** The `data-layer` of each layer of the scene `scene`, in document order. */
const layersOf = (html: string, scene: string): string[] => {
	const start = html.indexOf(`data-scene="${scene}"`);
	if (start < 0) return [];
	return [...html.slice(start).matchAll(/data-layer="(\w+)"/g)].slice(0, 3).map((match) => match[1] ?? '');
};

describe('LibraryRoom: the reading room (M7 S5)', () => {
	it('opens with the summary line, paused books counted at its end', () => {
		expect(room()).toMatch(/<p class="dromos-library-summary">1 leyendo · 2 pendientes · 2 terminados · 1 en pausa<\/p>/);
	});

	it('neither shows nor counts an archived book', () => {
		const html = room();
		expect(html).not.toContain('Un libro guardado');
		expect(html).not.toContain('Historia');
	});

	it('draws one alcove per shelf as one button, its name and its count on their own lines', () => {
		const html = room();

		expect(buttonNames(html).filter((name) => name.startsWith('Abrir el estante'))).toEqual(['Abrir el estante Programación, 1 libro', 'Abrir el estante Teología, 4 libros', 'Abrir el estante Sin estante, 1 libro']);
		expect(html).toMatch(/<span class="dromos-alcove-name">Teología<\/span><span class="dromos-alcove-count">4 libros<\/span>/);
		expect(html.match(/class="dromos-alcove-art is-capsa"/g)).toHaveLength(1);
	});

	it('lays the books being read on the desk, each one button that opens its card', () => {
		const html = room();

		expect(html).toMatch(/<h3[^>]*>Leyendo ahora<\/h3>/);
		expect(buttonNames(html).filter((name) => name.startsWith('Abrir la ficha'))).toEqual(['Abrir la ficha de Mero cristianismo']);
		expect(html).toContain('Leyendo desde hace 12 días');
		expect(html).not.toContain('Confesiones');
	});

	it('leaves the desk bare with its line when nothing is being read', () => {
		const html = room([book('A', { shelf: 'Teología' })]);

		expect(html).toContain('No estás leyendo ningún libro. Elige uno de un estante.');
		expect(buttonNames(html).filter((name) => name.startsWith('Abrir la ficha'))).toEqual([]);
	});

	it('says the library is empty, with no summary and no alcove to open', () => {
		for (const books of [[], [book('Viejo', { status: 'archived' })]]) {
			const html = room(books);
			expect(html).toContain('La biblioteca está vacía. Pídele a Esdras que agregue los libros que quieres leer.');
			expect(html).not.toContain('dromos-library-summary');
			expect(html).not.toContain('<button');
		}
		expect(room([], en)).toContain('The library is empty. Ask Esdras to add the books you want to read.');
	});

	it('builds the wall and the desk in layers, background, drawing and panels, the first two hidden from screen readers (M7 S6)', () => {
		const html = room();

		for (const scene of ['wall', 'desk']) expect(layersOf(html, scene)).toEqual(['background', 'drawing', 'panels']);
		expect(html).toMatch(/data-layer="background" aria-hidden="true"/);
		expect(html).toMatch(/data-layer="drawing" aria-hidden="true"/);
	});

	it('takes every color of its drawings from a token, so the night can repaint them', () => {
		expect(room()).not.toMatch(/(fill|stroke|stop-color)="#/);
		expect(room()).toContain('dromos-library-lamp');
	});
});

describe('AlcoveButton and DeskScroll', () => {
	it('open their shelf and their card', () => {
		const opened: string[] = [];
		const view = libraryRoomView(LIBRARY, TODAY, es);
		const [alcove] = view.alcoves;
		const [scroll] = view.desk.scrolls;
		if (!alcove || !scroll) throw new Error('missing view');

		clickOf(AlcoveButton({ view: alcove, onOpen: (id) => opened.push(`shelf:${id}`) }))();
		clickOf(DeskScroll({ view: scroll, onOpen: (path) => opened.push(`card:${path}`) }))();

		expect(opened).toEqual(['shelf:programación', 'card:Bibliotheke/Mero cristianismo.md']);
	});
});

describe('LibraryShelf: one shelf (M7 S5)', () => {
	it('shows its books in rows, reading first with paused ones labeled, and hides an empty row', () => {
		const html = shelf('Teología');

		expect([...html.matchAll(/<h3[^>]*>(.*?)<\/h3>/g)].map((match) => match[1])).toEqual(['Leyendo · 2', 'Pendientes · 1', 'Terminados · 1']);
		expect([...shelf('Programación').matchAll(/<h3[^>]*>(.*?)<\/h3>/g)].map((match) => match[1])).toEqual(['Terminados · 1']);
	});

	it('makes each scroll one button named after its book, with a hanging tag and its state in words', () => {
		const html = shelf('Teología');

		expect(buttonNames(html)).toEqual(['Abrir la ficha de Mero cristianismo', 'Abrir la ficha de Confesiones', 'Abrir la ficha de El costo del discipulado', 'Abrir la ficha de El conocimiento del Dios santo']);
		expect(html).toMatch(/<span class="dromos-sillybos"><span class="dromos-sillybos-title">Mero cristianismo<\/span><span class="dromos-sillybos-author">C. S. Lewis<\/span><\/span>/);
		expect(html).toMatch(/<span class="dromos-shelf-scroll-state">Leyendo<\/span><span class="dromos-shelf-scroll-note">En la mesa de lectura<\/span>/);
		expect(html).toContain('<span class="dromos-shelf-scroll-state">En pausa</span>');
		expect(shelf('Programación')).toContain('<span class="dromos-shelf-scroll-state">Falta la reflexión</span>');
	});

	it('draws each state as its own scroll, the text always beside it', () => {
		const html = shelf('Teología');

		for (const state of ['reading', 'paused', 'pending', 'sealed']) expect(html).toContain(`dromos-scroll-art is-${state}`);
		expect(shelf('Programación')).toContain('dromos-scroll-art is-reflection-missing');
	});

	it('builds the shelf in layers too (M7 S6)', () => {
		expect(layersOf(shelf('Teología'), 'shelf')).toEqual(['background', 'drawing', 'panels']);
	});

	it('opens a card from a scroll', () => {
		const opened: string[] = [];
		const scroll = libraryShelfView(LIBRARY, shelfId('Teología'), TODAY, es)?.rows[0]?.scrolls[0];
		if (!scroll) throw new Error('missing scroll');

		clickOf(ShelfScrollButton({ view: scroll, onOpen: (path) => opened.push(path) }))();

		expect(opened).toEqual(['Bibliotheke/Mero cristianismo.md']);
	});
});

describe('BookCard: the card in the modal (M7 S5)', () => {
	const mere = (overrides: Partial<Book> = {}) => book('Mero cristianismo', { author: 'C. S. Lewis', shelf: 'Teología', status: 'active', started: '2026-10-28', reflection: aReflection(['about', 'kept']), ...overrides });

	it('unrolls the scroll between its rods: title, byline, state, dates and the four sections with whether each is written', () => {
		const html = card(mere());

		expect(html).toMatch(/<h2 class="dromos-book-card-title">Mero cristianismo<\/h2>/);
		expect(html).toContain('C. S. Lewis · Teología');
		expect(html).toContain('Empezado el 28 de octubre · Leyendo desde hace 12 días');
		expect(html.match(/class="dromos-umbilicus/g)).toHaveLength(2);
		expect([...html.matchAll(/<h3 class="dromos-book-section-heading">(.*?)<\/h3><p class="dromos-book-section-status[^"]*">(.*?)<\/p>/g)].map((match) => [match[1], match[2]])).toEqual([
			['De qué trata', 'Escrita'],
			['Qué me quedó', 'Escrita'],
			['Qué cambia en mí', 'Sin escribir todavía'],
			['Con qué lo conecto', 'Sin escribir todavía'],
		]);
	});

	it('offers "Empezar a leer" on a pending book, its muted line describing the button', () => {
		const html = card(mere({ status: 'planning', started: null }));

		expect(buttonTexts(html)).toEqual(['Empezar a leer', 'Abrir la nota']);
		expect(html).toMatch(/<button type="button" class="dromos-btn is-primary" aria-describedby="([^"]+)">Empezar a leer<\/button><p class="dromos-book-card-hint" id="\1">Crea la tarea de lectura en Habitica<\/p>/);
	});

	it('offers "Terminar" on a book being read', () => {
		expect(buttonTexts(card(mere()))).toEqual(['Terminar', 'Abrir la nota']);
	});

	it('shows no state button when the actions are not wired', () => {
		expect(buttonTexts(card(mere(), { start: false, finish: false }))).toEqual(['Abrir la nota']);
		expect(buttonTexts(card(mere({ status: 'planning' }), { start: false, finish: false }))).toEqual(['Abrir la nota']);
	});

	it('offers only the note on a sealed book, and draws the clay seal with its words', () => {
		const html = card(mere({ status: 'completed', reflection: FULL }));

		expect(buttonTexts(html)).toEqual(['Abrir la nota']);
		expect(html).toMatch(/<span class="dromos-seal dromos-book-seal is-sealed" aria-hidden="true">/);
		expect(html).toContain('<p class="dromos-book-seal-text">Sellado con su reflexión</p>');
	});

	it('leaves the seal an empty outline: "Falta la reflexión" on a finished book, which makes the note the primary button', () => {
		const html = card(mere({ status: 'completed' }));

		expect(html).toMatch(/<span class="dromos-book-seal is-empty" aria-hidden="true"><\/span><p class="dromos-book-seal-text">Falta la reflexión<\/p>/);
		expect(html).toMatch(/<button type="button" class="dromos-btn is-primary">Abrir la nota<\/button>/);
	});

	it('says when an unfinished book is sealed', () => {
		expect(card(mere())).toContain('<p class="dromos-book-seal-text">Se sella al terminar, con las cuatro partes escritas</p>');
	});

	it('keeps a busy button focusable, says what it is doing, and lets no other state action start', () => {
		const html = card(mere({ status: 'planning' }), { start: true, finish: true }, 'start');

		expect(html).toMatch(/<button type="button" class="dromos-btn is-primary" aria-describedby="[^"]+" aria-disabled="true">Empezando…<\/button>/);
		expect(html).not.toMatch(/<button[^>]*disabled=""/);
	});

	it('adds no close button of its own: Obsidian\'s modal has one, and Escape', () => {
		expect(card(mere())).not.toContain('×');
		expect(buttonTexts(card(mere())).length).toBe(2);
	});

	it('builds the card in layers (M7 S6)', () => {
		expect(layersOf(card(mere()), 'card')).toEqual(['background', 'drawing', 'panels']);
	});

	it('speaks English', () => {
		const html = card(mere({ status: 'planning', started: null }), { start: true, finish: true }, null, en);
		expect(buttonTexts(html)).toEqual(['Start reading', 'Open the note']);
		expect(html).toContain('Creates the reading to-do in Habitica');
	});
});
