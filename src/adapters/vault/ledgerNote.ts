import type { LedgerRow, LedgerSource, XpKind } from '../../domain';
import { oneOf } from './frontmatterFields';

/** A row of the table that could not be read: shown in the UI as an unreadable event. */
export interface UnreadableLedgerLine {
	/** 1-based line of the note. */
	readonly line: number;
	readonly text: string;
}

export interface ParsedLedger {
	readonly rows: readonly LedgerRow[];
	readonly unreadable: readonly UnreadableLedgerLine[];
}

const COLUMNS = ['date', 'habitica_id', 'task', 'kind', 'skill', 'xp', 'source', 'n'] as const;
const HEADER = `| ${COLUMNS.join(' | ')} |`;
const SEPARATOR = `|${COLUMNS.map(() => '---').join('|')}|`;
const KINDS: readonly XpKind[] = ['todo', 'daily'];
const SOURCES: readonly LedgerSource[] = ['complete', 'revert', 'streak'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const INTEGER = /^-?\d+$/;
const POSITIVE = /^[1-9]\d*$/;

/** `YYYY-MM` of a `YYYY-MM-DD` date: the ledger keeps one note per month. */
export function ledgerMonthOf(date: string): string {
	return date.slice(0, 7);
}

/** Rows grouped by the month of their date, in order of first appearance. */
export function rowsByMonth(rows: readonly LedgerRow[]): Map<string, LedgerRow[]> {
	const groups = new Map<string, LedgerRow[]>();
	for (const row of rows) {
		const month = ledgerMonthOf(row.date);
		groups.set(month, [...(groups.get(month) ?? []), row]);
	}
	return groups;
}

/**
 * Reads the table of a ledger note. Header, separator, frontmatter and prose are
 * skipped; a row that does not parse is reported with its line and the rest keep
 * being read, so one bad line never hides the others.
 */
export function parseLedgerNote(text: string): ParsedLedger {
	const rows: LedgerRow[] = [];
	const unreadable: UnreadableLedgerLine[] = [];
	const lines = text.split('\n');
	let index = frontmatterEnd(lines);
	for (; index < lines.length; index += 1) {
		const line = (lines[index] ?? '').trim();
		if (!line.startsWith('|') || isHeader(line) || isSeparator(line)) continue;
		const row = rowFrom(cells(line));
		if (row === null) unreadable.push({ line: index + 1, text: line });
		else rows.push(row);
	}
	return { rows, unreadable };
}

/** One table line for a row; a pipe in the title is escaped and a title stays on one line. */
export function formatLedgerRow(row: LedgerRow): string {
	const task = cell(row.task);
	return `| ${row.date} | ${cell(row.habiticaId)} | ${task} | ${row.kind} | ${cell(row.skill ?? '')} | ${row.xp} | ${row.source} | ${row.n} |`;
}

/** One cell on one line, with its pipes escaped. */
function cell(value: string): string {
	return value.replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|').trim();
}

/** The note of one month: frontmatter and an empty table. */
export function newLedgerNote(month: string, created: string): string {
	return `---\ntype: dromos-ledger\ncreated: ${created}\nmonth: ${month}\n---\n\n# Ledger ${month}\n\n${HEADER}\n${SEPARATOR}\n`;
}

/**
 * The note with `rows` added under the last row of its table; everything else is
 * kept as it was. A note that lost its table gets the header again at the end.
 */
export function appendLedgerRows(text: string, rows: readonly LedgerRow[]): string {
	if (rows.length === 0) return text;
	const added = rows.map(formatLedgerRow);
	const lines = text.split('\n');
	const start = frontmatterEnd(lines);
	const lastTableLine = ledgerTableEnd(lines, start);
	if (lastTableLine === -1) return `${text.replace(/\n*$/, '\n')}\n${HEADER}\n${SEPARATOR}\n${added.join('\n')}\n`;
	const before = lines.slice(0, lastTableLine + 1).join('\n');
	const after = lines.slice(lastTableLine + 1).join('\n');
	return `${before}\n${added.join('\n')}\n${after}`;
}

/**
 * Index of the last line of the ledger table: the run of `|` lines that starts at the ledger
 * header. Any other table or pipe line lower in the note is the user's and is not touched.
 * `-1` when the note has no ledger header.
 */
function ledgerTableEnd(lines: readonly string[], start: number): number {
	const header = lines.findIndex((line, index) => index >= start && line.trim().startsWith('|') && isHeader(line.trim()));
	if (header === -1) return -1;
	let end = header;
	while (end + 1 < lines.length && (lines[end + 1] ?? '').trim().startsWith('|')) end += 1;
	return end;
}

/** Index of the first line after the frontmatter, or 0 when there is none. */
function frontmatterEnd(lines: readonly string[]): number {
	if (lines[0]?.trim() !== '---') return 0;
	const close = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
	return close === -1 ? 0 : close + 1;
}

function cells(line: string): string[] {
	const inner = line.replace(/^\|/, '').replace(/\|$/, '');
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

function isHeader(line: string): boolean {
	return cells(line)[0]?.toLowerCase() === 'date';
}

function isSeparator(line: string): boolean {
	return cells(line).every((cell) => /^:?-+:?$/.test(cell));
}

function rowFrom(values: readonly string[]): LedgerRow | null {
	if (values.length !== COLUMNS.length) return null;
	const [date, habiticaId, task, kind, skill, xp, source, n] = values as [string, string, string, string, string, string, string, string];
	const parsedKind = oneOf(KINDS, kind);
	const parsedSource = oneOf(SOURCES, source);
	if (!DATE.test(date) || habiticaId === '' || parsedKind === null || parsedSource === null) return null;
	if (!INTEGER.test(xp) || !POSITIVE.test(n)) return null;
	return { date, habiticaId, task, kind: parsedKind, skill: skill === '' ? null : skill, xp: Number(xp), source: parsedSource, n: Number(n) };
}
