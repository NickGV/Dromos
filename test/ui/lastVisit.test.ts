import { describe, expect, it } from 'vitest';
import type { GameSnapshot } from '../../src/application';
import { LAST_SEEN_KEY, noteSeen, settleVisit, storedLastSeen } from '../../src/ui/containers/lastVisit';
import { skill } from '../domain/skill/skillFixtures';
import { InMemoryDeviceStore } from '../fakes/InMemoryDeviceStore';

const clock = { today: () => '2026-11-03', now: () => new Date('2026-11-03T14:00:00.000Z') };

const game = (totalXp: number, readerXp: number, completedQuests: number): GameSnapshot => ({
	status: { kind: 'synced' },
	lastSyncedAt: clock.now(),
	character: { level: 5, totalXp, xpIntoLevel: totalXp - 400, xpToNext: 400 },
	skills: [{ skill: skill({ id: 'lector', name: 'Reader', unlocked: true }), xp: readerXp, standing: { level: 1, xpIntoLevel: readerXp, xpToNext: 100, rankIndex: 0 }, rank: null, requirements: [], recent: [] }],
	events: [],
	invalidSkills: [],
	unreadable: [],
	invalidRules: null,
	completedQuests,
});

const RECORD_NOW = { savedAt: '2026-11-03T14:00:00.000Z', savedOn: '2026-11-03', level: 5, totalXp: 585, skills: { lector: 45 }, quests: 14 };
const YESTERDAY = { savedAt: '2026-11-02T20:00:00.000Z', savedOn: '2026-11-02', level: 5, totalXp: 540, skills: { lector: 30 }, quests: 12 };

// game-ui S15: the record of what this device last saw, through the device-store port.
describe('settleVisit, once the open sync settles', () => {
	it('writes the current values as the new record, under last-seen, after telling what changed', () => {
		const store = new InMemoryDeviceStore({ [LAST_SEEN_KEY]: YESTERDAY });

		const delta = settleVisit(store, storedLastSeen(store), game(585, 45, 14), clock);

		expect(LAST_SEEN_KEY).toBe('last-seen');
		expect(delta).toEqual({ xp: 45, levelChanged: false, skills: [{ name: 'Reader', xp: 15 }], quests: 2, days: 1 });
		expect(store.writes).toEqual([['last-seen', RECORD_NOW]]);
	});

	it('on the first visit on a device just writes the record, with nothing to tell', () => {
		const store = new InMemoryDeviceStore();

		expect(settleVisit(store, storedLastSeen(store), game(585, 45, 14), clock)).toBeNull();
		expect(store.writes).toEqual([['last-seen', RECORD_NOW]]);
	});

	it('tells nothing when nothing changed, and still keeps when the device saw it', () => {
		const store = new InMemoryDeviceStore({ [LAST_SEEN_KEY]: YESTERDAY });

		expect(settleVisit(store, storedLastSeen(store), game(540, 30, 12), clock)).toBeNull();
		expect(store.writes).toEqual([['last-seen', { ...YESTERDAY, savedAt: '2026-11-03T14:00:00.000Z', savedOn: '2026-11-03' }]]);
	});

	it('writes nothing while the game has no character, so the older record still counts next time', () => {
		const store = new InMemoryDeviceStore({ [LAST_SEEN_KEY]: YESTERDAY });
		const none: GameSnapshot = { ...game(0, 0, 0), status: { kind: 'offline' }, character: null, skills: null };

		expect(settleVisit(store, storedLastSeen(store), none, clock)).toBeNull();
		expect(store.writes).toEqual([]);
	});
});

describe('noteSeen, after a later sync while the view stays open', () => {
	it('keeps the record current, so the next open counts from what was seen last', () => {
		const store = new InMemoryDeviceStore({ [LAST_SEEN_KEY]: YESTERDAY });

		noteSeen(store, game(585, 45, 14), clock);

		expect(store.writes).toEqual([['last-seen', RECORD_NOW]]);
	});
});

describe('storedLastSeen', () => {
	it('reads a stored record, and no record from anything else', () => {
		expect(storedLastSeen(new InMemoryDeviceStore({ [LAST_SEEN_KEY]: YESTERDAY }))).toEqual(YESTERDAY);
		expect(storedLastSeen(new InMemoryDeviceStore({ [LAST_SEEN_KEY]: 'garbage' }))).toBeNull();
		expect(storedLastSeen(new InMemoryDeviceStore())).toBeNull();
	});
});
