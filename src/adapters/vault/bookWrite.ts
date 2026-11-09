import type { BookWriteResult, FinishReadingFields, StartReadingFields, StartReadingResult } from '../../ports';
import { asRecord, dateOrNull } from './frontmatterFields';
import { habiticaIdFrom, isUnsentId } from './habiticaId';

/**
 * "Empezar a leer" on a book note's frontmatter: `status: active`, `started` and `habitica_id`.
 * Check-and-set: a note that is not a book, or that holds another `habitica_id`, is left as it
 * was; the same id is kept as the note writes it. Mutates only those three keys. Pure, so it
 * runs inside `processFrontMatter` and in tests alike.
 */
export function startReadingInFrontmatter(frontmatter: Record<string, unknown>, fields: StartReadingFields): StartReadingResult {
	if (frontmatter.type !== 'book') return 'not-a-book';
	const unsent = isUnsentId(frontmatter.habitica_id);
	if (!unsent && habiticaIdFrom(frontmatter.habitica_id) !== fields.habiticaId) return 'already-linked';

	frontmatter.status = 'active';
	frontmatter.started = fields.started;
	if (unsent) frontmatter.habitica_id = fields.habiticaId;
	return 'done';
}

/** "Terminar" on a book note's frontmatter: `status: completed` and `finished`, nothing else. */
export function finishReadingInFrontmatter(frontmatter: Record<string, unknown>, fields: FinishReadingFields): BookWriteResult {
	if (frontmatter.type !== 'book') return 'not-a-book';

	frontmatter.status = 'completed';
	frontmatter.finished = fields.finished;
	return 'done';
}

/** True when the cached frontmatter already shows a `startReadingInFrontmatter` write. */
export function showsStarted(cached: unknown, fields: Pick<StartReadingFields, 'started'>): boolean {
	const frontmatter = asRecord(cached);
	return frontmatter.status === 'active' && dateOrNull(frontmatter.started) === fields.started;
}

/** True when the cached frontmatter already shows a `finishReadingInFrontmatter` write. */
export function showsFinished(cached: unknown, fields: FinishReadingFields): boolean {
	const frontmatter = asRecord(cached);
	return frontmatter.status === 'completed' && dateOrNull(frontmatter.finished) === fields.finished;
}
