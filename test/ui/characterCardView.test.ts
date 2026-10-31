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
	stats: { fuerza: 2, inteligencia: 4, espiritu: 3, disciplina: 5 },
};

const t = createTranslator('es');

describe('characterCardView', () => {
	it('shows the name, the title, the level, the XP into the level and the four stats', () => {
		expect(characterCardView(CHARACTER, t)).toEqual({
			name: 'Nicolás',
			title: 'Corredor',
			levelText: 'Nivel 3',
			xp: { current: 50, total: 150, percent: 33, text: '50 / 150 XP' },
			stats: [
				{ id: 'fuerza', label: 'Fuerza', value: 2 },
				{ id: 'inteligencia', label: 'Inteligencia', value: 4 },
				{ id: 'espiritu', label: 'Espíritu', value: 3 },
				{ id: 'disciplina', label: 'Disciplina', value: 5 },
			],
		});
	});

	it('orders the stats as fuerza, inteligencia, espiritu, disciplina whatever the stored order', () => {
		const stats = { disciplina: 1, espiritu: 2, inteligencia: 3, fuerza: 4 };

		const view = characterCardView({ ...CHARACTER, stats }, t);

		expect(view.stats.map((stat) => stat.id)).toEqual(['fuerza', 'inteligencia', 'espiritu', 'disciplina']);
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
});
