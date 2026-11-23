import { describe, expect, it } from 'vitest';
import type { CampaignSnapshot } from '../../src/application';
import { createTranslator } from '../../src/i18n';
import { campaignScreenView } from '../../src/ui/presenters/campaignScreenView';
import { campaignListView } from '../../src/ui/presenters/campaignView';
import { linkExistingOutcomeView, noChoicesView } from '../../src/ui/presenters/linkExistingView';
import { campaign, phase, task } from '../domain/campaign/campaignFixtures';

const en = createTranslator('en');
const es = createTranslator('es');
const ID = '3f2a1c8e-0000-4000-8000-000000000001';
const P = 'P/Cheshbon/README.md';
const cheshbon = campaign({ path: P, title: 'Cheshbon', phases: [phase('one', 'active')], tasks: [task('Mejoras', 'one'), task('Informe', 'one', { habiticaId: ID }), task('Borrado', 'one', { habiticaId: 'gone' })] });
const snapshot = (overrides: Partial<CampaignSnapshot> = {}): CampaignSnapshot => ({
	campaigns: [cheshbon],
	areas: [],
	issues: [{ kind: 'habitica-task-deleted', campaignPath: P, taskTitle: 'Borrado' }],
	lastSyncedAt: new Date('2026-11-22T12:00:00Z'),
	status: { kind: 'synced' },
	...overrides,
});
const flags = (value: CampaignSnapshot, canLink: boolean) =>
	campaignScreenView(campaignListView(value, { today: '2026-11-22', defaultStaleAfterDays: 14, canLink, t: en }), null, en).campaign?.groups.flatMap((group) => group.tasks.map((row) => [row.title, row.canSend, row.canLink ?? false]));

describe('where "Link existing" shows (link-existing-todo S3)', () => {
	it('sits beside "Send to Habitica" on a project task with no id, once the to-do list is loaded', () => {
		expect(flags(snapshot(), true)).toEqual([
			['Mejoras', true, true],
			['Informe', false, false],
			['Borrado', false, false],
		]);
	});

	it('does not show before the list is loaded, nor while Habitica is not set up', () => {
		expect(flags(snapshot(), false)?.map(([, , canLink]) => canLink)).toEqual([false, false, false]);
		expect(flags(snapshot({ status: { kind: 'not-configured' } }), true)?.map(([, , canLink]) => canLink)).toEqual([false, false, false]);
	});

	it('never shows on a research, whose tasks are sessions', () => {
		const research = campaign({ kind: 'research', path: P, phases: [phase('one', 'active')], tasks: [task('Sesión', 'one')] });

		expect(flags(snapshot({ campaigns: [research], issues: [] }), true)?.map(([, , canLink]) => canLink)).toEqual([false]);
	});
});

describe('linkExistingOutcomeView (link-existing-todo S6)', () => {
	it('confirms the link with the to-do title, in English and Spanish', () => {
		expect(linkExistingOutcomeView({ kind: 'linked', habiticaId: ID }, 'Mejoras para Cheshbon', en)).toEqual({ tone: 'success', message: 'Linked to “Mejoras para Cheshbon” in Habitica.' });
		expect(linkExistingOutcomeView({ kind: 'linked', habiticaId: ID }, 'Mejoras para Cheshbon', es)).toEqual({ tone: 'success', message: 'Vinculada a «Mejoras para Cheshbon» en Habitica.' });
	});

	it('explains every other outcome without saying anything was sent to or created in Habitica', () => {
		const kinds = ['already-linked', 'taken', 'not-found', 'not-a-project', 'write-failed'] as const;
		const messages = kinds.map((kind) => linkExistingOutcomeView({ kind }, 'X', en));

		expect(messages).toEqual([
			{ tone: 'neutral', message: 'That task is already linked to Habitica.' },
			{ tone: 'warning', message: 'That to-do is already linked to another task. Pick another one.' },
			{ tone: 'warning', message: 'The task was not found in the note. Sync and try again.' },
			{ tone: 'warning', message: 'Only project tasks can be linked to Habitica.' },
			{ tone: 'error', message: 'The link could not be saved in the note. Nothing changed in Habitica.' },
		]);
		for (const kind of kinds) expect(linkExistingOutcomeView({ kind }, 'X', es).message).not.toMatch(/envi|cre/i);
		for (const { message } of messages) expect(message).not.toMatch(/sent|created/i);
	});

	it('says why there is nothing to pick: no list yet, or every open to-do already linked', () => {
		expect(noChoicesView(null, en)).toEqual({ tone: 'neutral', message: 'Sync first to load your Habitica to-dos.' });
		expect(noChoicesView([], en)).toEqual({ tone: 'neutral', message: 'Every open Habitica to-do is already linked to a task.' });
		expect(noChoicesView(null, es).message).toBe('Sincroniza primero para cargar tus to-dos de Habitica.');
		expect(noChoicesView([], es).message).toBe('Todos los to-dos abiertos de Habitica ya están vinculados a una tarea.');
	});
});
