import { describe, expect, it } from 'vitest';
import { characterFromFrontmatter } from '../../../src/adapters/vault/characterMapper';
import type { Character } from '../../../src/domain/character/Character';

const DEFAULT_CHARACTER: Character = {
	name: '',
	title: '',
	level: 1,
	totalXp: 0,
	xpIntoLevel: 0,
	xpToNext: 100,
	stats: { fuerza: 0, inteligencia: 0, espiritu: 0, disciplina: 0 },
};

// Shape of Dromos/Character.md in the Logos vault.
const FULL_NOTE = {
	type: 'dromos-character',
	created: '2026-10-28',
	name: 'Nicolás',
	title: 'Corredor',
	level: 1,
	total_xp: 150,
	xp_to_next: 100,
	stats: { fuerza: 3, inteligencia: 5, espiritu: 1, disciplina: 8 },
	last_sync: null,
	updated_by: 'manual',
};

function numbersOf(character: Character): number[] {
	return [character.level, character.totalXp, character.xpIntoLevel, character.xpToNext, ...Object.values(character.stats)];
}

describe('characterFromFrontmatter: reading the note', () => {
	it('maps a full note', () => {
		expect(characterFromFrontmatter(FULL_NOTE)).toEqual({
			name: 'Nicolás',
			title: 'Corredor',
			level: 2,
			totalXp: 150,
			xpIntoLevel: 50,
			xpToNext: 283,
			stats: { fuerza: 3, inteligencia: 5, espiritu: 1, disciplina: 8 },
		});
	});

	it('derives level and progress from total_xp, ignoring the stored level and xp_to_next', () => {
		const character = characterFromFrontmatter({ ...FULL_NOTE, total_xp: 383, level: 9, xp_to_next: 1 });

		expect(character).toMatchObject({ level: 3, totalXp: 383, xpIntoLevel: 0, xpToNext: 520 });
	});

	it.each([
		[0, 1, 0, 100],
		[99, 1, 99, 100],
		[100, 2, 0, 283],
		[382, 2, 282, 283],
		[383, 3, 0, 520],
	])('total_xp %i is level %i with %i of %i XP', (totalXp, level, xpIntoLevel, xpToNext) => {
		expect(characterFromFrontmatter({ total_xp: totalXp })).toMatchObject({ level, totalXp, xpIntoLevel, xpToNext });
	});
});

describe('characterFromFrontmatter: defaults, never NaN', () => {
	it.each([
		['an empty object', {}],
		['undefined', undefined],
		['null', null],
		['a string', 'name: Nicolás'],
		['an array', [1, 2, 3]],
	])('falls back to every default for %s', (_label, frontmatter) => {
		expect(characterFromFrontmatter(frontmatter)).toEqual(DEFAULT_CHARACTER);
	});

	it('falls back when strings stand in for numbers and numbers for strings', () => {
		const character = characterFromFrontmatter({
			name: 42,
			title: ['Corredor'],
			total_xp: '150',
			stats: { fuerza: '3', inteligencia: 'mucha', espiritu: true, disciplina: null },
		});

		expect(character).toEqual(DEFAULT_CHARACTER);
	});

	it('falls back for negative values', () => {
		const character = characterFromFrontmatter({ total_xp: -40, stats: { ...FULL_NOTE.stats, fuerza: -2 } });

		expect(character).toMatchObject({ level: 1, totalXp: 0, xpIntoLevel: 0, xpToNext: 100 });
		expect(character.stats).toEqual({ fuerza: 0, inteligencia: 5, espiritu: 1, disciplina: 8 });
	});

	it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])('falls back for %s', (bad) => {
		const character = characterFromFrontmatter({
			total_xp: bad,
			stats: { fuerza: bad, inteligencia: bad, espiritu: bad, disciplina: bad },
		});

		expect(character).toEqual(DEFAULT_CHARACTER);
		expect(numbersOf(character).every(Number.isFinite)).toBe(true);
	});

	it('defaults missing stats keys and keeps the present ones', () => {
		const character = characterFromFrontmatter({ ...FULL_NOTE, stats: { fuerza: 4, espiritu: 2 } });

		expect(character.stats).toEqual({ fuerza: 4, inteligencia: 0, espiritu: 2, disciplina: 0 });
	});

	it.each([
		['missing', undefined],
		['null', null],
		['a number', 7],
		['an array', [1, 2, 3, 4]],
	])('defaults every stat when stats is %s', (_label, stats) => {
		expect(characterFromFrontmatter({ ...FULL_NOTE, stats }).stats).toEqual(DEFAULT_CHARACTER.stats);
	});

	it('keeps name and title when only the numbers are broken', () => {
		const character = characterFromFrontmatter({ name: 'Nicolás', title: 'Corredor', total_xp: 'x' });

		expect(character).toEqual({ ...DEFAULT_CHARACTER, name: 'Nicolás', title: 'Corredor' });
	});
});
