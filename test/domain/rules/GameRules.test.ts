import { describe, expect, it } from 'vitest';
import { characterFromFrontmatter } from '../../../src/adapters/vault/characterMapper';
import { DEFAULT_STAGE_RULES } from '../../../src/domain/character/stageRules';
import { foldLedger } from '../../../src/domain/ledger/foldLedger';
import { nextRows, type TaskObservation } from '../../../src/domain/ledger/nextRows';
import { rowsToAppend } from '../../../src/domain/ledger/planRows';
import { streakRows } from '../../../src/domain/ledger/streakRows';
import { DEFAULT_RULES, type GameRules } from '../../../src/domain/rules/GameRules';
import { CHARACTER_CURVE, SKILL_CURVE } from '../../../src/domain/rules/LevelCurve';
import { RANK_LEVELS, rankIndexFor } from '../../../src/domain/rules/Ranks';
import { XP_TABLE } from '../../../src/domain/rules/XpRules';
import { skillStanding } from '../../../src/domain/skill/standing';
import { row } from '../ledger/ledgerFixtures';

const RULES: GameRules = {
	xp: {
		todo: { trivial: 1, easy: 2, medium: 3, hard: 4 },
		daily: { trivial: 6, easy: 7, medium: 8, hard: 9 },
		streakBonus: { every: 3, xp: 50 },
	},
	characterCurve: { base: 10, exponent: 1 },
	skillCurve: { base: 20, exponent: 1 },
	rankLevels: [1, 2, 3, 4, 5],
	goldPerLevel: 10,
	stages: DEFAULT_STAGE_RULES,
};

function observation(overrides: Partial<TaskObservation> = {}): TaskObservation {
	return { habiticaId: 'task-1', title: 'Read chapter 3', kind: 'todo', priority: 1, skills: ['lector'], completed: true, date: '2026-11-03', ...overrides };
}

describe('DEFAULT_RULES: what rules the game with no Rules.md (S16)', () => {
	it('are the values of 04-Game-Design', () => {
		expect(DEFAULT_RULES).toEqual({ xp: XP_TABLE, characterCurve: CHARACTER_CURVE, skillCurve: SKILL_CURVE, rankLevels: RANK_LEVELS, goldPerLevel: 10, stages: DEFAULT_STAGE_RULES });
	});
});

describe('the rules reach every rule of the game (S16)', () => {
	it('a new to-do row is worth what the rules say', () => {
		expect(nextRows([], observation(), RULES.xp)).toEqual([row({ xp: 2, source: 'complete', n: 1 })]);
	});

	it('a new daily row is worth what the rules say', () => {
		expect(nextRows([], observation({ kind: 'daily', priority: 2 }), RULES.xp)[0]?.xp).toBe(9);
	});

	it('a revert cancels what was paid, not what the task is worth now', () => {
		const paid = row({ xp: 10, source: 'complete', n: 1 });

		expect(nextRows([paid], observation({ completed: false }), RULES.xp)).toEqual([row({ xp: -10, source: 'revert', n: 1 })]);
	});

	it('the streak bonus follows the rules: its period and its XP', () => {
		const daily = (streak: number) => observation({ kind: 'daily', streak });

		expect(streakRows([], daily(3), RULES.xp).map((paid) => paid.xp)).toEqual([50]);
		expect(streakRows([], daily(7), RULES.xp)).toEqual([]);
	});

	it('the plan of a sync uses the rules', () => {
		const planned = rowsToAppend([], [observation({ priority: 2 })], '2026-11-01', RULES.xp);

		expect(planned.map((paid) => paid.xp)).toEqual([4]);
	});

	it('a stat shows its level on the skill curve of the rules', () => {
		const lector = { id: 'lector', stat: 'inteligencia' as const, unlockedOn: '2026-11-01' };
		const rows = [row({ xp: 40 })];

		expect(foldLedger(rows, [lector], RULES).stats.inteligencia).toBe(2);
		expect(foldLedger(rows, [lector]).stats.inteligencia).toBe(1);
	});

	it('a skill follows the skill curve and the rank levels of the rules', () => {
		expect(skillStanding(true, 40, RULES)).toEqual({ level: 2, xpIntoLevel: 20, xpToNext: 40, rankIndex: 1 });
	});

	it('the rank levels can move, and the defaults do not', () => {
		expect(rankIndexFor(3, RULES.rankLevels)).toBe(2);
		expect(rankIndexFor(3)).toBe(0);
		expect(rankIndexFor(1, [2, 4, 6, 8, 10])).toBeNull();
	});

	it('the character note derives its level from the curve of the rules', () => {
		expect(characterFromFrontmatter({ total_xp: 30 }, RULES.characterCurve)).toMatchObject({ level: 3, xpIntoLevel: 0, xpToNext: 30 });
	});
});
