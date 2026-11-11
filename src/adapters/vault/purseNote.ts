import { oneOf } from './frontmatterFields';
import type { PurseEntry, PurseKind } from '../../domain';
import { appendTableRows, findTable, headerLines, tableLine } from './markdownTable';

/** A row of the purse that could not be read, by its 1-based line. */
export interface UnreadablePurseRow {
	readonly line: number;
	readonly text: string;
}

export interface ParsedPurse {
	readonly entries: readonly PurseEntry[];
	readonly unreadable: readonly UnreadablePurseRow[];
}

/** The purse's columns (ADR-019), in the order Dromos writes them. */
const COLUMNS = ['date', 'kind', 'what', 'gold', 'level', 'offer'] as const;
const KINDS: readonly PurseKind[] = ['purchase', 'bonus'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const GOLD = /^-?\d+(?:\.\d+)?$/;
const POSITIVE = /^[1-9]\d*$/;
const OFFER_ID = /^[a-z0-9-]+$/;

/** A new purse (M10 S3): its type, the day it was made, and an empty table. */
export function newPurseNote(created: string): string {
	return `---\ntype: dromos-purse\ncreated: ${created}\n---\n\n# Purse\n\n${headerLines(COLUMNS)}\n`;
}

/**
 * Reads the purse's table, found by its header names. A row that does not parse is reported with
 * its line and the rest are still read; a bonus needs its level, an offer a valid `id`.
 */
export function parsePurseNote(text: string): ParsedPurse {
	const entries: PurseEntry[] = [];
	const unreadable: UnreadablePurseRow[] = [];
	for (const row of findTable(text, COLUMNS)?.rows ?? []) {
		const entry = row.cells ? entryFrom(row.cells) : null;
		if (entry) entries.push(entry);
		else unreadable.push({ line: row.line, text: row.text });
	}
	return { entries, unreadable };
}

/** The note with one row per entry under the purse's table; everything else stays as it was. A note that lost its table gets it back at its end. */
export function appendPurseEntries(text: string, entries: readonly PurseEntry[]): string {
	return appendTableRows(text, findTable(text, COLUMNS), COLUMNS, entries.map(formatPurseEntry));
}

function formatPurseEntry({ date, kind, what, gold, level, offer }: PurseEntry): string {
	return tableLine([date, kind, what, String(gold), level === null ? '' : String(level), offer ?? '']);
}

function entryFrom(cells: Readonly<Record<string, string>>): PurseEntry | null {
	const { date = '', kind = '', what = '', gold = '', level = '', offer = '' } = cells;
	const parsedKind = oneOf(KINDS, kind);
	if (!DATE.test(date) || parsedKind === null || what === '' || !GOLD.test(gold)) return null;
	if (level !== '' && !POSITIVE.test(level)) return null;
	if (offer !== '' && !OFFER_ID.test(offer)) return null;
	if (parsedKind === 'bonus' && level === '') return null;
	return { date, kind: parsedKind, what, gold: Number(gold), level: level === '' ? null : Number(level), offer: offer === '' ? null : offer };
}
