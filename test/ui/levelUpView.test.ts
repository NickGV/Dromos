import { describe, expect, it } from 'vitest';
import type { GameEvent } from '../../src/application';
import { createTranslator } from '../../src/i18n';
import { levelUpBannerView, unlockNotices } from '../../src/ui/presenters/levelUpView';

const es = createTranslator('es');
const en = createTranslator('en');

describe('levelUpBannerView', () => {
	it('is null when there is nothing to announce', () => {
		expect(levelUpBannerView([], es)).toBeNull();
	});

	it('announces the level of the character', () => {
		expect(levelUpBannerView([{ kind: 'character-level', level: 3 }], es)).toEqual({ messages: ['Llegaste al nivel 3.'], dismissLabel: 'Cerrar' });
	});

	it('announces an unlocked skill', () => {
		expect(levelUpBannerView([{ kind: 'skill-unlocked', skillId: 'lector', name: 'Lector' }], es)?.messages).toEqual(['Skill desbloqueada: Lector.']);
	});

	it('announces a skill level, and the new rank when it changed', () => {
		const events: GameEvent[] = [
			{ kind: 'skill-level', skillId: 'lector', name: 'Lector', level: 2, rank: 'Hojeador', rankChanged: false },
			{ kind: 'skill-level', skillId: 'lector', name: 'Lector', level: 5, rank: 'Lector constante', rankChanged: true },
		];

		expect(levelUpBannerView(events, es)?.messages).toEqual(['Lector llegó al nivel 2.', 'Lector llegó al nivel 5: nuevo rango, Lector constante.']);
	});

	it('does not name a rank the note does not describe', () => {
		const event: GameEvent = { kind: 'skill-level', skillId: 'lector', name: 'Lector', level: 5, rank: null, rankChanged: true };

		expect(levelUpBannerView([event], es)?.messages).toEqual(['Lector llegó al nivel 5.']);
	});

	it('keeps the order of the events and speaks English when asked', () => {
		const events: GameEvent[] = [
			{ kind: 'character-level', level: 2 },
			{ kind: 'skill-unlocked', skillId: 'lector', name: 'Lector' },
			{ kind: 'skill-level', skillId: 'atleta', name: 'Atleta', level: 5, rank: 'Corredor', rankChanged: true },
		];

		expect(levelUpBannerView(events, en)).toEqual({
			messages: ['You reached level 2.', 'Skill unlocked: Lector.', 'Atleta reached level 5: new rank, Corredor.'],
			dismissLabel: 'Dismiss',
		});
	});
});

describe('unlockNotices: the toast of an unlock (S18)', () => {
	const unlocked: GameEvent = { kind: 'skill-unlocked', skillId: 'lector', name: 'Lector' };

	it('words each unlock, in both languages', () => {
		expect(unlockNotices([unlocked], en)).toEqual(['Skill unlocked: Lector.']);
		expect(unlockNotices([unlocked], es)).toEqual(['Skill desbloqueada: Lector.']);
	});

	it('leaves level-ups to the banner', () => {
		const events: GameEvent[] = [
			{ kind: 'character-level', level: 3 },
			{ kind: 'skill-level', skillId: 'atleta', name: 'Atleta', level: 2, rank: null, rankChanged: false },
			unlocked,
		];

		expect(unlockNotices(events, en)).toEqual(['Skill unlocked: Lector.']);
	});

	it('has nothing to say without an unlock', () => {
		expect(unlockNotices([], en)).toEqual([]);
	});
});
