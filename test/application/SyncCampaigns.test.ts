import { describe, expect, it } from 'vitest';
import { CampaignState } from '../../src/application/CampaignState';
import { SyncCampaigns } from '../../src/application/SyncCampaigns';
import type { Campaign } from '../../src/domain';
import { TaskSourceError } from '../../src/ports/TaskSourceError';
import { campaign, phase, task } from '../domain/campaign/campaignFixtures';
import { FakeTaskStatusSource } from '../fakes/FakeTaskStatusSource';
import { FixedClock } from '../fakes/FixedClock';
import { InMemoryCampaignRepository } from '../fakes/InMemoryCampaignRepository';

const NOW = new Date('2026-10-31T15:00:00.000Z');
const H1 = '3f2a1c8e-0000-4000-8000-000000000001';
const H2 = '3f2a1c8e-0000-4000-8000-000000000002';

const kairos = (): Campaign =>
	campaign({ path: 'P/Kairos/README.md', phases: [phase('mvp', 'active')], tasks: [task('a', 'mvp', { habiticaId: H1 }), task('b', 'mvp', { habiticaId: H2 }), task('c', 'mvp')] });

function setup(options: { campaigns?: Campaign[]; credentials?: boolean } = {}) {
	const state = new CampaignState();
	const source = new FakeTaskStatusSource();
	const repository = new InMemoryCampaignRepository(options.campaigns ?? [kairos()]);
	const sync = new SyncCampaigns({
		repository,
		source,
		clock: new FixedClock(NOW, '2026-10-31'),
		state,
		hasCredentials: () => options.credentials ?? true,
	});
	return { state, source, repository, sync };
}

const completedFlags = (campaigns: readonly Campaign[] | null): boolean[] => campaigns?.[0]?.tasks.map((item) => item.completed) ?? [];

describe('SyncCampaigns', () => {
	it('starts idle with no campaigns', () => {
		expect(setup().state.snapshot()).toEqual({ campaigns: null, issues: [], lastSyncedAt: null, status: { kind: 'idle' } });
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
