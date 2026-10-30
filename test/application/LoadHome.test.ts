import { describe, expect, it } from 'vitest';
import { LoadHome, QuestState, SyncQuests } from '../../src/application';
import type { Character } from '../../src/domain';
import { FakeTaskSource } from '../fakes/FakeTaskSource';
import { FixedClock } from '../fakes/FixedClock';
import { InMemoryGameStateRepository } from '../fakes/InMemoryGameStateRepository';
import { aQuest } from '../fakes/quests';

const CHARACTER: Character = {
	name: 'Nico',
	title: 'Aprendiz',
	level: 3,
	totalXp: 250,
	xpIntoLevel: 50,
	xpToNext: 150,
	stats: { fuerza: 2, inteligencia: 4, espiritu: 1, disciplina: 3 },
};
const IDLE_QUESTS = { quests: null, lastSyncedAt: null, status: { kind: 'idle' } };

describe('LoadHome', () => {
	it('returns the character found in the vault with the current quest state', async () => {
		const repository = new InMemoryGameStateRepository({ kind: 'found', character: CHARACTER });

		const home = await new LoadHome({ repository, state: new QuestState() }).execute();

		expect(home).toEqual({ character: { kind: 'found', character: CHARACTER }, quests: IDLE_QUESTS });
	});

	it('returns the expected path when Character.md is missing', async () => {
		const repository = new InMemoryGameStateRepository({ kind: 'missing', path: 'Dromos/Character.md' });

		const home = await new LoadHome({ repository, state: new QuestState() }).execute();

		expect(home).toEqual({ character: { kind: 'missing', path: 'Dromos/Character.md' }, quests: IDLE_QUESTS });
	});

	it('reads the note again on every call, so a hand edit shows on reopen', async () => {
		const repository = new InMemoryGameStateRepository({ kind: 'found', character: CHARACTER });
		const loadHome = new LoadHome({ repository, state: new QuestState() });
		await loadHome.execute();
		const edited: Character = { ...CHARACTER, name: 'Nicolás' };
		repository.set({ kind: 'found', character: edited });

		const home = await loadHome.execute();

		expect(home.character).toEqual({ kind: 'found', character: edited });
		expect(repository.loads).toBe(2);
	});

	it('returns the quests synced in this session without calling the task source', async () => {
		const syncTime = new Date('2026-10-30T13:45:00Z');
		const quests = [aQuest('d1')];
		const source = new FakeTaskSource().resolves(quests);
		const state = new QuestState();
		const repository = new InMemoryGameStateRepository({ kind: 'found', character: CHARACTER });
		const loadHome = new LoadHome({ repository, state });
		const sync = new SyncQuests({ source, clock: new FixedClock(syncTime, '2026-10-30'), state, hasCredentials: () => true });

		const before = await loadHome.execute();
		expect(before.quests).toEqual(IDLE_QUESTS);
		expect(source.calls).toBe(0);

		await sync.execute();
		const after = await loadHome.execute();

		expect(after.quests).toEqual({ quests, lastSyncedAt: syncTime, status: { kind: 'synced' } });
		expect(source.calls).toBe(1);
	});
});
