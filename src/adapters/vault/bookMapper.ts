import { compareBooks, REFLECTION_SECTIONS, type Book, type LifecycleStatus, type ReflectionSection } from '../../domain';
import { asRecord, dateOrNull, fileName, nonEmpty, oneOf } from './frontmatterFields';
import { habiticaIdFrom } from './habiticaId';
import { isTemplatePath } from './templateNote';

/** Where a block starts, as the metadata cache records it; only the line is read. */
interface CachedPosition {
	readonly start: { readonly line: number };
}

/** A heading as the metadata cache records it: its text, its level (1 for `#`) and its first and last line. */
export type CachedHeading = {
	readonly heading: string;
	readonly level: number;
	readonly position: CachedPosition & { readonly end: { readonly line: number } };
};
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

/** True for a `type: book` note in any folder but the templates folder (ADR-016). */
export function isBookNote(note: BookNote): boolean {
	return asRecord(note.frontmatter).type === 'book' && !isTemplatePath(note.path);
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
 * never read as text (Q026). A section is written when a content block starts inside its
 * part (see `reflectionSpan`), sub-headings included; a missing heading is not written.
 */
export function reflectionFrom(headings: readonly CachedHeading[], sections: readonly CachedSection[]): ReflectionSection[] {
	return REFLECTION_SECTIONS.map((section) => {
		const span = reflectionSpan(headings, section.heading);
		if (span === null) return { ...section, written: false };
		const written = sections.some((entry) => CONTENT_TYPES.has(entry.type) && entry.position.start.line > span.heading && entry.position.start.line < span.end);
		return { ...section, written };
	});
}

/** Where one part of the reflection sits in a note, in the cache's line numbers (0-based). */
export interface ReflectionSpan {
	/** The first line of the part's own heading. */
	readonly heading: number;
	/** The first line after that heading, where the part's text starts. */
	readonly body: number;
	/** The line of the heading that ends the part, itself outside it; `Infinity` when the part runs to the end of the note. */
	readonly end: number;
}

/**
 * Where the part headed `expected` sits: from its heading to the next heading whose level is the
 * same or higher (a level number no greater than its own), or the end of the note, so its
 * sub-headings belong to it. The heading matches by trimmed text in NFC at any level, and the
 * first one wins. `null` when the note has no such heading. Both the seal (`reflectionFrom`) and
 * the text the card shows (`reflectionText`) cut the parts here.
 */
export function reflectionSpan(headings: readonly CachedHeading[], expected: string): ReflectionSpan | null {
	const index = headings.findIndex((entry) => sameHeading(entry.heading, expected));
	const own = headings[index];
	if (own === undefined) return null;
	const next = headings.slice(index + 1).find((entry) => entry.level <= own.level);
	return { heading: own.position.start.line, body: own.position.end.line + 1, end: next?.position.start.line ?? Number.POSITIVE_INFINITY };
}

/** NFC on both sides, so an accent typed as two characters still matches the template's heading. */
function sameHeading(text: string, expected: string): boolean {
	return text.trim().normalize('NFC') === expected.normalize('NFC');
}

function trimmed(value: unknown): string | null {
	return nonEmpty(value)?.trim() ?? null;
}
