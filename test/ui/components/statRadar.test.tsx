import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Character } from '../../../src/domain';
import { createTranslator } from '../../../src/i18n';
import { StatRadar } from '../../../src/ui/atoms/StatRadar';
import { characterCardView } from '../../../src/ui/presenters/characterCardView';

const css = readFileSync(new URL('../../../styles.css', import.meta.url), 'utf8');
const t = createTranslator('en');
const CHARACTER: Character = {
	name: 'Nicolás',
	title: 'Corredor',
	level: 3,
	totalXp: 600,
	xpIntoLevel: 240,
	xpToNext: 520,
	stats: { fuerza: 3, vitalidad: 6, inteligencia: 4, sabiduria: 1, espiritu: 0, disciplina: 2 },
	gameStart: null,
};
const radar = (stats: Partial<Character['stats']> = {}): string =>
	renderToStaticMarkup(<StatRadar view={characterCardView({ ...CHARACTER, stats: { ...CHARACTER.stats, ...stats } }, t).radar} />);

type Point = readonly [number, number];
const pointsOf = (html: string, className: string): Point[][] =>
	[...html.matchAll(new RegExp(`<polygon class="${className}" points="([^"]+)"`, 'g'))].map((match) => match[1]!.split(' ').map((pair) => pair.split(',').map(Number) as unknown as Point));
const dotsOf = (html: string): Point[] => [...html.matchAll(/<circle class="dromos-radar-dot" cx="([^"]+)" cy="([^"]+)"/g)].map((match) => [Number(match[1]), Number(match[2])]);
const centreOf = (html: string): Point => {
	const axis = /<line class="dromos-radar-axis" x1="([^"]+)" y1="([^"]+)"/.exec(html);
	return [Number(axis?.[1]), Number(axis?.[2])];
};

// S9: a hexagonal radar of the six stats, each tip "STR 3", replacing the dots.
describe('StatRadar draws the six stats as a hexagonal radar (S9)', () => {
	it('is one image named by the six stats and their values', () => {
		const html = radar();

		expect(html).toMatch(/^<svg class="dromos-radar" role="img" aria-label="Strength 3, Vitality 6, Intelligence 4, Wisdom 1, Spirit 0, Discipline 2" viewBox="[^"]+">/);
		expect(html.match(/role="img"/g)).toHaveLength(1);
	});

	it("labels each axis tip with its short label and its number, in the card's order, the full name and value as its tooltip", () => {
		const tips = [...radar().matchAll(/<g class="dromos-radar-tip"><title>([^<]+)<\/title>.*?<text[^>]*><tspan class="dromos-radar-label">(\w+)<\/tspan> <tspan class="dromos-radar-value">(\d+)<\/tspan><\/text><\/g>/g)];

		expect(tips.map((match) => [match[2], match[3], match[1]])).toEqual([
			['STR', '3', 'Strength 3'],
			['VIT', '6', 'Vitality 6'],
			['INT', '4', 'Intelligence 4'],
			['WIS', '1', 'Wisdom 1'],
			['SPI', '0', 'Spirit 0'],
			['DIS', '2', 'Discipline 2'],
		]);
	});

	it('draws six axes and a hexagon ring every two points up to six', () => {
		const html = radar();
		const rings = pointsOf(html, 'dromos-radar-ring');

		expect(html.match(/class="dromos-radar-axis"/g)).toHaveLength(6);
		expect(rings).toHaveLength(3);
		expect(rings.map((ring) => ring.length)).toEqual([6, 6, 6]);
	});

	it('joins the values in one shape with a dot on each axis, a stat at the top of the scale on the outer ring', () => {
		const html = radar();
		const [shape] = pointsOf(html, 'dromos-radar-shape');
		const outer = pointsOf(html, 'dromos-radar-ring').at(-1)!;

		expect(shape).toHaveLength(6);
		expect(shape![1]).toEqual(outer[1]);
		expect(dotsOf(html)).toEqual(shape);
		expect(shape![4]).toEqual(centreOf(html));
	});

	it('adds rings as the scale grows past six, still one every two points', () => {
		const html = radar({ vitalidad: 9 });

		expect(pointsOf(html, 'dromos-radar-ring')).toHaveLength(5);
		expect(html).toContain('<tspan class="dromos-radar-value">9</tspan>');
	});

	it('draws a new character at the centre: the rings, the axes and the labels, the shape collapsed on the centre', () => {
		const html = radar({ fuerza: 0, vitalidad: 0, inteligencia: 0, sabiduria: 0, espiritu: 0, disciplina: 0 });
		const centre = centreOf(html);

		expect(pointsOf(html, 'dromos-radar-ring')).toHaveLength(3);
		expect(html.match(/class="dromos-radar-axis"/g)).toHaveLength(6);
		expect(pointsOf(html, 'dromos-radar-shape')[0]).toEqual(Array.from({ length: 6 }, () => centre));
		expect(dotsOf(html)).toEqual(Array.from({ length: 6 }, () => centre));
		expect(html.match(/<tspan class="dromos-radar-value">0<\/tspan>/g)).toHaveLength(6);
	});

	it('sets its numbers in tabular figures', () => {
		expect(css).toMatch(/\.dromos-radar-value\s*{[^}]*font-variant-numeric:[^;}]*tabular-nums/);
	});
});
