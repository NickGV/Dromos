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
		...overrides,
	};
}

describe('GameState', () => {
	it('shows what a sync recorded as before, and keeps its quest prices through later status changes (game-ui S6)', () => {
		const state = new GameState();
		const questPrices = new Map([['a', { xp: 10, skills: [{ id: 'lector', name: 'Lector' }] }]]);

		state.recordSuccess(result({ questPrices }), NOW);
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
		});
	});
});
