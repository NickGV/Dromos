import { describe, expect, it } from 'vitest';
import { codeSegments, excerptOf, plainText, readingMinutes, shortHash } from '../../src/ui/presenters/briefingText';

// game-ui S13: the folded letter shows a plain-text excerpt and the minutes it takes to read.
describe('plainText', () => {
	it('strips the markdown syntax and keeps the words a reader sees', () => {
		const markdown = [
			'# Shalom, Nicolás',
			'',
			'**La carrera de hoy.** En [[02 - Projects/Dromos/README|Dromos]], `phases` marca *M4* como ~~cerrada~~ ==activa==.',
			'',
			'> [!note] Ojo',
			'> Una [nota](https://example.com) y [[Kairos]]. ![[mapa.png]] ![logo](logo.png) <span>hola</span> %%oculto%%',
			'',
			'- primera',
			'* segunda',
			'1. tercera',
			'- [ ] cuarta',
			'',
			'---',
			'Fin.[^1]',
		].join('\n');

		expect(plainText(markdown)).toBe('Shalom, Nicolás La carrera de hoy. En Dromos, phases marca M4 como cerrada activa. Ojo Una nota y Kairos. hola primera segunda tercera cuarta Fin.');
	});

	it('keeps underscores and asterisks that are part of a word or a sum', () => {
		expect(plainText('snake_case_name and 2 * 3')).toBe('snake_case_name and 2 * 3');
	});
});

describe('excerptOf', () => {
	it('is the plain text of the letter', () => {
		expect(excerptOf('Shalom, Nicolás.\n\nDatos hasta **2026-11-02**.')).toBe('Shalom, Nicolás. Datos hasta 2026-11-02.');
	});

	it('cuts a long letter at a word, with an ellipsis', () => {
		const excerpt = excerptOf(`${'palabra '.repeat(80)}fin`, 40);

		expect(excerpt).toBe('palabra palabra palabra palabra palabra…');
	});

	it('is null when nothing is written', () => {
		expect(excerptOf('')).toBeNull();
		expect(excerptOf('---\n\n![[mapa.png]]')).toBeNull();
	});
});

describe('readingMinutes', () => {
	it('counts 200 words a minute, rounded up, and at least one', () => {
		expect(readingMinutes('')).toBe(1);
		expect(readingMinutes('una')).toBe(1);
		expect(readingMinutes('una '.repeat(200))).toBe(1);
		expect(readingMinutes('una '.repeat(201))).toBe(2);
		expect(readingMinutes('una '.repeat(278))).toBe(2);
	});

	it('counts words, not markdown syntax', () => {
		expect(readingMinutes(`**${'una '.repeat(200)}** [[a|b]] - [ ]`)).toBe(2);
		expect(readingMinutes(`${'una '.repeat(199)} --- > - **`)).toBe(1);
	});
});

// game-ui S14: Esdras writes code in backticks inside the mission's why.
describe('codeSegments', () => {
	it('turns each backtick span into a code segment', () => {
		expect(codeSegments('según `phases` del README y `02-Phases.md`.')).toEqual([
			{ text: 'según ', code: false },
			{ text: 'phases', code: true },
			{ text: ' del README y ', code: false },
			{ text: '02-Phases.md', code: true },
			{ text: '.', code: false },
		]);
	});

	it('takes a double-backtick span with a backtick inside, trimming one space at each end', () => {
		expect(codeSegments('usa `` a`b `` aquí')).toEqual([
			{ text: 'usa ', code: false },
			{ text: 'a`b', code: true },
			{ text: ' aquí', code: false },
		]);
	});

	it('leaves an unmatched backtick and other markup as plain text', () => {
		expect(codeSegments('un ` suelto y <b>negrita</b>')).toEqual([{ text: 'un ` suelto y <b>negrita</b>', code: false }]);
	});
});

// game-ui S13: the read mark holds the letter's date and a short hash of its body.
describe('shortHash', () => {
	it('is eight hex digits, the same for the same text', () => {
		expect(shortHash('Shalom.')).toMatch(/^[0-9a-f]{8}$/);
		expect(shortHash('Shalom.')).toBe(shortHash('Shalom.'));
	});

	it('changes when the text changes', () => {
		expect(shortHash('Shalom.')).not.toBe(shortHash('Shalom!'));
		expect(shortHash('')).not.toBe(shortHash(' '));
	});
});
