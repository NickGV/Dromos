import { compareBySaved, TAKEAWAY_HEADING, type Resource, type ResourceKind } from '../../domain';
import { sectionWritten, type BookNote } from './bookMapper';
import { asRecord, dateOrNull, fileName, nonEmpty } from './frontmatterFields';
import { isTemplatePath } from './templateNote';

/** A resource note as the mapper sees it: the same slice of `CachedMetadata` a book note gives. */
export type ResourceNote = BookNote;

/** The pigeonhole of each `sourceType` the archive files (ADR-018, Q032). */
const KINDS: Readonly<Record<string, ResourceKind>> = { post: 'post', paper: 'paper', video: 'video', podcast: 'podcast', tool: 'tool', course: 'course' };

/** Study guides and reference notes: never in the archive, even with `saved` (Q032). */
const NEVER_ARCHIVED = 'reference';

/**
 * True for a note of the archive (ADR-018): `type: resource` with a readable `saved` date, whose
 * `sourceType` is not `reference`, in any folder but the templates folder. A resource without
 * `saved` stays in the vault as always, out of the archive (Q030).
 */
export function isArchiveNote(note: ResourceNote): boolean {
	const fields = asRecord(note.frontmatter);
	return fields.type === 'resource' && !isTemplatePath(note.path) && dateOrNull(fields.saved) !== null && sourceType(fields.sourceType) !== NEVER_ARCHIVED;
}

/**
 * Maps one note of the archive (check it with `isArchiveNote` first). Missing or wrongly typed
 * fields fall back to `null` or the file name, never a throw; an unknown `sourceType` has no kind.
 */
export function resourceFromNote(note: ResourceNote): Resource {
	const fields = asRecord(note.frontmatter);
	return {
		path: note.path,
		title: trimmed(fields.title) ?? fileName(note.path),
		kind: KINDS[sourceType(fields.sourceType) ?? ''] ?? null,
		author: trimmed(fields.author),
		url: webLink(fields.url),
		why: trimmed(fields.why),
		saved: dateOrNull(fields.saved) ?? '',
		finished: dateOrNull(fields.finished),
		takeawayWritten: sectionWritten(note.headings, note.sections, TAKEAWAY_HEADING),
	};
}

/** The pure core of `list`: the archive's resources among `notes`, the most recently saved first. */
export function buildResources(notes: readonly ResourceNote[]): Resource[] {
	return notes.filter(isArchiveNote).map(resourceFromNote).sort(compareBySaved);
}

function sourceType(value: unknown): string | null {
	return trimmed(value)?.toLowerCase() ?? null;
}

/** An `http` or `https` address, trimmed; anything else (`javascript:`, `obsidian:`, plain text) is `null`. */
function webLink(value: unknown): string | null {
	const text = trimmed(value);
	if (text === null) return null;
	try {
		const { protocol } = new URL(text);
		return protocol === 'http:' || protocol === 'https:' ? text : null;
	} catch {
		return null;
	}
}

function trimmed(value: unknown): string | null {
	return nonEmpty(value)?.trim() ?? null;
}
