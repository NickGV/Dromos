import type { LinkResult } from '../../ports';
import { isUnsentId } from './habiticaId';

/**
 * Writes `habitica_id` into the first `tasks[]` entry with `taskTitle` that has none
 * (missing, `null` or blank). Check-and-set on a project `index` frontmatter; mutates
 * only that field. Pure, so it runs inside `processFrontMatter` and in tests alike.
 */
export function linkHabiticaIdInFrontmatter(frontmatter: Record<string, unknown>, taskTitle: string, habiticaId: string): LinkResult {
	return linkEntry(frontmatter, 'tasks', taskTitle, habiticaId);
}

/** The same check-and-set for an entry of `habits[]`: the daily a campaign asks to build. */
export function linkHabitHabiticaIdInFrontmatter(frontmatter: Record<string, unknown>, habitTitle: string, habiticaId: string): LinkResult {
	return linkEntry(frontmatter, 'habits', habitTitle, habiticaId);
}

function linkEntry(frontmatter: Record<string, unknown>, key: 'tasks' | 'habits', title: string, habiticaId: string): LinkResult {
	const entries = frontmatter[key];
	if (frontmatter.type !== 'index' || !Array.isArray(entries)) return 'not-found';

	const matches = (entries as unknown[]).filter(
		(entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null && (entry as Record<string, unknown>).title === title,
	);
	const unlinked = matches.find((entry) => isUnsentId(entry.habitica_id));
	if (!unlinked) return matches.length > 0 ? 'already-linked' : 'not-found';

	unlinked.habitica_id = habiticaId;
	return 'linked';
}
