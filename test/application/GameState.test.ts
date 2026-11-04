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
		...overrides,
	};
}

describe('GameState', () => {
	it('shows what a sync recorded as before, and keeps its quest prices, its count of completions and its deeds through later status changes (game-ui S6, S15, S18)', () => {
		const state = new GameState();
		const questPrices = new Map([['a', { xp: 10, skills: [{ id: 'lector', name: 'Lector' }] }]]);
		const deeds = [{ date: '2026-11-02', task: 'Read 20 pages', xp: 10, source: 'complete' as const, skills: [{ id: 'lector', name: 'Lector' }] }];

		state.recordSuccess(result({ questPrices, deeds }), NOW);
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
		});
	});
});
