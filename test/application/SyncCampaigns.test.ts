import { describe, expect, it } from 'vitest';
import { CampaignState } from '../../src/application/CampaignState';
import { SyncCampaigns } from '../../src/application/SyncCampaigns';
import type { Area, Campaign } from '../../src/domain';
import { TaskSourceError } from '../../src/ports/TaskSourceError';
import { area, campaign, habit, phase, task } from '../domain/campaign/campaignFixtures';
import { FakeTaskStatusSource } from '../fakes/FakeTaskStatusSource';
import { FixedClock } from '../fakes/FixedClock';
import { InMemoryAreaRepository } from '../fakes/InMemoryAreaRepository';
import { InMemoryCampaignRepository } from '../fakes/InMemoryCampaignRepository';

const NOW = new Date('2026-10-31T15:00:00.000Z');
const H1 = '3f2a1c8e-0000-4000-8000-000000000001';
const H2 = '3f2a1c8e-0000-4000-8000-000000000002';

const kairos = (): Campaign =>
	campaign({ path: 'P/Kairos/README.md', phases: [phase('mvp', 'active')], tasks: [task('a', 'mvp', { habiticaId: H1 }), task('b', 'mvp', { habiticaId: H2 }), task('c', 'mvp')] });

function setup(options: { campaigns?: Campaign[]; areas?: Area[]; credentials?: boolean } = {}) {
	const state = new CampaignState();
	const source = new FakeTaskStatusSource();
	const repository = new InMemoryCampaignRepository(options.campaigns ?? [kairos()]);
	const areas = new InMemoryAreaRepository(options.areas ?? []);
	const sync = new SyncCampaigns({
		repository,
		areas,
		source,
		clock: new FixedClock(NOW, '2026-10-31'),
		state,
		hasCredentials: () => options.credentials ?? true,
	});
	return { state, source, repository, areas, sync };
}

const completedFlags = (campaigns: readonly Campaign[] | null): boolean[] => campaigns?.[0]?.tasks.map((item) => item.completed) ?? [];

