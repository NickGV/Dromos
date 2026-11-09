import { describe, expect, it } from 'vitest';
import { reflectionText } from '../../../src/adapters/vault/reflectionText';
import { headingsOf } from '../../fakes/noteMetadata';

/** The text of a note, one line per argument. */
const note = (...lines: string[]): string => lines.join('\n');

const FRONTMATTER = ['---', 'type: book', 'title: Klara y el Sol', 'status: completed', '---', ''];
/** The guide callout of `Templates/book.md`, between the title and the first part. */
const CALLOUT = ['> [!tip] La reflexión', '> Al terminar el libro, escribe las cuatro partes.', '> - **De qué trata**: tres líneas, con palabras propias.', ''];

const KLARA = note(
	...FRONTMATTER,
	'# Klara y el Sol',
	'',
	...CALLOUT,
	'## De qué trata',
	'',
	'Una AA que observa a una niña enferma.',
	'',
	'## Qué me quedó',
	'',
	'### Cita',
	'',
	'> "Hay algo muy especial en cada persona."',
	'',
	'- La esperanza como cuidado.',
	'',
	'## Qué cambia en mí',
	'',
	'Mirar con más paciencia.',
	'',
	'## Con qué lo conecto',
	'',
	'- [[Nunca me abandones]]',
	'- [[Esperanza]]',
	'',
);

const textOf = (text: string) => reflectionText(text, headingsOf(text));

describe('reflectionText: the text of each part of the reflection, for the card (S5, S2)', () => {
	it('cuts the four parts, each without its own heading, trimmed', () => {
		expect(textOf(KLARA)).toEqual({
			about: 'Una AA que observa a una niña enferma.',
			kept: '### Cita\n\n> "Hay algo muy especial en cada persona."\n\n- La esperanza como cuidado.',
			changes: 'Mirar con más paciencia.',
			connects: '- [[Nunca me abandones]]\n- [[Esperanza]]',
		});
	});

	it('keeps a `###` inside a part in that part, up to the next heading of its level', () => {
		const text = note('## Qué me quedó', '', 'Antes.', '', '### Cita', '', 'Debajo de la cita.', '', '## Qué cambia en mí', '', 'Otra parte.');

		expect(textOf(text).kept).toBe('Antes.\n\n### Cita\n\nDebajo de la cita.');
	});

	it('ends a part at a heading of a higher level', () => {
		const text = note('## Con qué lo conecto', '', '- [[Esperanza]]', '', '# Apéndice', '', 'Fuera de la reflexión.');

		expect(textOf(text).connects).toBe('- [[Esperanza]]');
	});

	it('gives an empty part as an empty string', () => {
		const text = note('## De qué trata', '', 'Algo.', '', '## Qué me quedó', '', '   ', '', '## Qué cambia en mí', '## Con qué lo conecto', 'Final.');

		expect(textOf(text)).toEqual({ about: 'Algo.', kept: '', changes: '', connects: 'Final.' });
	});

	it('gives a missing heading as an empty string', () => {
		const text = note('## De qué trata', '', 'Algo.', '', '## Con qué lo conecto', '', 'Final.');

		expect(textOf(text)).toEqual({ about: 'Algo.', kept: '', changes: '', connects: 'Final.' });
	});

	it('the template as it comes: the callout before the first heading belongs to no part', () => {
		const template = note(...FRONTMATTER, '# Klara y el Sol', '', ...CALLOUT, '## De qué trata', '', '## Qué me quedó', '', '## Qué cambia en mí', '', '## Con qué lo conecto', '');

		expect(textOf(template)).toEqual({ about: '', kept: '', changes: '', connects: '' });
	});

	it('when a heading appears twice, the first one wins', () => {
		const text = note('## De qué trata', '', 'La primera.', '', '## De qué trata', '', 'La segunda.');

		expect(textOf(text).about).toBe('La primera.');
	});

	it('matches the heading as the seal does: trimmed, in NFC, at any level', () => {
		const text = note('###   De qué trata  ', '', 'Con acento compuesto.');

		expect(textOf(text).about).toBe('Con acento compuesto.');
	});

	it('reads a note saved with Windows line endings the same way', () => {
		expect(textOf(KLARA.replace(/\n/g, '\r\n'))).toEqual(textOf(KLARA));
	});

	it('keeps the indentation of a part\'s first line, trimming only the blank lines around it', () => {
		const text = note('## De qué trata', '', '', '    let quote = true;', '', '');

		expect(textOf(text).about).toBe('    let quote = true;');
	});
});
