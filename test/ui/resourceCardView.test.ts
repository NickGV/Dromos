import { describe, expect, it } from 'vitest';
import type { MarkResourceFinishedOutcome } from '../../src/application';
import type { Resource } from '../../src/domain';
import { createTranslator } from '../../src/i18n';
import { resourceCardView, resourceOutcomeView } from '../../src/ui/presenters/resourceCardView';
import { aResource } from '../fakes/resources';

const en = createTranslator('en');
const es = createTranslator('es');
const TODAY = '2026-11-10';

const modules = (overrides: Partial<Resource> = {}): Resource => aResource({ path: '04 - Resources/Cómo pensar en módulos.md', ...overrides });

describe('resourceCardView: the resource card (M8 S6)', () => {
	it('shows a pending article: kind, state, title, source, the date it was saved and why', () => {
		const card = resourceCardView(modules(), TODAY, es, true);

		expect(card).toMatchObject({
			path: '04 - Resources/Cómo pensar en módulos.md',
			title: 'Cómo pensar en módulos',
			kind: 'post',
			kindLabel: 'Artículo',
			state: 'pending',
			stateLabel: 'Pendiente',
			source: 'Martin Fowler · martinfowler.com',
			dates: 'Guardado el 7 de noviembre',
			why: { heading: 'Para qué me sirve', text: 'entender los módulos' },
			ariaLabel: 'Ficha de Cómo pensar en módulos',
		});
		expect(card.takeaway).toEqual({ heading: 'Lo que me dejó', written: false, text: null, status: 'Sin escribir todavía' });
		expect(card.seal).toEqual({ sealed: false, text: 'Se sella al terminarlo, con lo que te dejó escrito' });
	});

	it('offers the link, "Marcar como leído" and the note on a pending resource', () => {
		expect(resourceCardView(modules(), TODAY, es, true).actions).toEqual({
			openLink: { href: 'https://martinfowler.com/articles/modules.html', label: 'Abrir el enlace' },
			mark: { label: 'Marcar como leído', busyLabel: 'Marcando…' },
			openNote: { label: 'Abrir la nota', primary: false },
		});
	});

	it('names the mark by the verb of the kind', () => {
		const mark = (kind: Resource['kind'], t = es) => resourceCardView(modules({ kind }), TODAY, t, true).actions.mark?.label;

		expect([mark('post'), mark('paper'), mark('tool'), mark(null)]).toEqual(Array(4).fill('Marcar como leído'));
		expect([mark('video'), mark('course')]).toEqual(['Marcar como visto', 'Marcar como visto']);
		expect(mark('podcast')).toBe('Marcar como escuchado');
		expect([mark('post', en), mark('video', en), mark('podcast', en)]).toEqual(['Mark as read', 'Mark as watched', 'Mark as listened to']);
	});

	it('shows no mark once the resource has `finished`, or when the action is not wired', () => {
		expect(resourceCardView(modules({ finished: '2026-11-09' }), TODAY, es, true).actions.mark).toBeNull();
		expect(resourceCardView(modules(), TODAY, es, false).actions.mark).toBeNull();
	});

	it('dates a finished resource by its verb, and makes the note the primary button while its takeaway is missing', () => {
		const card = resourceCardView(modules({ kind: 'podcast', saved: '2026-11-01', finished: '2026-11-09' }), TODAY, es, true);

		expect(card.dates).toBe('Guardado el 1 de noviembre · Escuchado el 9 de noviembre');
		expect(card.stateLabel).toBe('Escuchado · falta lo que te dejó');
		expect(card.actions.openNote).toEqual({ label: 'Abrir la nota', primary: true });
		expect(card.seal).toEqual({ sealed: false, text: 'Falta lo que te dejó' });
		expect(resourceCardView(modules({ kind: 'video', finished: '2026-11-10' }), TODAY, en, true).dates).toBe('Saved on November 7 · Watched on November 10');
		expect(resourceCardView(modules({ finished: '2026-11-08' }), TODAY, es, true).dates).toBe('Guardado el 7 de noviembre · Leído el 8 de noviembre');
	});

	it('seals a processed resource and shows what it left, read-only', () => {
		const card = resourceCardView(modules({ finished: '2026-11-08', takeawayWritten: true }), TODAY, es, true, 'Un módulo esconde *una decisión*.');

		expect(card.state).toBe('processed');
		expect(card.stateLabel).toBe('Procesado');
		expect(card.seal).toEqual({ sealed: true, text: 'Sellado con lo que te dejó' });
		expect(card.takeaway).toEqual({ heading: 'Lo que me dejó', written: true, text: 'Un módulo esconde *una decisión*.', status: 'Escrito' });
		expect(card.actions.openNote.primary).toBe(false);
	});

	it('says "Escrito" while the text of a written takeaway is on its way, and "Sin escribir todavía" for an empty one', () => {
		expect(resourceCardView(modules({ finished: '2026-11-08', takeawayWritten: true }), TODAY, es, true).takeaway).toEqual({ heading: 'Lo que me dejó', written: true, text: null, status: 'Escrito' });
		expect(resourceCardView(modules({ finished: '2026-11-08' }), TODAY, es, true, '').takeaway).toEqual({ heading: 'Lo que me dejó', written: false, text: null, status: 'Sin escribir todavía' });
	});

	it('keeps what the cache does not count as written out of the card, as the book card does', () => {
		expect(resourceCardView(modules(), TODAY, es, true, 'texto suelto').takeaway.text).toBeNull();
	});

	it('leaves out the link, why and the source when the note has none of them', () => {
		const card = resourceCardView(modules({ url: null, why: null, author: null }), TODAY, es, true);

		expect(card.actions.openLink).toBeNull();
		expect(card.why).toBeNull();
		expect(card.source).toBeNull();
	});

	it('speaks English', () => {
		const card = resourceCardView(modules({ finished: '2026-11-08' }), TODAY, en, true);

		expect(card).toMatchObject({ kindLabel: 'Article', stateLabel: 'Read · missing what it left you', why: { heading: 'What it is useful for' }, ariaLabel: 'Card of Cómo pensar en módulos' });
		expect(card.takeaway.heading).toBe('What it left me');
		expect(card.actions.openLink?.label).toBe('Open the link');
		expect(card.seal.text).toBe('Missing what it left you');
	});
});

