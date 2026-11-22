import { describe, expect, it } from 'vitest';
import { appendLedgerRows, formatLedgerRow, ledgerMonthOf, newLedgerNote, parseLedgerNote, rowsByMonth } from '../../../src/adapters/vault/ledgerNote';
import { uniqueRows } from '../../../src/domain/ledger/foldLedger';
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

	it('escapes a pipe in the skill and in the id too', () => {
		const line = formatLedgerRow(row({ skill: 'a|b', habiticaId: 'x|y' }));

		expect(parseLedgerNote(`${line}\n`).rows[0]).toMatchObject({ skill: 'a|b', habiticaId: 'x|y' });
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

	it('appends under the ledger table, not under another table or pipe line lower in the note', () => {
		const text = `${NOTE}\nMy own notes:\n\n| thing | value |\n|---|---|\n| a | b |\n`;

		const result = appendLedgerRows(text, [row({ habiticaId: 'new' })]);

		const lines = result.split('\n');
		expect(lines.indexOf('| 2026-11-03 | new | Read chapter 3 | todo | lector | 10 | complete | 1 |')).toBe(12);
		expect(lines).toContain('| a | b |');
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

describe('appendLedgerRows drops exact repeats (ledger-repeats)', () => {
	const READ = '| 2026-11-03 | 3f2a1c8e-0000-4000-8000-000000000001 | Leer cap. 3 de Clean Architecture | todo | lector | 10 | complete | 1 |';
	const REVERT = '| 2026-11-04 | 3f2a1c8e-0000-4000-8000-000000000001 | Leer cap. 3 de Clean Architecture | todo | lector | -10 | revert | 1 |';
	const ROUTINE = '| 2026-11-03 | 9c1b77d2-0000-4000-8000-000000000002 | Rutina de la mañana | daily |  | 5 | complete | 1 |';
	const NEW = '| 2026-11-09 | new | Read chapter 3 | todo | lector | 10 | complete | 1 |';
	const head = (rows: readonly string[], below = '') =>
		`---\ntype: dromos-ledger\nmonth: 2026-11\n---\n\n# Ledger 2026-11\n\n| date | habitica_id | task | kind | skill | xp | source | n |\n|---|---|---|---|---|---|---|---|\n${rows.join('\n')}\n${below}`;

	it('S1: keeps the first copy where it is and drops the later ones', () => {
		const text = head([READ, REVERT, READ, ROUTINE, REVERT, READ], '\nSome note the user wrote below.\n');

		const result = appendLedgerRows(text, [row({ date: '2026-11-09', habiticaId: 'new' })]);

		expect(result).toBe(head([READ, REVERT, ROUTINE, NEW], '\nSome note the user wrote below.\n'));
	});

	it('S1: spaces around a cell do not make a different row, and the first copy keeps its own spacing', () => {
		const padded = '| 2026-11-03 | 3f2a1c8e-0000-4000-8000-000000000001 | Leer cap. 3 de Clean Architecture | todo  | lector | 10  | complete | 1   |';

		expect(appendLedgerRows(head([padded, ROUTINE, READ]), [row({ date: '2026-11-09', habiticaId: 'new' })])).toBe(head([padded, ROUTINE, NEW]));
		expect(appendLedgerRows(head([READ, ROUTINE, padded]), [row({ date: '2026-11-09', habiticaId: 'new' })])).toBe(head([READ, ROUTINE, NEW]));
	});

	it('S1: a written row that repeats one already in the table is not added twice', () => {
		const result = appendLedgerRows(head([READ, ROUTINE]), [row({ habiticaId: '3f2a1c8e-0000-4000-8000-000000000001', task: 'Leer cap. 3 de Clean Architecture' })]);

		expect(result).toBe(head([READ, ROUTINE]));
	});

	it('S2: rows that differ in any cell all stay', () => {
		const renamed = READ.replace('Leer cap. 3 de Clean Architecture', 'Leer capítulo 3');
		const otherXp = READ.replace('| 10 |', '| 15 |');
		const secondTime = READ.replace('| complete | 1 |', '| complete | 2 |');
		const text = head([READ, renamed, otherXp, secondTime]);

		const result = appendLedgerRows(text, [row({ date: '2026-11-09', habiticaId: 'new' })]);

		expect(result).toBe(head([READ, renamed, otherXp, secondTime, NEW]));
	});

	it('S2: a repeated line that does not parse stays, and so do repeats in another table', () => {
		const broken = '| 2026-11-03 | 3f2a1c8e | Something | weekly |  | 5 | complete | 1 |';
		const mine = '\nMy own notes:\n\n| thing | value |\n|---|---|\n| a | b |\n| a | b |\n';
		const text = head([READ, broken, broken], mine);

		const result = appendLedgerRows(text, [row({ date: '2026-11-09', habiticaId: 'new' })]);

		expect(result).toBe(head([READ, broken, broken, NEW], mine));
		expect(parseLedgerNote(result).unreadable.filter((line) => line.text === broken)).toHaveLength(2);
	});

	it('S2: a note with no repeats gets exactly the append it got before', () => {
		const text = `${NOTE}\nSome note the user wrote below.\n`;

		const result = appendLedgerRows(text, [row({ date: '2026-11-09', habiticaId: 'new' })]);

		expect(result).toBe(`${NOTE.trimEnd()}\n${NEW}\n\nSome note the user wrote below.\n`);
	});

	it('S3: the rows Dromos reads after the write are the unique rows it read before, plus the new one', () => {
		const text = head([READ, REVERT, READ, ROUTINE, REVERT, ROUTINE, READ]);
		const added = row({ date: '2026-11-09', habiticaId: 'new' });

		const result = appendLedgerRows(text, [added]);

		expect(parseLedgerNote(result).rows).toEqual([...uniqueRows(parseLedgerNote(text).rows), added]);
	});

	it('S4: writing nothing leaves the repeats in place', () => {
		const text = head([READ, ROUTINE, READ]);

		expect(appendLedgerRows(text, [])).toBe(text);
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