describe('SyncCampaigns', () => {
	it('starts idle with no campaigns', () => {
		expect(setup().state.snapshot()).toEqual({ campaigns: null, areas: null, issues: [], lastSyncedAt: null, status: { kind: 'idle' } });
	});

	it('lists the campaigns and applies the Habitica status of their linked tasks', async () => {
		const { sync, source } = setup();
		source.resolves({ [H1]: { kind: 'completed', completedOn: '2026-10-30' }, [H2]: { kind: 'open' } });

		const snapshot = await sync.execute();

		expect(snapshot.status).toEqual({ kind: 'synced' });
		expect(snapshot.lastSyncedAt).toEqual(NOW);
		expect(completedFlags(snapshot.campaigns)).toEqual([true, false, false]);
		expect(snapshot.campaigns?.[0]?.tasks[0]?.completedOn).toBe('2026-10-30');
		expect(source.askedFor).toEqual([[H1, H2]]);
	});

	it('flags a task whose Habitica task is gone and keeps the list', async () => {
		const { sync, source } = setup();
		source.resolves({ [H1]: { kind: 'missing' }, [H2]: { kind: 'open' } });

		const snapshot = await sync.execute();

		expect(snapshot.issues).toEqual([{ campaignPath: 'P/Kairos/README.md', taskTitle: 'a', kind: 'habitica-task-missing' }]);
		expect(snapshot.campaigns).toHaveLength(1);
	});

	it('asks for the linked habits too and puts the streak on them', async () => {
		const salto = campaign({ tasks: [task('a', null, { habiticaId: H1 })], habits: [habit('Stretch', { habiticaId: H2 }), habit('Unsent')] });
		const { sync, source } = setup({ campaigns: [salto] });
		source.resolves({ [H1]: { kind: 'open' }, [H2]: { kind: 'daily', streak: 12 } });

		const snapshot = await sync.execute();

		expect(source.askedFor).toEqual([[H1, H2]]);
		expect(snapshot.campaigns?.[0]?.habits.map((item) => item.streak)).toEqual([12, null]);
	});

	it('makes a request for a project that only has linked habits', async () => {
		const { sync, source } = setup({ campaigns: [campaign({ habits: [habit('Stretch', { habiticaId: H1 })] })] });
		source.resolves({ [H1]: { kind: 'daily', streak: 3 } });

		await sync.execute();

		expect(source.calls).toBe(1);
	});

	it('makes no request when no task is linked, and still syncs', async () => {
		const { sync, source } = setup({ campaigns: [campaign({ tasks: [task('a', null)] })] });

		expect((await sync.execute()).status).toEqual({ kind: 'synced' });
		expect(source.calls).toBe(0);
	});

	it('shows the campaigns without asking Habitica when the account is not configured', async () => {
		const { sync, source } = setup({ credentials: false });

		const snapshot = await sync.execute();

		expect(snapshot.status).toEqual({ kind: 'not-configured' });
		expect(snapshot.campaigns).toHaveLength(1);
		expect(source.calls).toBe(0);
	});

	it('keeps the last known Habitica status when a later sync fails', async () => {
		const { sync, source } = setup();
		source.resolves({ [H1]: { kind: 'completed', completedOn: '2026-10-30' }, [H2]: { kind: 'open' } }).rejects(new TaskSourceError('Offline'));
		await sync.execute();

		const snapshot = await sync.execute();

		expect(snapshot.status).toEqual({ kind: 'offline' });
		expect(completedFlags(snapshot.campaigns)).toEqual([true, false, false]);
		expect(snapshot.lastSyncedAt).toEqual(NOW);
	});

	it('maps each failure to its status', async () => {
		const failures: [Error, unknown][] = [
			[new TaskSourceError('Unauthorized'), { kind: 'unauthorized' }],
			[new TaskSourceError('RateLimited', 8), { kind: 'rate-limited', retryAfterSeconds: 8 }],
			[new TaskSourceError('Unknown'), { kind: 'error' }],
			[new Error('boom'), { kind: 'error' }],
		];
		for (const [failure, status] of failures) {
			const { sync, source } = setup();
			source.rejects(failure);

			expect((await sync.execute()).status).toEqual(status);
		}
	});

	it('keeps the previous answer for ids the source did not answer', async () => {
		const { sync, source } = setup();
		source.resolves({ [H1]: { kind: 'completed', completedOn: '2026-10-30' }, [H2]: { kind: 'open' } }).resolves({ [H2]: { kind: 'open' } });
		await sync.execute();

		expect(completedFlags((await sync.execute()).campaigns)).toEqual([true, false, false]);
	});

	it('reads the vault on every sync, so a hand edit shows up', async () => {
		const { sync, repository, source } = setup({ campaigns: [campaign({ title: 'Old', tasks: [] })] });
		await sync.execute();
		Object.assign(repository, { campaigns: [campaign({ title: 'New', tasks: [] })] });
		source.resolves({});

		expect((await sync.execute()).campaigns?.[0]?.title).toBe('New');
	});

	it('reports `syncing` as soon as it starts and runs one sync for concurrent calls', async () => {
		const { sync, source, state } = setup();
		const release = source.holds({ [H1]: { kind: 'open' }, [H2]: { kind: 'open' } });

		const first = sync.execute();
		const second = sync.execute();
		expect(state.snapshot().status).toEqual({ kind: 'syncing' });
		release();
		await Promise.all([first, second]);

		expect(source.calls).toBe(1);
		expect(state.snapshot().status).toEqual({ kind: 'synced' });
	});

	it('reloads from the vault without asking Habitica and keeps the status and the progress', async () => {
		const { sync, source, repository, state } = setup();
		source.resolves({ [H1]: { kind: 'completed', completedOn: '2026-10-30' }, [H2]: { kind: 'open' } });
		await sync.execute();
		Object.assign(repository, { campaigns: [campaign({ title: 'Renamed', path: 'P/Kairos/README.md', phases: [phase('mvp', 'active')], tasks: [task('a', 'mvp', { habiticaId: H1 }), task('new', 'mvp', { habiticaId: '3f2a1c8e-0000-4000-8000-000000000009' })] })] });

		const snapshot = await sync.reload();

		expect(source.calls).toBe(1);
		expect(snapshot.campaigns?.[0]?.title).toBe('Renamed');
		expect(completedFlags(snapshot.campaigns)).toEqual([true, false]);
		expect(snapshot.status).toEqual({ kind: 'synced' });
		expect(snapshot.lastSyncedAt).toEqual(NOW);
		expect(state.snapshot()).toEqual(snapshot);
	});

	it('does not start a second read while a sync is running', async () => {
		const { sync, source } = setup();
		const release = source.holds({ [H1]: { kind: 'open' }, [H2]: { kind: 'open' } });

		const running = sync.execute();
		const reloaded = sync.reload();
		release();

		expect(await reloaded).toEqual(await running);
		expect(source.calls).toBe(1);
	});

	it('answers `error` when the vault cannot be read on a reload, and never rejects', async () => {
		const { sync, repository } = setup();
		repository.listActive = () => Promise.reject(new Error('vault down'));

		expect((await sync.reload()).status).toEqual({ kind: 'error' });
	});

	it('answers `error` and keeps the previous list when the vault cannot be read', async () => {
		const { sync, repository, source } = setup();
		source.resolves({ [H1]: { kind: 'open' }, [H2]: { kind: 'open' } });
		await sync.execute();
		repository.listActive = () => Promise.reject(new Error('vault down'));

		const snapshot = await sync.execute();

		expect(snapshot.status).toEqual({ kind: 'error' });
		expect(snapshot.campaigns).toHaveLength(1);
	});
});

