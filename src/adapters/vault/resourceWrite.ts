import type { MarkFinishedFields, ResourceWriteResult } from '../../ports';
import { asRecord, dateOrNull } from './frontmatterFields';

/**
 * "Marcar como leído" on a resource note's frontmatter (ADR-018): `finished`, nothing else.
 * Check-and-set: a note that is not a resource, or that already has a `finished` date, is left as
 * it was. Pure, so it runs inside `processFrontMatter` and in tests alike.
 */
export function markFinishedInFrontmatter(frontmatter: Record<string, unknown>, fields: MarkFinishedFields): Exclude<ResourceWriteResult, 'not-found'> {
	if (frontmatter.type !== 'resource') return 'not-a-resource';
	if (dateOrNull(frontmatter.finished) !== null) return 'already-finished';

	frontmatter.finished = fields.finished;
	return 'done';
}

/** True when the cached frontmatter already shows a `markFinishedInFrontmatter` write. */
export function showsMarkedFinished(cached: unknown, fields: MarkFinishedFields): boolean {
	const frontmatter = asRecord(cached);
	return frontmatter.type === 'resource' && dateOrNull(frontmatter.finished) === fields.finished;
}
