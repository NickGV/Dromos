import { isTitleId, type Title } from '../../domain';
import { findTable } from './markdownTable';
import type { UnreadablePurseRow } from './purseNote';
import { isCalendarDate } from './shopNote';

export interface ParsedTitles {
	readonly titles: readonly Title[];
	readonly unreadable: readonly UnreadablePurseRow[];
}

/** The titles' columns (ADR-020); Esdras may write them in any order. */
const COLUMNS = ['id', 'title', 'feat', 'granted', 'why'] as const;

/**
 * Reads the titles Esdras grants (titles S3, ADR-020), as the Shop's offers are read: the first table
 * of the note with the titles' header, its columns matched by name. A row with a bad `id` (lowercase
 * letters, digits, hyphens), no title, or a `granted` that is not a real `YYYY-MM-DD` day is skipped
 * and reported; with a repeated `id` the first row counts and the later one is reported. An empty
 * feat or why still reads. The other rows still read. Dromos never writes this note.
 */
export function parseTitlesNote(text: string): ParsedTitles {
	const titles: Title[] = [];
	const unreadable: UnreadablePurseRow[] = [];
	const seen = new Set<string>();
	for (const row of findTable(text, COLUMNS)?.rows ?? []) {
		const title = row.cells ? titleFrom(row.cells) : null;
		if (title === null || seen.has(title.id)) {
			unreadable.push({ line: row.line, text: row.text });
			continue;
		}
		seen.add(title.id);
		titles.push(title);
	}
	return { titles, unreadable };
}

function titleFrom(cells: Readonly<Record<string, string>>): Title | null {
	const { id = '', title = '', feat = '', granted = '', why = '' } = cells;
	if (!isTitleId(id) || title === '' || !isCalendarDate(granted)) return null;
	return { id, title, feat: feat === '' ? null : feat, granted, why: why === '' ? null : why };
}
