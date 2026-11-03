import { describe, expect, it } from 'vitest';
import { recentDeeds, recentRowsBySkill } from '../../../src/domain/ledger/recentRows';
import { row } from './ledgerFixtures';

describe('recentDeeds (game-ui S18)', () => {
	it('groups the rows of one task transition into one deed with all its skills, in the order written, and its XP once', () => {
		const rows = [
			row({ habiticaId: 'h1', task: 'Write the chapter', skill: 'lector', xp: 15 }),
			row({ habiticaId: 'h1', task: 'Write the chapter', skill: 'escriba', xp: 15 }),
			row({ habiticaId: 'h1', task: 'Write the chapter', skill: 'cuidador', xp: 15 }),
		];

		expect(recentDeeds(rows, 5)).toEqual([{ date: '2026-11-03', habiticaId: 'h1', task: 'Write the chapter', source: 'complete', xp: 15, skills: ['lector', 'escriba', 'cuidador'] }]);
	});

	it('keeps apart what differs in date, task, source or sequence number', () => {
		const rows = [
			row({ habiticaId: 'h1', n: 1 }),
			row({ habiticaId: 'h1', n: 1, source: 'revert', xp: -10 }),
			row({ habiticaId: 'h1', n: 2 }),
			row({ habiticaId: 'h2', n: 1 }),
			row({ habiticaId: 'h2', n: 1, date: '2026-11-02' }),
		];

		expect(recentDeeds(rows, 10).map((deed) => [deed.habiticaId, deed.source, deed.xp, deed.date])).toEqual([
			['h2', 'complete', 10, '2026-11-03'],
			['h1', 'complete', 10, '2026-11-03'],
			['h1', 'revert', -10, '2026-11-03'],
			['h1', 'complete', 10, '2026-11-03'],
			['h2', 'complete', 10, '2026-11-02'],
		]);
	});

	it('lists them newest first: by date, and within a day the one written later first, as the recent entries of a skill', () => {
		const rows = [
			row({ habiticaId: 'old', date: '2026-10-30' }),
			row({ habiticaId: 'morning', date: '2026-11-03' }),
			row({ habiticaId: 'yesterday', date: '2026-11-02' }),
			row({ habiticaId: 'evening', date: '2026-11-03' }),
		];

		expect(recentDeeds(rows, 5).map((deed) => deed.habiticaId)).toEqual(['evening', 'morning', 'yesterday', 'old']);
		expect([...(recentRowsBySkill(rows, 5).get('lector') ?? [])].map((paid) => paid.habiticaId)).toEqual(['evening', 'morning', 'yesterday', 'old']);
	});

	it('counts an exact repeat of a row once, so a copied line neither doubles a skill nor adds a deed', () => {
		const once = row({ habiticaId: 'h1', skill: 'lector' });
		const rows = [once, row({ habiticaId: 'h1', skill: 'escriba' }), { ...once }, row({ habiticaId: 'h2', date: '2026-11-01' })];

		expect(recentDeeds(rows, 5)).toEqual([
			{ date: '2026-11-03', habiticaId: 'h1', task: 'Read chapter 3', source: 'complete', xp: 10, skills: ['lector', 'escriba'] },
			{ date: '2026-11-01', habiticaId: 'h2', task: 'Read chapter 3', source: 'complete', xp: 10, skills: ['lector'] },
		]);
	});

	it('keeps the last `limit` deeds, each whole', () => {
		const rows = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].flatMap((id, index) => [
			row({ habiticaId: id, date: `2026-10-2${index}`, skill: 'lector' }),
			row({ habiticaId: id, date: `2026-10-2${index}`, skill: 'escriba' }),
		]);

		const deeds = recentDeeds(rows, 5);

		expect(deeds.map((deed) => deed.habiticaId)).toEqual(['g', 'f', 'e', 'd', 'c']);
		expect(deeds.every((deed) => deed.skills.length === 2)).toBe(true);
	});

	it('gives a task without skill a deed with no skills, and a streak bonus and a revert deeds of their own', () => {
		const rows = [
			row({ habiticaId: 'plain', task: 'Stretch', kind: 'daily', skill: null, xp: 10 }),
			row({ habiticaId: 'plain', task: 'Stretch', kind: 'daily', skill: null, xp: 5, source: 'streak' }),
			row({ habiticaId: 'read', task: 'Read 20 pages', xp: -10, source: 'revert' }),
		];

		expect(recentDeeds(rows, 5)).toEqual([
			{ date: '2026-11-03', habiticaId: 'read', task: 'Read 20 pages', source: 'revert', xp: -10, skills: ['lector'] },
			{ date: '2026-11-03', habiticaId: 'plain', task: 'Stretch', source: 'streak', xp: 5, skills: [] },
			{ date: '2026-11-03', habiticaId: 'plain', task: 'Stretch', source: 'complete', xp: 10, skills: [] },
		]);
	});

	it('has none for an empty ledger or a limit of zero', () => {
		expect(recentDeeds([], 5)).toEqual([]);
		expect(recentDeeds([row()], 0)).toEqual([]);
	});
});
