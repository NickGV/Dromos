import { describe, expect, it } from 'vitest';
import type { GameSnapshot, SkillEntry } from '../../src/application';
import { createTranslator } from '../../src/i18n';
import { heldProgress, lastSeenOf, readLastSeen, sinceVisitText, visitCardView, visitDelta, type LastSeen, type VisitDelta } from '../../src/ui/presenters/sinceVisitView';
import { skill } from '../domain/skill/skillFixtures';

const en = createTranslator('en');
const es = createTranslator('es');
const NOW = new Date('2026-11-03T14:00:00.000Z');
const TODAY = '2026-11-03';

const seen = (overrides: Partial<LastSeen> = {}): LastSeen => ({
	savedAt: '2026-11-02T20:00:00.000Z',
	savedOn: '2026-11-02',
	level: 5,
	totalXp: 540,
	skills: { lector: 30, escritor: 10 },
	quests: 12,
	...overrides,
});

const names = new Map([
	['lector', 'Reader'],
	['escritor', 'Writer'],
	['atleta', 'Athlete'],
	['cuidador', 'Carer'],
	['orador', 'Speaker'],
]);

/** The delta from yesterday's record to a record saved now with `overrides`. */
const since = (overrides: Partial<LastSeen>, previous: LastSeen = seen()): VisitDelta | null => visitDelta(previous, seen({ savedAt: NOW.toISOString(), savedOn: TODAY, ...overrides }), names);

const entry = (id: string, name: string, xp: number): SkillEntry => ({
	skill: skill({ id, name, unlocked: true, unlockedOn: '2026-10-01' }),
	xp,
	standing: { level: 1, xpIntoLevel: xp, xpToNext: 100, rankIndex: 0 },
	rank: null,
	requirements: [],
	recent: [],
});

describe('lastSeenOf: what the device keeps of the game shown (game-ui S15)', () => {
	it('keeps the total XP and level, the XP of each skill, the completions that stand and when', () => {
		const snapshot: GameSnapshot = {
			status: { kind: 'synced' },
			lastSyncedAt: NOW,
			character: { level: 5, totalXp: 585, xpIntoLevel: 185, xpToNext: 400 },
			skills: [entry('lector', 'Reader', 45), entry('escritor', 'Writer', 10)],
			events: [],
			invalidSkills: [],
			unreadable: [],
			invalidRules: null,
			completedQuests: 14,
		};

		expect(lastSeenOf(snapshot, NOW, TODAY)).toEqual({ savedAt: '2026-11-03T14:00:00.000Z', savedOn: TODAY, level: 5, totalXp: 585, skills: { lector: 45, escritor: 10 }, quests: 14 });
	});

	it('keeps nothing before the game has a character: a record of no game would be a guess', () => {
		const snapshot: GameSnapshot = { status: { kind: 'offline' }, lastSyncedAt: null, character: null, skills: null, events: [], invalidSkills: [], unreadable: [], invalidRules: null };

		expect(lastSeenOf(snapshot, NOW, TODAY)).toBeNull();
	});
});

describe('readLastSeen: the stored record, as written or not at all', () => {
	it('reads back what was written', () => {
		expect(readLastSeen(JSON.parse(JSON.stringify(seen())))).toEqual(seen());
	});

	it('takes anything else for no record, as on a first visit', () => {
		for (const stored of [null, 'x', 3, {}, { ...seen(), totalXp: 'many' }, { ...seen(), skills: { lector: null } }, { ...seen(), savedOn: '2 Nov' }]) {
			expect(readLastSeen(stored)).toBeNull();
		}
	});
});

describe('visitDelta: what changed since the record', () => {
	it('is nothing on the first visit on a device, where there is no record', () => {
		expect(visitDelta(null, seen(), names)).toBeNull();
	});

	it('is nothing when nothing changed, however long ago the record was saved', () => {
		expect(since({})).toBeNull();
		expect(since({}, seen({ savedOn: '2026-10-20' }))).toBeNull();
	});

	it('says whether the level changed', () => {
		expect(since({ totalXp: 600 })?.levelChanged).toBe(false);
		expect(since({ totalXp: 960, level: 6 })?.levelChanged).toBe(true);
	});
});

