import { REFLECTION_SECTIONS } from '../../domain';
import type { ReflectionText } from '../../ports';
import { reflectionSpan, type CachedHeading } from './bookMapper';

/**
 * The text of the four parts of a book's reflection, for the card to show read-only (M7 S5).
 * `text` is the whole note, frontmatter included, as `vault.cachedRead` answers it, and `headings`
 * the metadata cache's for that same text. Each part is cut where `reflectionSpan` cuts it for the
 * seal, so the card shows what the seal counted: its sub-headings and lists come with it, its own
 * heading does not, and whatever comes before the first part (the template's callout) belongs to
 * none. Blank lines around a part are dropped, but not the indentation of its first line, which
 * can be markdown. A missing or empty part is `''`.
 */
export function reflectionText(text: string, headings: readonly CachedHeading[]): ReflectionText {
	const lines = text.split(/\r?\n/);
	const parts = REFLECTION_SECTIONS.map(({ id, heading }) => [id, partText(lines, headings, heading)] as const);
	return Object.fromEntries(parts) as Record<(typeof parts)[number][0], string>;
}

/**
 * The text of the one part headed `expected`, cut as `reflectionText` cuts each part of a book's
 * reflection: used for the takeaway of a resource, `## Lo que me dejó` (ADR-018). `''` when the
 * note has no such heading or nothing under it.
 */
export function sectionText(text: string, headings: readonly CachedHeading[], expected: string): string {
	return partText(text.split(/\r?\n/), headings, expected);
}

function partText(lines: readonly string[], headings: readonly CachedHeading[], expected: string): string {
	const span = reflectionSpan(headings, expected);
	return span === null ? '' : withoutBlankEdges(lines.slice(span.body, span.end));
}

function withoutBlankEdges(lines: readonly string[]): string {
	return lines.join('\n').replace(/^(?:[ \t]*\n)+/, '').trimEnd();
}
