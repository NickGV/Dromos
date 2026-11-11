/**
 * Markdown tables in notes, read by their header names (M10): the purse Dromos writes and the
 * shop Esdras writes. Cells are trimmed and `\|` reads as a pipe; the separator row and its
 * alignment colons are skipped, so a table the Table Editor plugin re-padded reads the same.
 */

/** One row of a table: its 1-based line, its text, and its cells by header name; `null` cells when the row has more or fewer cells than the header. */
export interface TableRow {
	readonly line: number;
	readonly text: string;
	readonly cells: Readonly<Record<string, string>> | null;
}

/** Where a table sits in a note's lines, 0-based, and its rows. */
export interface FoundTable {
	readonly header: number;
	/** The last line of the table: the run of `|` lines that starts at its header. */
	readonly end: number;
	readonly rows: readonly TableRow[];
}

/**
 * The first table of `text`, after its frontmatter, whose header names every one of `columns`
 * (in any order, with any others), or `null` when the note has none. Other tables are not read.
 */
export function findTable(text: string, columns: readonly string[]): FoundTable | null {
	const lines = text.split('\n');
	for (let index = frontmatterEnd(lines); index < lines.length; index += 1) {
		const line = (lines[index] ?? '').trim();
		if (!line.startsWith('|')) continue;
		const names = splitCells(line).map((cell) => cell.toLowerCase());
		if (!columns.every((column) => names.includes(column))) continue;
		return tableAt(lines, index, names);
	}
	return null;
}

function tableAt(lines: readonly string[], header: number, names: readonly string[]): FoundTable {
	const rows: TableRow[] = [];
	let end = header;
	while (end + 1 < lines.length && (lines[end + 1] ?? '').trim().startsWith('|')) {
		end += 1;
		const text = (lines[end] ?? '').trim();
		const cells = splitCells(text);
		if (isSeparator(cells)) continue;
		rows.push({ line: end + 1, text, cells: cells.length === names.length ? Object.fromEntries(names.map((name, column) => [name, cells[column] ?? ''])) : null });
	}
	return { header, end, rows };
}

/**
 * `text` with `rows` (whole table lines) added under the last line of the table `found` names, or,
 * when the note has no such table, with `header` and the rows at its end. Nothing else changes.
 */
export function appendTableRows(text: string, found: FoundTable | null, header: readonly string[], rows: readonly string[]): string {
	if (rows.length === 0) return text;
	if (found === null) return `${text.replace(/\n*$/, '\n')}\n${headerLines(header)}\n${rows.join('\n')}\n`;
	const lines = text.split('\n');
	return `${lines.slice(0, found.end + 1).join('\n')}\n${rows.join('\n')}\n${lines.slice(found.end + 1).join('\n')}`;
}

/** The header and separator lines of a table with these columns. */
export function headerLines(columns: readonly string[]): string {
	return `| ${columns.join(' | ')} |\n|${columns.map(() => '---').join('|')}|`;
}

/** A table line of these cells, each on one line with its pipes escaped. */
export function tableLine(cells: readonly string[]): string {
	return `| ${cells.map(tableCell).join(' | ')} |`;
}

/** One cell on one line, with its pipes escaped. */
export function tableCell(value: string): string {
	return value.replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|').trim();
}

/** The cells of a table line, trimmed, with `\|` read as a pipe. */
export function splitCells(line: string): string[] {
	const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '');
	return splitOnPipes(inner).map((cell) => cell.trim().replace(/\\\|/g, '|'));
}

/** Splits on each pipe with no backslash right before it. A regex lookbehind would do it, but iOS below 16.4 cannot parse one. */
function splitOnPipes(text: string): string[] {
	const parts: string[] = [];
	let start = 0;
	for (let index = 0; index < text.length; index += 1) {
		if (text[index] === '|' && text[index - 1] !== '\\') {
			parts.push(text.slice(start, index));
			start = index + 1;
		}
	}
	parts.push(text.slice(start));
	return parts;
}

/** A separator row: every cell dashes, with alignment colons at either end. */
export function isSeparator(cells: readonly string[]): boolean {
	return cells.every((cell) => /^:?-+:?$/.test(cell));
}

/** Index of the first line after the frontmatter, or 0 when there is none. */
export function frontmatterEnd(lines: readonly string[]): number {
	if (lines[0]?.trim() !== '---') return 0;
	const close = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
	return close === -1 ? 0 : close + 1;
}
