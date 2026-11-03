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
		// game-ui S3 adds the level number, the small-caps line, the next level and the pips.
		expect(characterCardView(CHARACTER, t)).toEqual({
			name: 'Nicolás',
			title: 'Corredor',
			level: 3,
			levelText: 'Nivel 3',
			titleLine: 'Corredor · nivel 3',
			xp: { current: 50, total: 150, percent: 33, text: '50 / 150 XP' },
			nextLevelText: 'Nivel 4 en 100 XP',
			stats: [
				{ id: 'fuerza', label: 'Fuerza', value: 2, pips: [true, true, false, false, false, false], ariaLabel: 'Fuerza 2' },
				{ id: 'vitalidad', label: 'Vitalidad', value: 6, pips: [true, true, true, true, true, true], ariaLabel: 'Vitalidad 6' },
				{ id: 'inteligencia', label: 'Inteligencia', value: 4, pips: [true, true, true, true, false, false], ariaLabel: 'Inteligencia 4' },
				{ id: 'sabiduria', label: 'Sabiduría', value: 1, pips: [true, false, false, false, false, false], ariaLabel: 'Sabiduría 1' },
				{ id: 'espiritu', label: 'Espíritu', value: 3, pips: [true, true, true, false, false, false], ariaLabel: 'Espíritu 3' },
				{ id: 'disciplina', label: 'Disciplina', value: 5, pips: [true, true, true, true, true, false], ariaLabel: 'Disciplina 5' },
			],
		});
	});

	it('orders the stats as the ADR-014 schema does whatever the stored order', () => {
		const stats = { disciplina: 1, espiritu: 2, sabiduria: 3, inteligencia: 4, vitalidad: 5, fuerza: 6 };

		const view = characterCardView({ ...CHARACTER, stats }, t);

		expect(view.stats.map((stat) => stat.id)).toEqual(['fuerza', 'vitalidad', 'inteligencia', 'sabiduria', 'espiritu', 'disciplina']);
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

	it('draws a stat above six as its number, not as pips (game-ui S3)', () => {
		const view = characterCardView({ ...CHARACTER, stats: { ...CHARACTER.stats, fuerza: 7, vitalidad: 0 } }, t);

		expect(view.stats[0]).toEqual({ id: 'fuerza', label: 'Fuerza', value: 7, pips: null, ariaLabel: 'Fuerza 7' });
		expect(view.stats[1]?.pips).toEqual([false, false, false, false, false, false]);
	});

	it('says how much XP the next level is away, never below zero (game-ui S3)', () => {
		expect(characterCardView(CHARACTER, createTranslator('en')).nextLevelText).toBe('Level 4 in 100 XP');
		expect(characterCardView({ ...CHARACTER, xpIntoLevel: 200 }, t).nextLevelText).toBe('Nivel 4 en 0 XP');
	});

	it('names the level alone under the name when the note has no title', () => {
		expect(characterCardView({ ...CHARACTER, title: '' }, t).titleLine).toBe('Nivel 3');
	});
});
