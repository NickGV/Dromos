import { describe, expect, it } from 'vitest';
import type { Character } from '../../src/domain';
import { createTranslator } from '../../src/i18n';
import { characterCardView } from '../../src/ui/presenters/characterCardView';

const CHARACTER: Character = {
	name: 'Nicolás',
	title: 'Corredor',
	level: 3,
	totalXp: 333,
	xpIntoLevel: 50,
	xpToNext: 150,
	stats: { fuerza: 2, vitalidad: 6, inteligencia: 4, sabiduria: 1, espiritu: 3, disciplina: 5 },
	gameStart: null,
};

const t = createTranslator('es');

describe('characterCardView', () => {
	it('shows the name, the title, the level, the XP into the level and the six stats', () => {
		// game-ui S3 adds the level number, the small-caps line and the next level; S9 the stats radar (statRadarView.test.ts).
		const { radar, ...card } = characterCardView(CHARACTER, t);

		expect(card).toEqual({
			name: 'Nicolás',
			title: 'Corredor',
			level: 3,
			levelText: 'Nivel 3',
			titleLine: 'Corredor · nivel 3',
			titleParts: ['Corredor', 'nivel 3'],
			xp: { current: 50, total: 150, percent: 33, text: '50 / 150 XP' },
			nextLevelText: 'Nivel 4 en 100 XP',
		});
		expect([radar.ariaLabel, radar.max, radar.rings]).toEqual(['Fuerza 2, Vitalidad 6, Inteligencia 4, Sabiduría 1, Espíritu 3, Disciplina 5', 6, [2, 4, 6]]);
	});

	it('hides an empty title and shows a placeholder for an empty name', () => {
		const view = characterCardView({ ...CHARACTER, name: '', title: '' }, t);

		expect(view.name).toBe('Sin nombre');
		expect(view.title).toBeNull();
	});

	it('keeps the XP bar between 0 and 100 percent', () => {
		expect(characterCardView({ ...CHARACTER, xpIntoLevel: 0 }, t).xp.percent).toBe(0);
		expect(characterCardView({ ...CHARACTER, xpIntoLevel: 200 }, t).xp.percent).toBe(100);
		expect(characterCardView({ ...CHARACTER, xpIntoLevel: 10, xpToNext: 0 }, t).xp.percent).toBe(0);
	});

	it('says how much XP the next level is away, never below zero (game-ui S3)', () => {
		expect(characterCardView(CHARACTER, createTranslator('en')).nextLevelText).toBe('Level 4 in 100 XP');
		expect(characterCardView({ ...CHARACTER, xpIntoLevel: 200 }, t).nextLevelText).toBe('Nivel 4 en 0 XP');
	});

	it('names the level alone under the name when the note has no title', () => {
		expect(characterCardView({ ...CHARACTER, title: '' }, t).titleLine).toBe('Nivel 3');
		expect(characterCardView({ ...CHARACTER, title: '' }, t).titleParts).toEqual(['Nivel 3']);
	});

	it('splits the line into the title and the level, the phrases a narrow card may break between (game-ui S14)', () => {
		expect(characterCardView({ ...CHARACTER, title: 'Apprentice scribe', level: 5 }, createTranslator('en')).titleParts).toEqual(['Apprentice scribe', 'level 5']);
	});
});