describe('sinceVisitText: the line under the bar (game-ui S15)', () => {
	it('says the XP, each skill that rose and the quests since yesterday', () => {
		const delta = since({ totalXp: 585, skills: { lector: 45, escritor: 10 }, quests: 14 });

		expect(sinceVisitText(delta!, en)).toBe('+45 XP since yesterday · Reader +15 · 2 quests');
	});

	it('says it in Spanish', () => {
		const delta = since({ totalXp: 585, skills: { lector: 45, escritor: 10 }, quests: 14 });

		expect(sinceVisitText(delta!, es)).toBe('+45 XP desde ayer · Reader +15 · 2 quests');
	});

	it('places the record in time through the clock: earlier today, yesterday or N days', () => {
		const at = (savedOn: string): string => sinceVisitText(since({ totalXp: 550, quests: 13 }, seen({ savedOn }))!, en);

		expect(at(TODAY)).toBe('+10 XP since earlier today · 1 quest');
		expect(at('2026-11-02')).toBe('+10 XP since yesterday · 1 quest');
		expect(at('2026-10-30')).toBe('+10 XP in 4 days · 1 quest');
		expect(sinceVisitText(since({ totalXp: 550, quests: 13 }, seen({ savedOn: '2026-10-30' }))!, es)).toBe('+10 XP en 4 días · 1 quest');
		expect(sinceVisitText(since({ totalXp: 550, quests: 13 }, seen({ savedOn: TODAY }))!, es)).toBe('+10 XP desde más temprano · 1 quest');
		// A record from a later day (the clock went back) reads as today.
		expect(at('2026-11-05')).toBe('+10 XP since earlier today · 1 quest');
	});

	it('lists only the skills that rose, the most first, at most three and then how many more', () => {
		const delta = since({ totalXp: 640, skills: { lector: 50, escritor: 5, atleta: 30, cuidador: 25, orador: 10 }, quests: 15 });

		expect(sinceVisitText(delta!, en)).toBe('+100 XP since yesterday · Athlete +30 · Carer +25 · Reader +20 · and 1 more · 3 quests');
		expect(sinceVisitText(delta!, es)).toBe('+100 XP desde ayer · Athlete +30 · Carer +25 · Reader +20 · y 1 más · 3 quests');
	});

	it('reads a revert honestly, with a minus sign, and lists no skill that fell', () => {
		const delta = since({ totalXp: 530, skills: { lector: 20, escritor: 10 }, quests: 11 });

		expect(sinceVisitText(delta!, en)).toBe('−10 XP since yesterday · −1 quest');
		expect(sinceVisitText(delta!, es)).toBe('−10 XP desde ayer · −1 quest');
	});

	it('leaves the quests out when their count did not change, and says when the XP did not', () => {
		expect(sinceVisitText(since({ totalXp: 555, skills: { lector: 45, escritor: 10 } })!, en)).toBe('+15 XP since yesterday · Reader +15');
		expect(sinceVisitText(since({ quests: 14 })!, en)).toBe('±0 XP since yesterday · 2 quests');
	});
});

describe('heldProgress: where the bar starts while the open sync runs', () => {
	const standing = { level: 5, totalXp: 585, xpIntoLevel: 185, xpToNext: 400 };

	it('is the XP into the level the record had, on the same level', () => {
		expect(heldProgress(seen({ totalXp: 540 }), standing)).toEqual({ percent: 35, fraction: 0.35 });
	});

	it('is nothing without a record or across levels: the ceremony, or nothing, moves the bar then', () => {
		expect(heldProgress(null, standing)).toBeNull();
		expect(heldProgress(seen({ level: 4, totalXp: 380 }), standing)).toBeNull();
	});

	it('stays inside the level', () => {
		expect(heldProgress(seen({ totalXp: 100 }), standing)).toEqual({ percent: 0, fraction: 0 });
		expect(heldProgress(seen({ totalXp: 900 }), standing)).toEqual({ percent: 100, fraction: 1 });
	});
});

describe('visitCardView: the line and the bar of the card', () => {
	const delta = since({ totalXp: 585, quests: 14 })!;
	const held = { percent: 35, fraction: 0.35 };

	it('holds the bar while the sync runs, then lets it catch up after, with the line', () => {
		expect(visitCardView({ delta: null, held, ceremony: null, motion: true }, en)).toEqual({ line: null, parts: [], heldPercent: 35, catchUp: false });
		expect(visitCardView({ delta, held: null, ceremony: null, motion: true }, en)).toEqual({ line: '+45 XP since yesterday · 2 quests', parts: ['+45 XP since yesterday', '2 quests'], heldPercent: null, catchUp: true });
	});

	it('across levels shows the line without animating the bar: the ceremony owns it', () => {
		const levelled = since({ totalXp: 960, level: 6, quests: 14 })!;

		expect(visitCardView({ delta: levelled, held: null, ceremony: null, motion: true }, en)).toMatchObject({ line: '+420 XP since yesterday · 2 quests', heldPercent: null, catchUp: false });
		for (const phase of ['fill', 'medal', 'final'] as const) {
			expect(visitCardView({ delta, held, ceremony: phase, motion: true }, en)).toMatchObject({ line: '+45 XP since yesterday · 2 quests', heldPercent: null, catchUp: false });
		}
	});

	it('under reduced motion shows the final value at once, and still the line', () => {
		expect(visitCardView({ delta: null, held, ceremony: null, motion: false }, en)).toEqual({ line: null, parts: [], heldPercent: null, catchUp: false });
		expect(visitCardView({ delta, held: null, ceremony: null, motion: false }, en)).toMatchObject({ line: '+45 XP since yesterday · 2 quests', heldPercent: null, catchUp: false });
	});
});
