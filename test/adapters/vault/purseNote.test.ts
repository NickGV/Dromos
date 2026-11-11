import { describe, expect, it } from 'vitest';
import { appendPurseEntries, newPurseNote, parsePurseNote } from '../../../src/adapters/vault/purseNote';
import type { PurseEntry } from '../../../src/domain';

const coffee: PurseEntry = { date: '2026-11-11', kind: 'purchase', what: 'Coffee | out', gold: -20, level: null, offer: null };
const level3: PurseEntry = { date: '2026-11-11', kind: 'bonus', what: 'Level 3', gold: 30, level: 3, offer: null };
const book: PurseEntry = { date: '2026-11-12', kind: 'purchase', what: 'A book from the list', gold: -75, level: null, offer: 'book-week' };

describe('newPurseNote (M10 S3)', () => {
	it('starts the purse with type dromos-purse and its table', () => {
		expect(newPurseNote('2026-11-11')).toBe('---\ntype: dromos-purse\ncreated: 2026-11-11\n---\n\n# Purse\n\n| date | kind | what | gold | level | offer |\n|---|---|---|---|---|---|\n');
	});
});

describe('appendPurseEntries and parsePurseNote (M10 S3)', () => {
	it('writes one row per entry under the table, a pipe in the text escaped, and reads them back', () => {
		const text = appendPurseEntries(newPurseNote('2026-11-11'), [coffee, level3, book]);

		expect(text.split('\n').slice(-4)).toEqual(['| 2026-11-11 | purchase | Coffee \\| out | -20 |  |  |', '| 2026-11-11 | bonus | Level 3 | 30 | 3 |  |', '| 2026-11-12 | purchase | A book from the list | -75 |  | book-week |', '']);
		expect(parsePurseNote(text)).toEqual({ entries: [coffee, level3, book], unreadable: [] });
	});

	it("keeps everything else in the note as it was, the user's own tables included", () => {
		const note = `${newPurseNote('2026-11-11')}| 2026-11-11 | bonus | Level 3 | 30 | 3 |  |\n\nMy notes.\n\n| mine | table |\n|---|---|\n| a | b |\n`;

		const text = appendPurseEntries(note, [book]);

		expect(text).toContain('| 2026-11-11 | bonus | Level 3 | 30 | 3 |  |\n| 2026-11-12 | purchase | A book from the list | -75 |  | book-week |\n\nMy notes.');
		expect(text).toContain('| mine | table |\n|---|---|\n| a | b |');
		expect(parsePurseNote(text).entries).toEqual([level3, book]);
	});

	it('puts the table back at the end of a note that lost it', () => {
		const text = appendPurseEntries('---\ntype: dromos-purse\n---\n\nJust prose.\n', [level3]);

		expect(text).toBe('---\ntype: dromos-purse\n---\n\nJust prose.\n\n| date | kind | what | gold | level | offer |\n|---|---|---|---|---|---|\n| 2026-11-11 | bonus | Level 3 | 30 | 3 |  |\n');
	});

	it('reads a table the Table Editor re-padded, with alignment colons, by its header names', () => {
		const text = ['| date       | kind     | what    | gold | level | offer |', '|:-----------|:--------:|---------|-----:|-------|-------|', '| 2026-11-11 | bonus    | Level 3 |   30 |     3 |       |'].join('\n');

		expect(parsePurseNote(text)).toEqual({ entries: [level3], unreadable: [] });
	});

	it('reports a row it cannot read with its line, and still reads the others', () => {
		const text = `${newPurseNote('2026-11-11')}| 2026-11-11 | bonus | Level 3 | 30 | 3 |  |\n| someday | gift | Pony | lots |  |  |\n| 2026-11-12 | bonus | Level 4 | 40 |  |  |\n`;

		const parsed = parsePurseNote(text);

		expect(parsed.entries).toEqual([level3]);
		expect(parsed.unreadable).toEqual([
			{ line: 11, text: '| someday | gift | Pony | lots |  |  |' },
			{ line: 12, text: '| 2026-11-12 | bonus | Level 4 | 40 |  |  |' },
		]);
	});
});
