import { describe, expect, it } from 'vitest';
import { foldLedger } from '../../../src/domain/ledger/foldLedger';
import { HISTORY_WEEKS, weeklyHistory, type WeekTally } from '../../../src/domain/ledger/weeklyHistory';
import type { SkillXpSource } from '../../../src/domain/ledger/foldLedger';
import { row } from './ledgerFixtures';

/** A Wednesday: its week runs from Monday 9 to Sunday 15 November. */
const TODAY = '2026-11-11';

const SKILLS: SkillXpSource[] = [
	{ id: 'lector', stat: 'sabiduria', unlockedOn: '2026-01-01' },
	{ id: 'escriba', stat: 'inteligencia', unlockedOn: null },
	{ id: 'teologo', stat: 'sabiduria', unlockedOn: '2026-01-01' },
	{ id: 'atleta', stat: 'fuerza', unlockedOn: '2026-01-01' },
];

const ZERO_STATS = { fuerza: 0, vitalidad: 0, inteligencia: 0, sabiduria: 0, espiritu: 0, disciplina: 0 };

const byStart = (weeks: readonly WeekTally[]): Record<string, number> => Object.fromEntries(weeks.map((week) => [week.start, week.xp]));

describe('weeklyHistory (M9 S1): the weeks of the ledger', () => {
	it('runs a week from Monday to Sunday: a deed on Sunday closes one week, a deed on Monday opens the next', () => {
		const weeks = weeklyHistory([row({ habiticaId: 'sunday', date: '2026-11-08', xp: 10 }), row({ habiticaId: 'monday', date: '2026-11-09', xp: 15 })], SKILLS, TODAY);

		expect(weeks.map((week) => week.start)).toEqual(['2026-11-02', '2026-11-09']);
		expect(byStart(weeks)).toEqual({ '2026-11-02': 10, '2026-11-09': 15 });
		expect(weeks[0]?.days).toEqual([0, 0, 0, 0, 0, 0, 10]);
		expect(weeks[1]?.days).toEqual([15, 0, 0, 0, 0, 0, 0]);
	});

	it('counts a deed once, however many skill rows it wrote', () => {
		const rows = ['lector', 'escriba', 'atleta'].map((skill) => row({ habiticaId: 'h1', date: '2026-11-10', skill, xp: 15 }));

		expect(weeklyHistory(rows, SKILLS, TODAY)[0]).toMatchObject({ start: '2026-11-09', xp: 15, days: [0, 15, 0, 0, 0, 0, 0] });
	});

	it('takes a revert and a streak bonus taken back away, and counts a streak bonus', () => {
		const rows = [
			row({ habiticaId: 'read', date: '2026-11-09', xp: 10 }),
			row({ habiticaId: 'read', date: '2026-11-10', xp: -10, source: 'revert' }),
			row({ habiticaId: 'walk', kind: 'daily', skill: null, date: '2026-11-10', xp: 5 }),
			row({ habiticaId: 'walk', kind: 'daily', skill: null, date: '2026-11-10', xp: 7, source: 'streak' }),
			row({ habiticaId: 'walk', kind: 'daily', skill: null, date: '2026-11-11', xp: 5 }),
			row({ habiticaId: 'walk', kind: 'daily', skill: null, date: '2026-11-11', xp: 7, source: 'streak' }),
			row({ habiticaId: 'walk', kind: 'daily', skill: null, date: '2026-11-11', xp: -7, source: 'streak', n: 2 }),
		];

		expect(weeklyHistory(rows, SKILLS, TODAY)[0]).toMatchObject({ xp: 17, days: [10, 2, 5, 0, 0, 0, 0] });
	});

	it('counts a revert in the week it was written, which can leave that week below zero', () => {
		const rows = [row({ habiticaId: 'read', date: '2026-11-06', xp: 20 }), row({ habiticaId: 'read', date: '2026-11-09', xp: -20, source: 'revert' })];

		expect(byStart(weeklyHistory(rows, SKILLS, TODAY))).toEqual({ '2026-11-02': 20, '2026-11-09': -20 });
	});

	it('gives a week without deeds 0, and starts no earlier than the week of the first row', () => {
		const rows = [row({ habiticaId: 'late', date: '2026-11-10' }), row({ habiticaId: 'first', date: '2026-10-21' })];

		expect(byStart(weeklyHistory(rows, SKILLS, TODAY))).toEqual({ '2026-10-19': 10, '2026-10-26': 0, '2026-11-02': 0, '2026-11-09': 10 });
	});

	it('ends with the current week, even when nothing was done in it', () => {
		const weeks = weeklyHistory([row({ date: '2026-10-28' })], SKILLS, TODAY);

		expect(weeks.map((week) => [week.start, week.xp])).toEqual([
			['2026-10-26', 10],
			['2026-11-02', 0],
			['2026-11-09', 0],
		]);
	});

	it('keeps at most the last twelve weeks', () => {
		const rows = Array.from({ length: 20 }, (_, index) => row({ habiticaId: `w${index}`, date: addDays('2026-11-09', -7 * index), xp: index + 1 }));
		const weeks = weeklyHistory(rows, SKILLS, TODAY);

		expect(HISTORY_WEEKS).toBe(12);
		expect(weeks).toHaveLength(12);
		expect(weeks[0]?.start).toBe('2026-08-24');
		expect(weeks[11]?.start).toBe('2026-11-09');
		expect(weeks.map((week) => week.xp)).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
	});

	it('adds up, over the weeks it shows, to the XP the character counts', () => {
		const rows = [
			row({ habiticaId: 'a', date: '2026-09-01', xp: 15, skill: 'lector' }),
			row({ habiticaId: 'a', date: '2026-09-01', xp: 15, skill: 'atleta' }),
			row({ habiticaId: 'b', date: '2026-09-20', xp: 10, skill: null }),
			row({ habiticaId: 'b', date: '2026-09-22', xp: -10, skill: null, source: 'revert' }),
			row({ habiticaId: 'c', kind: 'daily', date: '2026-10-05', xp: 5, skill: null }),
			row({ habiticaId: 'c', kind: 'daily', date: '2026-10-05', xp: 7, skill: null, source: 'streak' }),
			row({ habiticaId: 'd', date: '2026-11-11', xp: 20 }),
		];
		const total = weeklyHistory(rows, SKILLS, TODAY).reduce((sum, week) => sum + week.xp, 0);

		expect(total).toBe(foldLedger(rows, SKILLS).characterXp);
		expect(total).toBe(47);
	});

	it('counts an exact repeat of a row once', () => {
		const once = row({ date: '2026-11-10', xp: 10 });

		expect(weeklyHistory([once, { ...once }], SKILLS, TODAY)[0]?.xp).toBe(10);
	});

	it('has no weeks while the ledger is empty', () => {
		expect(weeklyHistory([], SKILLS, TODAY)).toEqual([]);
	});

	it('skips a row whose date it cannot read', () => {
		expect(byStart(weeklyHistory([row({ date: 'someday' }), row({ habiticaId: 'ok', date: '2026-11-10' })], SKILLS, TODAY))).toEqual({ '2026-11-09': 10 });
	});
});

