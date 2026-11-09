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
	const parts = REFLECTION_SECTIONS.map(({ id, heading }) => {
		const span = reflectionSpan(headings, heading);
		return [id, span === null ? '' : withoutBlankEdges(lines.slice(span.body, span.end))] as const;
	});
	return Object.fromEntries(parts) as Record<(typeof parts)[number][0], string>;
}

function withoutBlankEdges(lines: readonly string[]): string {
	return lines.join('\n').replace(/^(?:[ \t]*\n)+/, '').trimEnd();
}
