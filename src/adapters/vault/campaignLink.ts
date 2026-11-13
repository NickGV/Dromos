import type { LinkResult, RelinkResult } from '../../ports';
import { habiticaIdFrom, isUnsentId } from './habiticaId';

/**
 * Writes `habitica_id` into the first `tasks[]` entry with `taskTitle` that has none
 * (missing, `null` or blank). Check-and-set on a project `index` frontmatter; mutates
 * only that field. Pure, so it runs inside `processFrontMatter` and in tests alike.
 */
export function linkHabiticaIdInFrontmatter(frontmatter: Record<string, unknown>, taskTitle: string, habiticaId: string): LinkResult {
	return linkEntry(frontmatter, 'tasks', taskTitle, habiticaId);
}

/** The same check-and-set for an entry of `habits[]`: the daily a campaign, or an area (ADR-017), asks to build. */
export function linkHabitHabiticaIdInFrontmatter(frontmatter: Record<string, unknown>, habitTitle: string, habiticaId: string): LinkResult {
	return linkEntry(frontmatter, 'habits', habitTitle, habiticaId);
}

/**
 * "Enviar de nuevo" (ADR-021): a compare-and-swap that writes `newId` into the first `tasks[]` entry
 * with `taskTitle` whose `habitica_id` still reads as `oldId`, the id Habitica confirmed deleted.
 * Anything else there (another id, none, the entry or the list gone) is `changed`, and nothing is
 * written. Mutates only that field, through the same `linkEntry` as a first link.
 */
export function relinkHabiticaIdInFrontmatter(frontmatter: Record<string, unknown>, taskTitle: string, oldId: string, newId: string): RelinkResult {
	return relinkEntry(frontmatter, 'tasks', taskTitle, oldId, newId);
}

/** The same compare-and-swap for an entry of `habits[]`, of a project or of an area (ADR-017). */
export function relinkHabitHabiticaIdInFrontmatter(frontmatter: Record<string, unknown>, habitTitle: string, oldId: string, newId: string): RelinkResult {
	return relinkEntry(frontmatter, 'habits', habitTitle, oldId, newId);
}

/** The note types Dromos writes each list in: tasks only in a project `index`, habits there and in an area `archeion` (ADR-017). */
const WRITABLE_TYPES: Readonly<Record<'tasks' | 'habits', readonly unknown[]>> = { tasks: ['index'], habits: ['index', 'archeion'] };

function relinkEntry(frontmatter: Record<string, unknown>, key: 'tasks' | 'habits', title: string, oldId: string, newId: string): RelinkResult {
	// The old id is read as the mapper reads it, so what the screen showed is what gets compared.
	return linkEntry(frontmatter, key, title, newId, (value) => habiticaIdFrom(value) === oldId) === 'linked' ? 'relinked' : 'changed';
}

/**
 * Writes `habiticaId` into the first entry of `key` with `title` whose current `habitica_id`
 * satisfies `replaceable`: by default only an unsent one, so a first link never overwrites an id.
 */
function linkEntry(frontmatter: Record<string, unknown>, key: 'tasks' | 'habits', title: string, habiticaId: string, replaceable: (current: unknown) => boolean = isUnsentId): LinkResult {
	const entries = frontmatter[key];
	if (!WRITABLE_TYPES[key].includes(frontmatter.type) || !Array.isArray(entries)) return 'not-found';

	const matches = (entries as unknown[]).filter(
		(entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null && (entry as Record<string, unknown>).title === title,
	);
	const target = matches.find((entry) => replaceable(entry.habitica_id));
	if (!target) return matches.length > 0 ? 'already-linked' : 'not-found';

	target.habitica_id = habiticaId;
	return 'linked';
}
