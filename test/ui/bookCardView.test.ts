import { describe, expect, it } from 'vitest';
import type { Book } from '../../src/domain';
import { createTranslator } from '../../src/i18n';
import type { ReflectionText } from '../../src/ports';
import { bookCardView, type BookCardActions } from '../../src/ui/presenters/bookCardView';
import { aBook, aReflection } from '../fakes/books';

const en = createTranslator('en');
const es = createTranslator('es');
const TODAY = '2026-11-09';
const FULL = aReflection(['about', 'kept', 'changes', 'connects']);
const BOTH: BookCardActions = { start: true, finish: true };
const NONE: BookCardActions = { start: false, finish: false };

const mere = (overrides: Partial<Book> = {}): Book =>
	aBook({ path: 'Bibliotheke/Mero cristianismo.md', title: 'Mero cristianismo', author: 'C. S. Lewis', shelf: 'Teología', status: 'active', started: '2026-10-28', reflection: aReflection(['about', 'kept']), ...overrides });

describe('bookCardView: the book card (M7 S5)', () => {
	it('shows a book being read: its byline, state, dates and the four sections with whether each is written', () => {
		const card = bookCardView(mere(), TODAY, es, BOTH);

		expect(card).toMatchObject({ path: 'Bibliotheke/Mero cristianismo.md', title: 'Mero cristianismo', byline: 'C. S. Lewis · Teología', state: 'reading', stateLabel: 'Leyendo', ariaLabel: 'Ficha de Mero cristianismo' });
		expect(card.dates).toBe('Empezado el 28 de octubre · Leyendo desde hace 12 días');
		expect(card.sections.map((section) => [section.id, section.heading, section.written, section.status])).toEqual([
			['about', 'De qué trata', true, 'Escrita'],
			['kept', 'Qué me quedó', true, 'Escrita'],
			['changes', 'Qué cambia en mí', false, 'Sin escribir todavía'],
			['connects', 'Con qué lo conecto', false, 'Sin escribir todavía'],
		]);
	});

	it('speaks English too', () => {
		const card = bookCardView(mere(), TODAY, en, BOTH);

		expect(card.dates).toBe('Started on October 28 · Reading for 12 days');
		expect(card.sections.map((section) => [section.heading, section.status])).toEqual([
			['What it is about', 'Written'],
			['What stayed with me', 'Written'],
			['What changes in me', 'Not written yet'],
			['What I connect it to', 'Not written yet'],
		]);
		expect(card.seal.text).toBe('Sealed once finished, with all four parts written');
	});

	it('offers "Terminar" for a book being read, and "Abrir la nota" as the plain button', () => {
		const { actions } = bookCardView(mere(), TODAY, es, BOTH);

		expect(actions.start).toBeNull();
		expect(actions.finish).toEqual({ label: 'Terminar', busyLabel: 'Terminando…' });
		expect(actions.openNote).toEqual({ label: 'Abrir la nota', primary: false });
	});

	it('offers "Empezar a leer" for a pending book, with the line that says it creates the to-do', () => {
		const { actions } = bookCardView(mere({ status: 'planning', started: null }), TODAY, es, BOTH);

		expect(actions.start).toEqual({ label: 'Empezar a leer', hint: 'Crea la tarea de lectura en Habitica', busyLabel: 'Empezando…' });
		expect(actions.finish).toBeNull();
		expect(actions.openNote.primary).toBe(false);
		expect(bookCardView(mere({ status: 'planning' }), TODAY, en, BOTH).actions.start).toEqual({ label: 'Start reading', hint: 'Creates the reading to-do in Habitica', busyLabel: 'Starting…' });
	});

	it('shows no state button when the actions are not wired, only "Abrir la nota"', () => {
		for (const status of ['planning', 'active'] as const) {
			const { actions } = bookCardView(mere({ status }), TODAY, es, NONE);
			expect([actions.start, actions.finish, actions.openNote]).toEqual([null, null, { label: 'Abrir la nota', primary: false }]);
		}
		expect(bookCardView(mere({ status: 'planning' }), TODAY, es, { start: false, finish: true }).actions.start).toBeNull();
		expect(bookCardView(mere(), TODAY, es, { start: true, finish: false }).actions.finish).toBeNull();
	});

	it('seals a finished book with its whole reflection, and offers only the note', () => {
		const card = bookCardView(mere({ status: 'completed', finished: '2026-11-03', reflection: FULL }), TODAY, es, BOTH);

		expect(card.state).toBe('sealed');
		expect(card.stateLabel).toBe('Terminado');
		expect(card.seal).toEqual({ sealed: true, text: 'Sellado con su reflexión' });
		expect(card.dates).toBe('Empezado el 28 de octubre · Terminado el 3 de noviembre');
		expect([card.actions.start, card.actions.finish, card.actions.openNote]).toEqual([null, null, { label: 'Abrir la nota', primary: false }]);
	});

	it('leaves a finished book without its whole reflection unsealed, and makes "Abrir la nota" the primary button', () => {
		const card = bookCardView(mere({ status: 'completed', started: null, finished: null }), TODAY, es, BOTH);

		expect(card.state).toBe('reflection-missing');
		expect(card.stateLabel).toBe('Falta la reflexión');
		expect(card.seal).toEqual({ sealed: false, text: 'Falta la reflexión' });
		expect(card.dates).toBeNull();
		expect(card.actions.openNote).toEqual({ label: 'Abrir la nota', primary: true });
		expect(bookCardView(mere({ status: 'completed' }), TODAY, en, BOTH).seal.text).toBe('Reflection missing');
	});

	it('says when an unfinished book will be sealed', () => {
		for (const status of ['planning', 'active', 'paused'] as const) {
			expect(bookCardView(mere({ status, reflection: FULL }), TODAY, es, BOTH).seal).toEqual({ sealed: false, text: 'Se sella al terminar, con las cuatro partes escritas' });
		}
	});

	it('shows a paused book with its start date and no state button', () => {
		const card = bookCardView(mere({ status: 'paused' }), TODAY, es, BOTH);

		expect(card.stateLabel).toBe('En pausa');
		expect(card.dates).toBe('Empezado el 28 de octubre');
		expect([card.actions.start, card.actions.finish]).toEqual([null, null]);
	});

	it('dates a finished book alone, with the year when it is not this one', () => {
		expect(bookCardView(mere({ status: 'completed', started: null, finished: '2026-10-03' }), TODAY, es, BOTH).dates).toBe('Terminado el 3 de octubre');
		expect(bookCardView(mere({ status: 'completed', started: null, finished: '2025-10-03' }), TODAY, es, BOTH).dates).toBe('Terminado el 3 de octubre de 2025');
		expect(bookCardView(mere({ status: 'completed', started: null, finished: '2025-10-03' }), TODAY, en, BOTH).dates).toBe('Finished on October 3, 2025');
	});

	it('gives a book being read without a start date no dates line, and a pending book none either', () => {
		expect(bookCardView(mere({ started: null }), TODAY, es, BOTH).dates).toBeNull();
		expect(bookCardView(mere({ status: 'planning', started: null }), TODAY, es, BOTH).dates).toBeNull();
	});

	it('names the shelf alone without an author, and "Sin estante" without a shelf', () => {
		expect(bookCardView(mere({ author: null }), TODAY, es, BOTH).byline).toBe('Teología');
		expect(bookCardView(mere({ shelf: null }), TODAY, es, BOTH).byline).toBe('C. S. Lewis · Sin estante');
		expect(bookCardView(mere({ shelf: null }), TODAY, en, BOTH).byline).toBe('C. S. Lewis · No shelf');
	});
});