describe('resourceOutcomeView: the toast after "Marcar como leído" (M8 S6)', () => {
	const toast = (outcome: MarkResourceFinishedOutcome, t = es) => resourceOutcomeView(outcome, t);

	it('words every outcome', () => {
		expect(toast({ kind: 'finished' })).toEqual({ tone: 'success', message: 'Marcado. Escribe en la nota lo que te dejó para sellarlo.' });
		expect(toast({ kind: 'not-found' })).toEqual({ tone: 'warning', message: 'No se encontró la nota del recurso.' });
		expect(toast({ kind: 'already-finished' })).toEqual({ tone: 'neutral', message: 'Ese recurso ya estaba marcado.' });
		expect(toast({ kind: 'write-failed' })).toEqual({ tone: 'error', message: 'No se pudo guardar en la nota. Inténtalo de nuevo.' });
	});

	it('speaks English', () => {
		expect(toast({ kind: 'finished' }, en).message).toBe('Marked. Write what it left you in the note to seal it.');
		expect(toast({ kind: 'already-finished' }, en).message).toBe('That resource was already marked.');
	});
});

describe('resourceCardView: the video in the card (M8 S8)', () => {
	it('plays a YouTube link inside the card, as Obsidian embeds it in a note', () => {
		const talk = modules({ kind: 'video', url: 'https://youtu.be/dQw4w9WgXcQ?si=AbCdEf' });

		expect(resourceCardView(talk, TODAY, es, true).video).toEqual({ label: 'Video', markdown: '![](https://www.youtube.com/watch?v=dQw4w9WgXcQ)' });
		expect(resourceCardView(talk, TODAY, en, true).video?.label).toBe('Video');
	});

	it('keeps the link to open, whatever the video', () => {
		const talk = modules({ kind: 'video', url: 'https://youtu.be/dQw4w9WgXcQ?si=AbCdEf' });

		expect(resourceCardView(talk, TODAY, es, true).actions.openLink).toEqual({ href: 'https://youtu.be/dQw4w9WgXcQ?si=AbCdEf', label: 'Abrir el enlace' });
	});

	it('shows no video for another link, a YouTube playlist, or no link', () => {
		expect(resourceCardView(modules(), TODAY, es, true).video).toBeNull();
		expect(resourceCardView(modules({ kind: 'course', url: 'https://www.youtube.com/playlist?list=PL590L5WQmH8f' }), TODAY, es, true).video).toBeNull();
		expect(resourceCardView(modules({ url: null }), TODAY, es, true).video).toBeNull();
	});
});
