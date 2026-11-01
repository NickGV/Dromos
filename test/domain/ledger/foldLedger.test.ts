import { describe, expect, it } from 'vitest';
import { foldLedger, type SkillXpSource } from '../../../src/domain/ledger/foldLedger';
import { row } from './ledgerFixtures';

const lector: SkillXpSource = { id: 'lector', stat: 'inteligencia', unlockedOn: '2026-11-01' };
const estudiante: SkillXpSource = { id: 'estudiante', stat: 'inteligencia', unlockedOn: '2026-11-01' };
const atleta: SkillXpSource = { id: 'atleta', stat: 'fuerza', unlockedOn: '2026-11-01' };

describe('foldLedger: character XP', () => {
	it('is the sum of the transitions', () => {
		const rows = [row({ xp: 10 }), row({ habiticaId: 'task-2', xp: 15 })];

		expect(foldLedger(rows, []).characterXp).toBe(25);
	});

	it('counts a quest with several skills once (S13)', () => {
		const rows = [row({ skill: 'atleta' }), row({ skill: 'arbitro' })];

		expect(foldLedger(rows, []).characterXp).toBe(10);
	});

	it('counts a quest without skill', () => {
		expect(foldLedger([row({ skill: null })], []).characterXp).toBe(10);
	});

	it('a revert cancels its complete and a new complete restores it (S9)', () => {
		const rows = [
			row({ source: 'complete', n: 1 }),
			row({ source: 'revert', n: 1, xp: -10, date: '2026-11-04' }),
			row({ source: 'complete', n: 2, date: '2026-11-04' }),
		];

		expect(foldLedger(rows, [lector]).characterXp).toBe(10);
	});

	it('never goes below zero', () => {
		expect(foldLedger([row({ source: 'revert', xp: -10 })], [lector]).characterXp).toBe(0);
	});

	it('counts streak bonuses', () => {
		expect(foldLedger([row({ source: 'streak', xp: 10, n: 1 })], []).characterXp).toBe(10);
	});

	it('counts the daily of two different days as two transitions', () => {
		const rows = [row({ date: '2026-11-02', xp: 5 }), row({ date: '2026-11-03', xp: 5 })];

		expect(foldLedger(rows, []).characterXp).toBe(10);
	});
});

describe('foldLedger: skill XP starts at the unlock (S3)', () => {
	it('a locked skill gets no XP, and the character keeps it', () => {
		const locked = { ...lector, unlockedOn: null };

		const totals = foldLedger([row()], [locked]);

		expect(totals.skillXp).toEqual({ lector: 0 });
		expect(totals.characterXp).toBe(10);
	});

	it('only rows dated after the unlock count', () => {
		const rows = [
			row({ date: '2026-10-31', habiticaId: 'a' }),
			row({ date: '2026-11-01', habiticaId: 'b' }),
			row({ date: '2026-11-02', habiticaId: 'c' }),
		];

		expect(foldLedger(rows, [lector]).skillXp).toEqual({ lector: 10 });
	});

	it('a revert is gated by the date of the complete it cancels, not by its own date', () => {
		const rows = [
			row({ date: '2026-10-30' }),
			row({ date: '2026-11-05', source: 'revert', xp: -10 }),
		];

		const totals = foldLedger(rows, [lector]);

		expect(totals.skillXp).toEqual({ lector: 0 });
		expect(totals.characterXp).toBe(0);
	});

	it('a revert of a complete made after the unlock cancels skill XP', () => {
		const rows = [row({ date: '2026-11-03' }), row({ date: '2026-11-04', source: 'revert', xp: -10 })];

		expect(foldLedger(rows, [lector]).skillXp).toEqual({ lector: 0 });
	});

	it('gives the full XP to each skill of a quest (S13)', () => {
		const rows = [row({ date: '2026-11-03', skill: 'lector' }), row({ date: '2026-11-03', skill: 'estudiante' })];

		expect(foldLedger(rows, [lector, estudiante]).skillXp).toEqual({ lector: 10, estudiante: 10 });
	});

	it('skips skills it does not know and rows without skill', () => {
		const rows = [row({ date: '2026-11-03', skill: 'mystery' }), row({ date: '2026-11-03', habiticaId: 'b', skill: null })];

		expect(foldLedger(rows, [lector]).skillXp).toEqual({ lector: 0 });
	});
});

describe('foldLedger: stats feed on the skills and show their level (S1, 04-Game-Design)', () => {
	it('adds the XP of the skills of the same stat and keeps the others apart', () => {
		const rows = [
			row({ date: '2026-11-03', skill: 'lector', xp: 10 }),
			row({ date: '2026-11-03', habiticaId: 'b', skill: 'estudiante', xp: 15 }),
			row({ date: '2026-11-03', habiticaId: 'c', skill: 'atleta', xp: 5 }),
		];

		expect(foldLedger(rows, [lector, estudiante, atleta]).statXp).toEqual({
			fuerza: 5,
			vitalidad: 0,
			inteligencia: 25,
			sabiduria: 0,
			espiritu: 0,
			disciplina: 0,
		});
	});

	it('shows a stat as the level its XP would have on the skill curve, and 0 without XP', () => {
		const levels = (xp: number) => {
			const rows = [row({ date: '2026-11-03', skill: 'atleta', xp })];
			return foldLedger(rows, [atleta]).stats.fuerza;
		};

		expect(levels(0)).toBe(0);
		expect(levels(5)).toBe(1);
		expect(levels(99)).toBe(1);
		expect(levels(100)).toBe(2);
		expect(levels(346)).toBe(3);
	});

	it('a locked skill adds nothing to its stat', () => {
		const rows = [row({ date: '2026-11-03' })];

		expect(foldLedger(rows, [{ ...lector, unlockedOn: null }]).stats.inteligencia).toBe(0);
	});

	it('dailies without a skill feed disciplina, and their revert takes it back', () => {
		const rows = [
			row({ skill: null, kind: 'daily', habiticaId: 'd1', xp: 5, date: '2026-11-03' }),
			row({ skill: null, kind: 'daily', habiticaId: 'd2', xp: 5, date: '2026-11-03' }),
			row({ skill: null, kind: 'daily', habiticaId: 'd2', xp: -5, source: 'revert', date: '2026-11-03' }),
			row({ skill: null, kind: 'todo', habiticaId: 't1', xp: 50, date: '2026-11-03' }),
		];

		const totals = foldLedger(rows, []);

		expect(totals.statXp.disciplina).toBe(5);
		expect(totals.stats.disciplina).toBe(1);
	});

	it('a daily with a skill does not also feed disciplina', () => {
		const rows = [row({ skill: 'atleta', kind: 'daily', xp: 5, date: '2026-11-03' })];

		expect(foldLedger(rows, [atleta]).statXp.disciplina).toBe(0);
	});
});

describe('foldLedger: an exact duplicate ledger line counts once (unique key)', () => {
	it('does not double the skill XP, the stat XP or the character XP', () => {
		const line = row({ date: '2026-11-03', skill: 'lector', xp: 10 });

		const totals = foldLedger([line, { ...line }], [lector]);

		expect(totals.skillXp).toEqual({ lector: 10 });
		expect(totals.statXp.inteligencia).toBe(10);
		expect(totals.characterXp).toBe(10);
	});

	it('counts the same transition of two skills as two rows', () => {
		const rows = [row({ date: '2026-11-03', skill: 'lector' }), row({ date: '2026-11-03', skill: 'estudiante' })];

		expect(foldLedger(rows, [lector, estudiante]).skillXp).toEqual({ lector: 10, estudiante: 10 });
	});
});
