import { compareBooks, REFLECTION_SECTIONS, type Book, type LifecycleStatus, type ReflectionSection } from '../../domain';
import { asRecord, dateOrNull, fileName, nonEmpty, oneOf } from './frontmatterFields';
import { habiticaIdFrom } from './habiticaId';

/** Where a block starts, as the metadata cache records it; only the line is read. */
interface CachedPosition {
	readonly start: { readonly line: number };
}

type CachedHeading = { readonly heading: string; readonly position: CachedPosition };
type CachedSection = { readonly type: string; readonly position: CachedPosition };

/** A book note as the mapper sees it: the parts of `CachedMetadata` it reads, no `obsidian` types. */
export interface BookNote {
	/** Vault-relative path. */
	readonly path: string;
	/** Parsed frontmatter, or `undefined` when the note has none. */
	readonly frontmatter: unknown;
	/** The cache's `headings`, in document order. */
	readonly headings: readonly CachedHeading[];
	/** The cache's `sections`, in document order. */
	readonly sections: readonly CachedSection[];
}

const STATUSES: readonly LifecycleStatus[] = ['planning', 'active', 'paused', 'completed', 'archived'];
/**
 * A missing or unknown `status` reads as pending: a broken book must never be offered "Terminar"
 * without having been started. Campaigns differ: a note with an odd `status` is not listed at all.
 */
const DEFAULT_STATUS: LifecycleStatus = 'planning';
/**
 * Section types that count as text under a reflection heading. Comments, rules and the
 * frontmatter do not, and neither does a type Obsidian adds later until it is listed here.
 */
const CONTENT_TYPES: ReadonlySet<string> = new Set(['paragraph', 'list', 'blockquote', 'callout', 'table', 'code', 'math', 'html', 'element']);

/** True for a `type: book` note, whatever its folder (ADR-016). */
export function isBookNote(note: BookNote): boolean {
	return asRecord(note.frontmatter).type === 'book';
}

/** Maps one book note. Missing or wrongly typed fields fall back to defaults, never `NaN` and never a throw. */
export function bookFromNote(note: BookNote): Book {
	const fields = asRecord(note.frontmatter);
	return {
		path: note.path,
		title: trimmed(fields.title) ?? fileName(note.path),
		author: trimmed(fields.author),
		shelf: trimmed(fields.shelf),
		status: oneOf(STATUSES, fields.status) ?? DEFAULT_STATUS,
		started: dateOrNull(fields.started),
		finished: dateOrNull(fields.finished),
		habiticaId: habiticaIdFrom(fields.habitica_id),
		reflection: reflectionFrom(note.headings, note.sections),
	};
}

/** The pure core of `list`: the books of `notes`, sorted by title then path. */
export function buildBooks(notes: readonly BookNote[]): Book[] {
	return notes
		.filter(isBookNote)
		.map(bookFromNote)
		.sort(compareBooks);
}

/**
 * The four reflection sections, from the cache's headings and sections only: the body is
 * never read as text (Q026). A section is written when a content block starts between its
 * heading and the next heading of any level. Its heading matches by trimmed text at any
 * level, the first one wins, and a missing heading is not written.
 */
export function reflectionFrom(headings: readonly CachedHeading[], sections: readonly CachedSection[]): ReflectionSection[] {
	return REFLECTION_SECTIONS.map((section) => {
		const start = headings.find((entry) => sameHeading(entry.heading, section.heading))?.position.start.line;
		if (start === undefined) return { ...section, written: false };
		const end = headings.find((entry) => entry.position.start.line > start)?.position.start.line ?? Number.POSITIVE_INFINITY;
		const written = sections.some((entry) => CONTENT_TYPES.has(entry.type) && entry.position.start.line > start && entry.position.start.line < end);
		return { ...section, written };
	});
}

/** NFC on both sides, so an accent typed as two characters still matches the template's heading. */
function sameHeading(text: string, expected: string): boolean {
	return text.trim().normalize('NFC') === expected.normalize('NFC');
}

function trimmed(value: unknown): string | null {
	return nonEmpty(value)?.trim() ?? null;
}