describe('bookCardView: the text of each part of the reflection (M7 S5, S2)', () => {
	/** What the note holds: text in every part, even the two the cache does not count as written. */
	const TEXT: ReflectionText = { about: 'Un caso para *creer*.', kept: '### Cita\n\n> [[Aslan]]', changes: '%% luego %%', connects: '- [[Narnia]]' };
	const parts = (reflection?: ReflectionText | null) =>
		bookCardView(mere(), TODAY, es, BOTH, reflection).sections.map((section) => [section.id, section.written, section.text, section.status]);

	it('shows the markdown of each written part once the text arrives', () => {
		expect(parts(TEXT).slice(0, 2)).toEqual([
			['about', true, 'Un caso para *creer*.', 'Escrita'],
			['kept', true, '### Cita\n\n> [[Aslan]]', 'Escrita'],
		]);
	});

	it('keeps "Sin escribir todavía" for a part the cache does not count, whatever the note holds there', () => {
		expect(parts(TEXT).slice(2)).toEqual([
			['changes', false, null, 'Sin escribir todavía'],
			['connects', false, null, 'Sin escribir todavía'],
		]);
	});

	it('shows the "Escrita" label for a written part while the text loads, and when it could not be read', () => {
		for (const reflection of [undefined, null]) {
			expect(parts(reflection)).toEqual([
				['about', true, null, 'Escrita'],
				['kept', true, null, 'Escrita'],
				['changes', false, null, 'Sin escribir todavía'],
				['connects', false, null, 'Sin escribir todavía'],
			]);
		}
	});

	it('shows the label for a written part whose text came back empty: the note changed between the two reads', () => {
		expect(parts({ ...TEXT, about: '' })[0]).toEqual(['about', true, null, 'Escrita']);
	});

	it('keeps the seal and the state from the cache, whatever the text says', () => {
		const sealed = bookCardView(mere({ status: 'completed', reflection: FULL }), TODAY, es, BOTH, { about: '', kept: '', changes: '', connects: '' });
		const missing = bookCardView(mere({ status: 'completed' }), TODAY, es, BOTH, { about: 'a', kept: 'b', changes: 'c', connects: 'd' });

		expect([sealed.state, sealed.seal.sealed]).toEqual(['sealed', true]);
		expect([missing.state, missing.seal.sealed]).toEqual(['reflection-missing', false]);
	});
});