describe('SyncCampaigns: the habits of the reading areas (ADR-017, S4)', () => {
	const H3 = '3f2a1c8e-0000-4000-8000-000000000003';
	const H4 = '3f2a1c8e-0000-4000-8000-000000000004';
	const BIBLIOTHEKE = '03 - Areas/Bibliotheke/Archeion - Bibliotheke.md';
	const bibliotheke = (): Area => area({ path: BIBLIOTHEKE, habits: [habit('Leer 10 minutos', { habiticaId: H3 }), habit('Releer notas')] });
	const kairosArea = (): Area => area({ path: '03 - Areas/Kairos/Archeion - Kairos.md', title: 'Archeion - Kairos', skills: ['desarrollador'], habits: [habit('Codear', { habiticaId: H4 })] });

	it('asks for the linked habits of a reading area in the same single request as the campaigns, and puts the streak on them', async () => {
		const { sync, source } = setup({ areas: [bibliotheke()] });
		source.resolves({ [H1]: { kind: 'open' }, [H2]: { kind: 'open' }, [H3]: { kind: 'daily', streak: 6 } });

		const snapshot = await sync.execute();

		expect(source.calls).toBe(1);
		expect(source.askedFor).toEqual([[H1, H2, H3]]);
		expect(snapshot.areas?.map((item) => item.path)).toEqual([BIBLIOTHEKE]);
		expect(snapshot.areas?.[0]?.habits.map((item) => item.streak)).toEqual([6, null]);
		expect(completedFlags(snapshot.campaigns)).toEqual([false, false, false]);
		expect(snapshot.status).toEqual({ kind: 'synced' });
	});

	it('asks only for the habits whose skills, their own or else their Archeion\'s, include lector; the snapshot carries every area', async () => {
		const H5 = '3f2a1c8e-0000-4000-8000-000000000005';
		const H6 = '3f2a1c8e-0000-4000-8000-000000000006';
		const learnings = area({
			path: '03 - Areas/Learnings/Archeion - Learnings.md',
			title: 'Archeion - Learnings',
			skills: ['lector'],
			habits: [habit('Repasar', { habiticaId: H4, skills: ['estudiante'] }), habit('Leer un artículo', { habiticaId: H5 })],
		});
		const bible = area({ path: '03 - Areas/Bible/Archeion - Bible.md', title: 'Archeion - Bible', skills: ['teologo'], habits: [habit('Orar', { habiticaId: H6 }), habit('Leer la Biblia', { habiticaId: H1, skills: ['lector'] })] });
		const { sync, source } = setup({ campaigns: [], areas: [bible, bibliotheke(), learnings, kairosArea()] });
		source.resolves({ [H1]: { kind: 'daily', streak: 8 }, [H3]: { kind: 'daily', streak: 2 }, [H5]: { kind: 'daily', streak: 1 } });

		const snapshot = await sync.execute();

		expect(source.askedFor).toEqual([[H1, H3, H5]]);
		expect(snapshot.areas?.map((item) => item.title)).toEqual(['Archeion - Bible', 'Archeion - Bibliotheke', 'Archeion - Learnings', 'Archeion - Kairos']);
		expect(snapshot.areas?.[0]?.habits.map((item) => item.streak)).toEqual([null, 8]);
		expect(snapshot.areas?.[3]?.habits[0]?.streak).toBeNull();
	});

	it('makes one request for a reading-area habit even when no campaign has a linked task', async () => {
		const { sync, source } = setup({ campaigns: [], areas: [bibliotheke()] });
		source.resolves({ [H3]: { kind: 'daily', streak: 1 } });

		await sync.execute();

		expect(source.askedFor).toEqual([[H3]]);
	});

	it('clears the streak of a habit whose daily is gone and flags it with the area path', async () => {
		const { sync, source } = setup({ areas: [area({ path: BIBLIOTHEKE, habits: [habit('Leer 10 minutos', { habiticaId: H3, streak: 4 })] })] });
		source.resolves({ [H1]: { kind: 'open' }, [H2]: { kind: 'open' }, [H3]: { kind: 'missing' } });

		const snapshot = await sync.execute();

		expect(snapshot.areas?.[0]?.habits[0]?.streak).toBeNull();
		expect(snapshot.issues).toEqual([{ campaignPath: BIBLIOTHEKE, taskTitle: 'Leer 10 minutos', kind: 'habitica-task-missing' }]);
	});

	it('with no areas makes the same request as before and carries an empty list', async () => {
		const { sync, source } = setup();
		source.resolves({ [H1]: { kind: 'open' }, [H2]: { kind: 'open' } });

		const snapshot = await sync.execute();

		expect(source.askedFor).toEqual([[H1, H2]]);
		expect(snapshot.areas).toEqual([]);
		expect(snapshot.campaigns).toHaveLength(1);
	});

	it('carries the areas without asking Habitica when the account is not configured', async () => {
		const { sync, source } = setup({ areas: [bibliotheke()], credentials: false });

		const snapshot = await sync.execute();

		expect(source.calls).toBe(0);
		expect(snapshot.status).toEqual({ kind: 'not-configured' });
		expect(snapshot.areas?.[0]?.habits.map((item) => item.habiticaId)).toEqual([H3, null]);
	});

	it('reloads the areas from the vault without asking Habitica, keeping the streaks already known', async () => {
		const { sync, source, areas } = setup({ areas: [bibliotheke()] });
		source.resolves({ [H1]: { kind: 'open' }, [H2]: { kind: 'open' }, [H3]: { kind: 'daily', streak: 6 } });
		await sync.execute();
		await areas.linkHabitHabiticaId(BIBLIOTHEKE, 'Releer notas', H4);

		const snapshot = await sync.reload();

		expect(source.calls).toBe(1);
		expect(snapshot.areas?.[0]?.habits.map((item) => [item.habiticaId, item.streak])).toEqual([
			[H3, 6],
			[H4, null],
		]);
		expect(snapshot.status).toEqual({ kind: 'synced' });
	});

	it('answers `error` when the areas cannot be read, like the campaigns', async () => {
		const { sync, source, areas } = setup({ areas: [bibliotheke()] });
		areas.listAreas = () => Promise.reject(new Error('vault down'));

		expect((await sync.execute()).status).toEqual({ kind: 'error' });
		expect((await sync.reload()).status).toEqual({ kind: 'error' });
		expect(source.calls).toBe(0);
	});
});
