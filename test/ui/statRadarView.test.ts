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

const en = createTranslator('en');
const es = createTranslator('es');
const radarOf = (stats: Partial<Character['stats']>, t = en) => characterCardView({ ...CHARACTER, stats: { ...CHARACTER.stats, ...stats } }, t).radar;
const ZERO = { fuerza: 0, vitalidad: 0, inteligencia: 0, sabiduria: 0, espiritu: 0, disciplina: 0 };

// S9: the six stats as a hexagonal radar in the plaque, each tip "STR 3".
describe('the stats radar of the plaque (S9)', () => {
	it("gives one axis per stat in the card's order, each with its short label, full name, value and text", () => {
		expect(radarOf({}).axes.map((axis) => [axis.id, axis.shortLabel, axis.label, axis.value, axis.text])).toEqual([
			['fuerza', 'STR', 'Strength', 2, 'Strength 2'],
			['vitalidad', 'VIT', 'Vitality', 6, 'Vitality 6'],
			['inteligencia', 'INT', 'Intelligence', 4, 'Intelligence 4'],
			['sabiduria', 'WIS', 'Wisdom', 1, 'Wisdom 1'],
			['espiritu', 'SPI', 'Spirit', 3, 'Spirit 3'],
			['disciplina', 'DIS', 'Discipline', 5, 'Discipline 5'],
		]);
	});

	it('names the axes in Spanish with the short labels of the plaque', () => {
		expect(radarOf({}, es).axes.map((axis) => [axis.shortLabel, axis.text])).toEqual([
			['FUE', 'Fuerza 2'],
			['VIT', 'Vitalidad 6'],
			['INT', 'Inteligencia 4'],
			['SAB', 'Sabiduría 1'],
			['ESP', 'Espíritu 3'],
			['DIS', 'Disciplina 5'],
		]);
	});

	it('keeps the order of the ADR-014 schema whatever the stored order', () => {
		const stats = { disciplina: 1, espiritu: 2, sabiduria: 3, inteligencia: 4, vitalidad: 5, fuerza: 6 };

		expect(characterCardView({ ...CHARACTER, stats }, en).radar.axes.map((axis) => axis.id)).toEqual(['fuerza', 'vitalidad', 'inteligencia', 'sabiduria', 'espiritu', 'disciplina']);
	});

	it('puts the first axis at the top and the others clockwise, one every sixth of a turn', () => {
		const directions = radarOf({}).axes.map((axis) => [axis.x, axis.y]);
		const half = Math.sqrt(3) / 2;
		const expected = [
			[0, -1],
			[half, -0.5],
			[half, 0.5],
			[0, 1],
			[-half, 0.5],
			[-half, -0.5],
		];

		directions.forEach(([x, y], index) => {
			expect(x).toBeCloseTo(expected[index]![0]!, 6);
			expect(y).toBeCloseTo(expected[index]![1]!, 6);
		});
	});

	it('scales up to six, a ring every two points, while no stat passes six', () => {
		const radar = radarOf({});

		expect(radar.max).toBe(6);
		expect(radar.rings).toEqual([2, 4, 6]);
		expect(radar.axes.map((axis) => axis.reach)).toEqual([2 / 6, 1, 4 / 6, 1 / 6, 3 / 6, 5 / 6]);
	});

	it('scales up to the highest stat rounded up to an even number once one passes six, still a ring every two points', () => {
		expect(radarOf({ fuerza: 7 }).max).toBe(8);
		expect(radarOf({ fuerza: 7 }).rings).toEqual([2, 4, 6, 8]);
		expect(radarOf({ fuerza: 7 }).axes.map((axis) => axis.reach)).toEqual([7 / 8, 6 / 8, 4 / 8, 1 / 8, 3 / 8, 5 / 8]);
		expect(radarOf({ espiritu: 8 }).max).toBe(8);
		expect(radarOf({ fuerza: 7, disciplina: 9 }).max).toBe(10);
		expect(radarOf({ fuerza: 7, disciplina: 9 }).rings).toEqual([2, 4, 6, 8, 10]);
	});

	it('draws a new character as it is: every stat at 0 sits at the centre, on the scale up to six', () => {
		const radar = radarOf(ZERO);

		expect(radar.max).toBe(6);
		expect(radar.rings).toEqual([2, 4, 6]);
		expect(radar.axes.map((axis) => [axis.value, axis.reach, axis.text])).toEqual([
			[0, 0, 'Strength 0'],
			[0, 0, 'Vitality 0'],
			[0, 0, 'Intelligence 0'],
			[0, 0, 'Wisdom 0'],
			[0, 0, 'Spirit 0'],
			[0, 0, 'Discipline 0'],
		]);
	});

	it('names the whole chart by the six stats and their values, for screen readers', () => {
		expect(radarOf({}).ariaLabel).toBe('Strength 2, Vitality 6, Intelligence 4, Wisdom 1, Spirit 3, Discipline 5');
		expect(radarOf({ ...ZERO, disciplina: 1 }, es).ariaLabel).toBe('Fuerza 0, Vitalidad 0, Inteligencia 0, Sabiduría 0, Espíritu 0, Disciplina 1');
	});
});
