import { describe, expect, it, vi } from 'vitest';
import type { Timers } from '../../../src/adapters/vault/cacheWait';
import { VaultCampaignRepository } from '../../../src/adapters/vault/VaultCampaignRepository';
import { fakeVaultApp, type FakeCache } from '../../fakes/fakeVaultApp';

const ID = '3f2a1c8e-0000-4000-8000-000000000101';
const BIBLIOTHEKE = '03 - Areas/Bibliotheke/Archeion - Bibliotheke.md';
const DROMOS = '02 - Projects/Dromos/README.md';
const ARCHEION = {
	title: 'Archeion - Bibliotheke',
	type: 'archeion',
	status: 'active',
	goal: 'Leer con intención.',
	skill: ['lector'],
	habits: [{ title: 'Leer 10 minutos', days: 21, skill: 'lector', habitica_id: null }],
};
const PROJECT = { type: 'index', status: 'active', title: 'Dromos', tasks: [{ title: 'Ship', habitica_id: null }] };

/** Timers that never fire on their own: a wait ends only when the cache catches up. */
const stillTimers: Timers = { set: () => 0, clear: () => undefined };

function repositoryOver(app: ReturnType<typeof fakeVaultApp>, timers?: Timers): VaultCampaignRepository {
	return new VaultCampaignRepository(app as unknown as ConstructorParameters<typeof VaultCampaignRepository>[0], timers);
}

const repository = (notes: Readonly<Record<string, FakeCache>>): VaultCampaignRepository => repositoryOver(fakeVaultApp(notes));

describe('VaultCampaignRepository: "Send again" replaces an id only over the one Habitica lost (ADR-021)', () => {
	const OLD = '3f2a1c8e-0000-4000-8000-0000000000aa';
	const linked = { ...ARCHEION, habits: [{ title: 'Leer 10 minutos', days: 21, skill: 'lector', habitica_id: OLD }] };

	it('replaces the habitica_id of the habit that still holds the old id, and nothing else in the note', async () => {
		const app = fakeVaultApp({ [BIBLIOTHEKE]: { frontmatter: linked } });

		expect(await repositoryOver(app).relinkHabitHabiticaId(BIBLIOTHEKE, 'Leer 10 minutos', OLD, ID)).toBe('relinked');
		expect(app.savedFrontmatter(BIBLIOTHEKE)).toEqual({ ...linked, habits: [{ title: 'Leer 10 minutos', days: 21, skill: 'lector', habitica_id: ID }] });
	});

	it('refuses and writes nothing when the note changed meanwhile', async () => {
		const edited = { ...linked, habits: [{ title: 'Leer 10 minutos', days: 21, skill: 'lector', habitica_id: 'written-by-hand' }] };
		const app = fakeVaultApp({ [BIBLIOTHEKE]: { frontmatter: edited } });

		expect(await repositoryOver(app).relinkHabitHabiticaId(BIBLIOTHEKE, 'Leer 10 minutos', OLD, ID)).toBe('changed');
		expect(app.savedFrontmatter(BIBLIOTHEKE)).toEqual(edited);
	});

	it('answers changed for a note that is no longer there', async () => {
		expect(await repository({}).relinkHabitHabiticaId(BIBLIOTHEKE, 'Leer 10 minutos', OLD, ID)).toBe('changed');
		expect(await repository({}).relinkHabiticaId(DROMOS, 'Ship', OLD, ID)).toBe('changed');
	});

	it('replaces the id of a project task the same way', async () => {
		const project = { ...PROJECT, tasks: [{ title: 'Ship', phase: 'mvp', habitica_id: OLD }, { title: 'Docs', habitica_id: null }] };
		const app = fakeVaultApp({ [DROMOS]: { frontmatter: project } });

		expect(await repositoryOver(app).relinkHabiticaId(DROMOS, 'Ship', OLD, ID)).toBe('relinked');
		expect(app.savedFrontmatter(DROMOS)).toEqual({ ...project, tasks: [{ title: 'Ship', phase: 'mvp', habitica_id: ID }, { title: 'Docs', habitica_id: null }] });
	});

	it('waits for the cache to show the new id before resolving', async () => {
		const app = fakeVaultApp({ [BIBLIOTHEKE]: { frontmatter: linked } }, { cacheFollowsWrites: false });
		let result: string | undefined;

		const writing = repositoryOver(app, stillTimers)
			.relinkHabitHabiticaId(BIBLIOTHEKE, 'Leer 10 minutos', OLD, ID)
			.then((value) => (result = value));
		await vi.waitFor(() => expect(app.listenerCount()).toBe(1));
		expect(result).toBeUndefined();

		app.refreshCache(BIBLIOTHEKE);
		await writing;
		expect(result).toBe('relinked');
	});

	it('rejects when the save fails, so the caller can tell the user', async () => {
		const app = fakeVaultApp({ [BIBLIOTHEKE]: { frontmatter: linked } }, { failWritesWith: new Error('disk') });

		await expect(repositoryOver(app).relinkHabitHabiticaId(BIBLIOTHEKE, 'Leer 10 minutos', OLD, ID)).rejects.toThrow('disk');
	});
});
