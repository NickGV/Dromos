import { describe, expect, it } from 'vitest';
import type { FinishReadingOutcome, StartReadingOutcome } from '../../src/application';
import { createTranslator } from '../../src/i18n';
import { readingOutcomeView, readingTodo } from '../../src/ui/presenters/readingView';

const ID = '3f2a1c8e-0000-4000-8000-000000000001';
const book = { title: 'Klara y el Sol', path: '03 - Areas/Bibliotheke/Klara y el Sol - Kazuo Ishiguro.md' };
const link = (path: string) => `obsidian://open?vault=Logos&file=${encodeURIComponent(path)}`;

describe('readingTodo: the to-do "Empezar a leer" creates (M7 S3)', () => {
	it('is titled after the book and links its note', () => {
		const todo = readingTodo(book, createTranslator('es'), link);

		expect(todo.title).toBe('Leer: Klara y el Sol');
		expect(todo.notes).toBe(`Dromos · Klara y el Sol\n${link(book.path)}`);
	});

	it('carries "Terminar de leer" and then the four parts of the reflection, in the note\'s order', () => {
		expect(readingTodo(book, createTranslator('es'), link).checklist).toEqual([
			'Terminar de leer',
			'De qué trata',
			'Qué me quedó',
			'Qué cambia en mí',
			'Con qué lo conecto',
		]);
	});

	it('follows the language of the settings', () => {
		const todo = readingTodo(book, createTranslator('en'), link);

		expect(todo.title).toBe('Read: Klara y el Sol');
		expect(todo.checklist).toHaveLength(5);
		expect(todo.checklist[0]).toBe('Finish reading');
	});
});

describe('readingOutcomeView: the toast after "Empezar a leer" and "Terminar"', () => {
	const t = createTranslator('es');

	it('confirms a start and a finish', () => {
		expect(readingOutcomeView({ kind: 'started', habiticaId: ID }, t)).toEqual({ tone: 'success', message: 'Empezaste a leer. La tarea de lectura está en Habitica.' });
		expect(readingOutcomeView({ kind: 'finished' }, t)).toEqual({ tone: 'success', message: 'Libro terminado.' });
	});

	it('says when the book changed under the button', () => {
		expect(readingOutcomeView({ kind: 'not-found' }, t)).toEqual({ tone: 'warning', message: 'No se encontró la nota del libro.' });
		expect(readingOutcomeView({ kind: 'not-pending' }, t)).toEqual({ tone: 'neutral', message: 'Ese libro ya no está pendiente.' });
		expect(readingOutcomeView({ kind: 'not-reading' }, t)).toEqual({ tone: 'neutral', message: 'Ese libro no se está leyendo.' });
	});

	it('explains a Habitica failure with the same words as "Enviar a Habitica"', () => {
		const outcome: StartReadingOutcome = { kind: 'habitica-failed', error: 'Offline' };
		expect(readingOutcomeView(outcome, t)).toEqual({ tone: 'warning', message: 'Sin conexión: no se pudo enviar la tarea.' });
		expect(readingOutcomeView({ kind: 'habitica-failed', error: 'Unauthorized' }, t).tone).toBe('error');
	});

	it('keeps the id of a to-do that was created but not saved, so nothing is lost', () => {
		expect(readingOutcomeView({ kind: 'write-failed', habiticaId: ID }, t)).toEqual({
			tone: 'error',
			message: `La tarea de lectura se creó en Habitica, pero no se pudo guardar en la nota. Id: ${ID}`,
		});
		expect(readingOutcomeView({ kind: 'duplicate', habiticaId: ID }, t)).toEqual({
			tone: 'warning',
			message: `El libro ya tenía su tarea de lectura, así que se creó otra en Habitica. Bórrala allí. Id: ${ID}`,
		});
	});

	it('says a finish that could not be saved', () => {
		const outcome: FinishReadingOutcome = { kind: 'write-failed' };
		expect(readingOutcomeView(outcome, t)).toEqual({ tone: 'error', message: 'No se pudo guardar en la nota. Inténtalo de nuevo.' });
	});

	it('has every message in English too', () => {
		const en = createTranslator('en');
		const outcomes: (StartReadingOutcome | FinishReadingOutcome)[] = [
			{ kind: 'started', habiticaId: ID },
			{ kind: 'finished' },
			{ kind: 'not-found' },
			{ kind: 'not-pending' },
			{ kind: 'not-reading' },
			{ kind: 'write-failed', habiticaId: ID },
			{ kind: 'duplicate', habiticaId: ID },
			{ kind: 'write-failed' },
		];
		for (const outcome of outcomes) expect(readingOutcomeView(outcome, en).message).not.toMatch(/library\.|á|é|í|ó|ñ/);
	});
});
