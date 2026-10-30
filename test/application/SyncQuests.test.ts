import { describe, expect, it } from 'vitest';
import { QuestState, SyncQuests, type QuestSnapshot, type SyncStatus } from '../../src/application';
import { TaskSourceError } from '../../src/ports';
import { FakeTaskSource } from '../fakes/FakeTaskSource';
import { FixedClock } from '../fakes/FixedClock';
import { aQuest } from '../fakes/quests';

const SYNC_TIME = new Date('2026-10-30T13:45:00Z');
const QUESTS = [aQuest('d1'), aQuest('t1', { type: 'todo' })];

function setup(credentials = true) {
	const source = new FakeTaskSource();
	const state = new QuestState();
	const sync = new SyncQuests({
		source,
		clock: new FixedClock(SYNC_TIME, '2026-10-30'),
		state,
		hasCredentials: () => credentials,
	});
	return { source, state, sync };
}

const FAILURES: ReadonlyArray<readonly [string, unknown, SyncStatus]> = [
	['Offline', new TaskSourceError('Offline'), { kind: 'offline' }],
	['Unauthorized', new TaskSourceError('Unauthorized'), { kind: 'unauthorized' }],
	['RateLimited with a delay', new TaskSourceError('RateLimited', 42), { kind: 'rate-limited', retryAfterSeconds: 42 }],
	['RateLimited without a delay', new TaskSourceError('RateLimited'), { kind: 'rate-limited', retryAfterSeconds: null }],
	['Unknown', new TaskSourceError('Unknown'), { kind: 'error' }],
	['a plain Error', new TypeError('boom'), { kind: 'error' }],
	['a thrown string', 'boom', { kind: 'error' }],
];

describe('QuestState', () => {
	it('starts idle, with no quests and no sync time', () => {
		expect(new QuestState().snapshot()).toEqual({ quests: null, lastSyncedAt: null, status: { kind: 'idle' } });
	});
});

describe('SyncQuests: success', () => {
	it('stores the fetched quests, the sync time and the synced status', async () => {
		const { source, state, sync } = setup();
		source.resolves(QUESTS);

		const snapshot = await sync.execute();

		const expected: QuestSnapshot = { quests: QUESTS, lastSyncedAt: SYNC_TIME, status: { kind: 'synced' } };
		expect(snapshot).toEqual(expected);
		expect(state.snapshot()).toEqual(expected);
		expect(source.calls).toBe(1);
	});

	it('reports syncing while the request is pending', async () => {
		const { source, state, sync } = setup();
		const release = source.holds(QUESTS);

		const pending = sync.execute();

		expect(state.snapshot().status).toEqual({ kind: 'syncing' });
		release();
		await expect(pending).resolves.toMatchObject({ status: { kind: 'synced' } });
	});
});

describe('SyncQuests: failures', () => {
	it.each(FAILURES)('maps %s and keeps the quests and time of the previous success', async (_label, reason, status) => {
		const { source, state, sync } = setup();
		source.resolves(QUESTS).rejects(reason);
		await sync.execute();

		const snapshot = await sync.execute();

		expect(snapshot).toEqual({ quests: QUESTS, lastSyncedAt: SYNC_TIME, status });
		expect(state.snapshot()).toEqual(snapshot);
	});

	it.each(FAILURES)('maps %s on a first sync, with no quests yet', async (_label, reason, status) => {
		const { source, sync } = setup();
		source.rejects(reason);

		await expect(sync.execute()).resolves.toEqual({ quests: null, lastSyncedAt: null, status });
	});
});

describe('SyncQuests: missing credentials', () => {
	it('sets not-configured and never calls the source', async () => {
		const { source, state, sync } = setup(false);

		const snapshot = await sync.execute();

		expect(snapshot).toEqual({ quests: null, lastSyncedAt: null, status: { kind: 'not-configured' } });
		expect(state.snapshot()).toEqual(snapshot);
		expect(source.calls).toBe(0);
	});
});

describe('SyncQuests: concurrency', () => {
	it('returns the in-flight sync to an overlapping call instead of starting another request', async () => {
		const { source, sync } = setup();
		const release = source.holds(QUESTS);

		const first = sync.execute();
		const second = sync.execute();

		expect(second).toBe(first);
		release();
		await expect(second).resolves.toMatchObject({ quests: QUESTS, status: { kind: 'synced' } });
		expect(source.calls).toBe(1);
	});

	it('starts a new request once the previous sync settled', async () => {
		const { source, sync } = setup();
		source.rejects(new TaskSourceError('Offline')).resolves(QUESTS);

		await sync.execute();
		const snapshot = await sync.execute();

		expect(snapshot.status).toEqual({ kind: 'synced' });
		expect(source.calls).toBe(2);
	});
});
