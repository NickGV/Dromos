import { describe, expect, it } from 'vitest';
import { GameState, type GameResult } from '../../src/application/GameState';

const NOW = new Date('2026-11-03T15:00:00.000Z');

function result(overrides: Partial<GameResult> = {}): GameResult {
	return {
		character: { level: 2, totalXp: 120, xpIntoLevel: 20, xpToNext: 141 },
		skills: [],
		events: [],
		invalidSkills: [{ path: 'Dromos/Skills/bad.md', reason: 'Unknown stat "x".' }],
		unreadable: [],
		invalidRules: null,
		questPrices: new Map(),
		completedQuests: 7,
		deeds: [],
		history: [],
		...overrides,
	};
}

describe('GameState', () => {
	it('shows what a sync recorded as before, and keeps its quest prices, its count of completions, its deeds and its weeks through later status changes (game-ui S6, S15, S18, M9 S1)', () => {
		const state = new GameState();
		const questPrices = new Map([['a', { xp: 10, skills: [{ id: 'lector', name: 'Lector' }] }]]);
		const deeds = [{ date: '2026-11-02', task: 'Read 20 pages', xp: 10, source: 'complete' as const, skills: [{ id: 'lector', name: 'Lector' }] }];
		const zero = { fuerza: 0, vitalidad: 0, inteligencia: 0, sabiduria: 0, espiritu: 0, disciplina: 0 };
		const history = [{ start: '2026-11-02', xp: 10, previousXp: null, days: [10, 0, 0, 0, 0, 0, 0], statXp: { ...zero, sabiduria: 10 }, unskilledXp: 0, deeds }];

		state.recordSuccess(result({ questPrices, deeds, history }), NOW);
		state.setStatus({ kind: 'syncing' });
		state.dismissEvents();

		expect(state.snapshot()).toEqual({
			status: { kind: 'syncing' },
			lastSyncedAt: NOW,
			character: { level: 2, totalXp: 120, xpIntoLevel: 20, xpToNext: 141 },
			skills: [],
			events: [],
			invalidSkills: [{ path: 'Dromos/Skills/bad.md', reason: 'Unknown stat "x".' }],
			unreadable: [],
			invalidRules: null,
			questPrices,
			completedQuests: 7,
			deeds,
			history,
		});
	});
});