describe('weeklyHistory (M9 S1): where the XP of a week went', () => {
	it('groups the XP of its skill rows by the stat each skill feeds, and keeps the deeds with no skill apart', () => {
		const rows = [
			row({ habiticaId: 'h1', date: '2026-11-09', skill: 'lector', xp: 15 }),
			row({ habiticaId: 'h1', date: '2026-11-09', skill: 'teologo', xp: 15 }),
			row({ habiticaId: 'h1', date: '2026-11-09', skill: 'atleta', xp: 15 }),
			row({ habiticaId: 'h2', date: '2026-11-10', skill: 'escriba', xp: 10 }),
			row({ habiticaId: 'h3', date: '2026-11-10', skill: null, kind: 'daily', xp: 5 }),
			row({ habiticaId: 'h3', date: '2026-11-10', skill: null, kind: 'daily', xp: 7, source: 'streak' }),
		];
		const [week] = weeklyHistory(rows, SKILLS, TODAY);

		expect(week?.statXp).toEqual({ ...ZERO_STATS, sabiduria: 30, fuerza: 15, inteligencia: 10 });
		expect(week?.unskilledXp).toBe(12);
	});

	it('takes a revert off its stat and off the deeds with no skill', () => {
		const rows = [
			row({ habiticaId: 'h1', date: '2026-11-02', skill: 'lector', xp: 15 }),
			row({ habiticaId: 'h1', date: '2026-11-09', skill: 'lector', xp: -15, source: 'revert' }),
			row({ habiticaId: 'h2', date: '2026-11-09', skill: null, xp: 10 }),
			row({ habiticaId: 'h2', date: '2026-11-10', skill: null, xp: -10, source: 'revert' }),
		];
		const current = weeklyHistory(rows, SKILLS, TODAY)[1];

		expect(current?.statXp).toEqual({ ...ZERO_STATS, sabiduria: -15 });
		expect(current?.unskilledXp).toBe(0);
	});

	it('leaves out of every stat a skill the vault does not know', () => {
		const [week] = weeklyHistory([row({ date: '2026-11-10', skill: 'gone', xp: 10 })], SKILLS, TODAY);

		expect(week).toMatchObject({ xp: 10, statXp: ZERO_STATS, unskilledXp: 0 });
	});
});

describe('weeklyHistory (M9 S1): the deeds of a week and the week before', () => {
	it('lists the deeds of each week newest first, with all their skills, as the chronicle groups them', () => {
		const rows = [
			row({ habiticaId: 'old', task: 'Old', date: '2026-11-05' }),
			row({ habiticaId: 'mon', task: 'Monday', date: '2026-11-09', skill: 'lector', xp: 15 }),
			row({ habiticaId: 'mon', task: 'Monday', date: '2026-11-09', skill: 'atleta', xp: 15 }),
			row({ habiticaId: 'tue', task: 'Tuesday', date: '2026-11-10', skill: null }),
		];
		const weeks = weeklyHistory(rows, SKILLS, TODAY);

		expect(weeks[1]?.deeds).toEqual([
			{ date: '2026-11-10', habiticaId: 'tue', task: 'Tuesday', source: 'complete', xp: 10, skills: [] },
			{ date: '2026-11-09', habiticaId: 'mon', task: 'Monday', source: 'complete', xp: 15, skills: ['lector', 'atleta'] },
		]);
		expect(weeks[0]?.deeds.map((deed) => deed.task)).toEqual(['Old']);
	});

	it('knows the XP of the week before, also before the oldest week shown, and none before the first row', () => {
		const rows = Array.from({ length: 14 }, (_, index) => row({ habiticaId: `w${index}`, date: addDays('2026-11-09', -7 * index), xp: 10 * (index + 1) }));
		const weeks = weeklyHistory(rows, SKILLS, TODAY);
		const fresh = weeklyHistory([row({ date: '2026-11-02', xp: 10 }), row({ habiticaId: 'b', date: '2026-11-10', xp: 30 })], SKILLS, TODAY);

		expect(weeks[0]).toMatchObject({ xp: 120, previousXp: 130 });
		expect(weeks[11]).toMatchObject({ xp: 10, previousXp: 20 });
		expect(fresh.map((week) => week.previousXp)).toEqual([null, 10]);
	});
});

function addDays(date: string, days: number): string {
	return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}
