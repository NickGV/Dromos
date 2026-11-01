import { describe, expect, it } from 'vitest';
import { appendLedgerRows, formatLedgerRow, ledgerMonthOf, newLedgerNote, parseLedgerNote, rowsByMonth } from '../../../src/adapters/vault/ledgerNote';
import { row } from '../../domain/ledger/ledgerFixtures';

const NOTE = `---
type: dromos-ledger
month: 2026-11
---

# Ledger 2026-11

| date | habitica_id | task | kind | skill | xp | source | n |
|---|---|---|---|---|---|---|---|
| 2026-11-03 | 3f2a1c8e-0000-4000-8000-000000000001 | Leer cap. 3 de Clean Architecture | todo | lector | 10 | complete | 1 |
| 2026-11-04 | 3f2a1c8e-0000-4000-8000-000000000001 | Leer cap. 3 de Clean Architecture | todo | lector | -10 | revert | 1 |
| 2026-11-03 | 9c1b77d2-0000-4000-8000-000000000002 | Rutina de la mañana | daily |  | 5 | complete | 1 |
`;

describe('parseLedgerNote', () => {
	it('reads the rows of the table and skips the header, the separator and the prose', () => {
		const { rows, unreadable } = parseLedgerNote(NOTE);

		expect(unreadable).toEqual([]);
		expect(rows).toEqual([
			{ date: '2026-11-03', habiticaId: '3f2a1c8e-0000-4000-8000-000000000001', task: 'Leer cap. 3 de Clean Architecture', kind: 'todo', skill: 'lector', xp: 10, source: 'complete', n: 1 },
			{ date: '2026-11-04', habiticaId: '3f2a1c8e-0000-4000-8000-000000000001', task: 'Leer cap. 3 de Clean Architecture', kind: 'todo', skill: 'lector', xp: -10, source: 'revert', n: 1 },
			{ date: '2026-11-03', habiticaId: '9c1b77d2-0000-4000-8000-000000000002', task: 'Rutina de la mañana', kind: 'daily', skill: null, xp: 5, source: 'complete', n: 1 },
		]);
	});

	it('lists a row that does not parse with its line number and keeps reading the rest', () => {
		const text = `${NOTE}| 2026-11-05 | id | broken | todo | lector | ten | complete | 1 |\n| 2026-11-06 | id2 | ok | todo | lector | 10 | complete | 1 |\n`;

		const { rows, unreadable } = parseLedgerNote(text);

		expect(rows).toHaveLength(4);
		expect(unreadable).toEqual([{ line: 13, text: '| 2026-11-05 | id | broken | todo | lector | ten | complete | 1 |' }]);
	});

	it.each([
		['a short row', '| 2026-11-05 | id | task | todo | lector | 10 | complete |'],
		['a bad date', '| 05/11/2026 | id | task | todo | lector | 10 | complete | 1 |'],
		['an empty id', '| 2026-11-05 |  | task | todo | lector | 10 | complete | 1 |'],
		['an unknown kind', '| 2026-11-05 | id | task | habit | lector | 10 | complete | 1 |'],
		['an unknown source', '| 2026-11-05 | id | task | todo | lector | 10 | undo | 1 |'],
		['a fractional xp', '| 2026-11-05 | id | task | todo | lector | 1.5 | complete | 1 |'],
		['a zero n', '| 2026-11-05 | id | task | todo | lector | 10 | complete | 0 |'],
		['a text n', '| 2026-11-05 | id | task | todo | lector | 10 | complete | uno |'],
	])('reports %s as unreadable', (_label, line) => {
		const { rows, unreadable } = parseLedgerNote(`${NOTE}${line}\n`);

		expect(rows).toHaveLength(3);
		expect(unreadable).toHaveLength(1);
	});

	it('does not mistake the frontmatter or a table in another note for rows', () => {
		expect(parseLedgerNote('---\ntype: dromos-ledger\n---\n\nno table here\n')).toEqual({ rows: [], unreadable: [] });
		expect(parseLedgerNote('')).toEqual({ rows: [], unreadable: [] });
	});

	it('reads a title with an escaped pipe and gives it back with the pipe', () => {
		const line = formatLedgerRow(row({ task: 'a | b' }));

		expect(line).toContain('a \\| b');
		expect(parseLedgerNote(`${line}\n`).rows[0]?.task).toBe('a | b');
	});
});

