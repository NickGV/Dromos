import { describe, expect, it } from 'vitest';
import type { LinkOutcome } from '../../src/application';
import { createTranslator } from '../../src/i18n';
import { linkOutcomeView } from '../../src/ui/presenters/linkOutcomeView';

const ID = '3f2a1c8e-0000-4000-8000-000000000001';

const t = createTranslator('es');

describe('linkOutcomeView', () => {
	it('confirms a sent task', () => {
		expect(linkOutcomeView({ kind: 'linked', habiticaId: ID }, t)).toEqual({ tone: 'success', message: 'Tarea enviada a Habitica.' });
	});

	it('says when the task was already in Habitica or is gone from the note', () => {
		expect(linkOutcomeView({ kind: 'already-linked' }, t)).toEqual({ tone: 'neutral', message: 'Esa tarea ya está en Habitica.' });
		expect(linkOutcomeView({ kind: 'not-found' }, t)).toEqual({
			tone: 'warning',
			message: 'No se encontró la tarea en la nota. Sincroniza e inténtalo de nuevo.',
		});
		expect(linkOutcomeView({ kind: 'not-a-project' }, t).tone).toBe('warning');
	});

	it('explains each Habitica failure', () => {
		const message = (error: Extract<LinkOutcome, { kind: 'habitica-failed' }>['error']) => linkOutcomeView({ kind: 'habitica-failed', error }, t);

		expect(message('Offline')).toEqual({ tone: 'warning', message: 'Sin conexión: no se pudo enviar la tarea.' });
		expect(message('Unauthorized')).toEqual({ tone: 'error', message: 'Token inválido: no se pudo enviar la tarea.' });
		expect(message('RateLimited')).toEqual({ tone: 'warning', message: 'Demasiadas solicitudes a Habitica. Inténtalo en un momento.' });
		expect(message('Unknown')).toEqual({ tone: 'error', message: 'No se pudo enviar la tarea a Habitica.' });
	});

	it('warns about a duplicate to-do and gives its id so it can be deleted', () => {
		const view = linkOutcomeView({ kind: 'duplicate', habiticaId: ID }, t);

		expect(view.tone).toBe('warning');
		expect(view.message).toContain(ID);
		expect(view.message).toContain('duplicad');
	});

	it('gives the id when the task exists in Habitica but could not be written into the note', () => {
		const view = linkOutcomeView({ kind: 'write-failed', habiticaId: ID }, t);

		expect(view.tone).toBe('error');
		expect(view.message).toContain(ID);
		expect(view.message).toContain('no se pudo guardar');
	});
});

describe('linkOutcomeView: "Enviar de nuevo" refused because the note changed (ADR-021)', () => {
	it('says the note changed and nothing was sent', () => {
		expect(linkOutcomeView({ kind: 'changed', habiticaId: null }, t)).toEqual({
			tone: 'warning',
			message: 'La nota cambió mientras tanto, así que no se envió nada. Sincroniza e inténtalo de nuevo.',
		});
		expect(linkOutcomeView({ kind: 'changed', habiticaId: null }, createTranslator('en')).message).toBe('The note changed meanwhile, so nothing was sent. Sync and try again.');
	});

	it('gives the id of the new copy when the note changed while it was being sent', () => {
		const view = linkOutcomeView({ kind: 'changed', habiticaId: ID }, t);

		expect(view).toEqual({ tone: 'warning', message: `La nota cambió durante el envío, así que su id no se reemplazó. Borra la copia nueva en Habitica. Id: ${ID}` });
		expect(linkOutcomeView({ kind: 'changed', habiticaId: ID }, createTranslator('en')).message).toBe(
			`The note changed while sending, so its id was not replaced. Delete the new copy in Habitica. Id: ${ID}`,
		);
	});
});
