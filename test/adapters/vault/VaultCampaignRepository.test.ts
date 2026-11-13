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

describe('VaultCampaignRepository: areas (ADR-017)', () => {
	it('lists the archeion notes that are not archived, with their habits, through the metadata cache', async () => {
		const areas = await repository({
			[BIBLIOTHEKE]: { frontmatter: ARCHEION },
			'03 - Areas/Old/Archeion - Old.md': { frontmatter: { ...ARCHEION, title: 'Archeion - Old', status: 'archived' } },
			[DROMOS]: { frontmatter: PROJECT },
			'03 - Areas/Kairos/Archeion - Kairos.md': null,
		}).listAreas();

		expect(areas).toEqual([
			{
				path: BIBLIOTHEKE,
				title: 'Archeion - Bibliotheke',
				skills: ['lector'],
				habits: [{ title: 'Leer 10 minutos', days: 21, repeat: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], checklist: [], skills: ['lector'], habiticaId: null, streak: null }],
			},
		]);
	});

	it('keeps the campaign listing as it was: an archeion is never a campaign', async () => {
		const campaigns = await repository({ [BIBLIOTHEKE]: { frontmatter: ARCHEION }, [DROMOS]: { frontmatter: PROJECT } }).listActive();

		expect(campaigns.map((campaign) => campaign.path)).toEqual([DROMOS]);
	});

	it('writes only the habitica_id of the first unsent habit with that title into the archeion', async () => {
		const app = fakeVaultApp({ [BIBLIOTHEKE]: { frontmatter: { ...ARCHEION, habits: [{ title: 'Leer 10 minutos', habitica_id: 'old' }, ...ARCHEION.habits] } } });

		expect(await repositoryOver(app).linkHabitHabiticaId(BIBLIOTHEKE, 'Leer 10 minutos', ID)).toBe('linked');
		expect(app.savedFrontmatter(BIBLIOTHEKE)).toEqual({
			...ARCHEION,
			habits: [
				{ title: 'Leer 10 minutos', habitica_id: 'old' },
				{ title: 'Leer 10 minutos', days: 21, skill: 'lector', habitica_id: ID },
			],
		});
	});

	it('waits for the cache to show the id written into an archeion before resolving', async () => {
		const app = fakeVaultApp({ [BIBLIOTHEKE]: { frontmatter: ARCHEION } }, { cacheFollowsWrites: false });
		let result: string | undefined;

		const writing = repositoryOver(app, stillTimers)
			.linkHabitHabiticaId(BIBLIOTHEKE, 'Leer 10 minutos', ID)
			.then((value) => (result = value));
		await vi.waitFor(() => expect(app.listenerCount()).toBe(1));
		expect(result).toBeUndefined();

		app.refreshCache(BIBLIOTHEKE);
		await writing;
		expect(result).toBe('linked');
		expect(app.listenerCount()).toBe(0);
	});

	it('never writes the tasks of an archeion', async () => {
		const app = fakeVaultApp({ [BIBLIOTHEKE]: { frontmatter: { ...ARCHEION, tasks: [{ title: 'Leer 10 minutos', habitica_id: null }] } } });

		expect(await repositoryOver(app).linkHabiticaId(BIBLIOTHEKE, 'Leer 10 minutos', ID)).toBe('not-found');
		expect(app.savedFrontmatter(BIBLIOTHEKE)).toEqual({ ...ARCHEION, tasks: [{ title: 'Leer 10 minutos', habitica_id: null }] });
	});
});