describe('formatLedgerRow', () => {
	it('writes the eight columns in order, an empty cell for no skill', () => {
		expect(formatLedgerRow(row({ skill: null, kind: 'daily', xp: -5, source: 'revert', n: 2 }))).toBe(
			'| 2026-11-03 | task-1 | Read chapter 3 | daily |  | -5 | revert | 2 |',
		);
	});

	it('keeps a title on one line', () => {
		expect(formatLedgerRow(row({ task: 'line one\nline two' }))).toContain('| line one line two |');
	});

	it('round-trips every row', () => {
		const rows = [row(), row({ skill: null, task: 'Mañana | rutina', xp: -10, source: 'revert' }), row({ source: 'streak', n: 3 })];

		expect(parseLedgerNote(rows.map(formatLedgerRow).join('\n')).rows).toEqual(rows);
	});
});

describe('newLedgerNote and appendLedgerRows', () => {
	it('creates the note of a month with its frontmatter and an empty table', () => {
		expect(newLedgerNote('2026-11', '2026-11-03')).toBe(
			`---
type: dromos-ledger
created: 2026-11-03
month: 2026-11
---

# Ledger 2026-11

| date | habitica_id | task | kind | skill | xp | source | n |
|---|---|---|---|---|---|---|---|
`,
		);
	});

	it('appends the rows under the last row of the table and keeps everything else', () => {
		const text = `${NOTE}\nSome note the user wrote below.\n`;

		const result = appendLedgerRows(text, [row({ date: '2026-11-09', habiticaId: 'new' })]);

		const lines = result.split('\n');
		const added = lines.indexOf('| 2026-11-09 | new | Read chapter 3 | todo | lector | 10 | complete | 1 |');
		expect(added).toBe(12);
		expect(lines[added - 1]).toContain('Rutina de la mañana');
		expect(result.endsWith('Some note the user wrote below.\n')).toBe(true);
		expect(parseLedgerNote(result).rows).toHaveLength(4);
	});

	it('appends to a new note and to a note whose table is empty', () => {
		const result = appendLedgerRows(newLedgerNote('2026-11', '2026-11-03'), [row(), row({ skill: 'estudiante' })]);

		expect(parseLedgerNote(result).rows).toHaveLength(2);
	});

	it('adds the header when the note has lost its table', () => {
		const result = appendLedgerRows('---\ntype: dromos-ledger\n---\n\n# Ledger\n', [row()]);

		expect(result).toContain('| date | habitica_id | task | kind | skill | xp | source | n |');
		expect(parseLedgerNote(result).rows).toHaveLength(1);
	});

	it('adds a final newline when the note lacks one and never changes the rows before', () => {
		const before = NOTE.trimEnd();

		const result = appendLedgerRows(before, [row()]);

		expect(result.startsWith(before)).toBe(true);
		expect(result.endsWith('\n')).toBe(true);
	});

	it('appending nothing changes nothing', () => {
		expect(appendLedgerRows(NOTE, [])).toBe(NOTE);
	});
});

describe('months', () => {
	it('names the month of a date', () => {
		expect(ledgerMonthOf('2026-11-03')).toBe('2026-11');
	});

	it('groups rows by the month of their date, keeping order', () => {
		const rows = [row({ date: '2026-11-30', habiticaId: 'a' }), row({ date: '2026-12-01', habiticaId: 'b' }), row({ date: '2026-11-29', habiticaId: 'c' })];

		const groups = rowsByMonth(rows);

		expect([...groups.keys()]).toEqual(['2026-11', '2026-12']);
		expect(groups.get('2026-11')?.map((item) => item.habiticaId)).toEqual(['a', 'c']);
	});
});
