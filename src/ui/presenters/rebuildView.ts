import type { RebuildOutcome } from '../../application';
import { plural, type Translator } from '../../i18n';

/** What the rebuild command answers (S17). */
export function rebuildMessage(outcome: RebuildOutcome, t: Translator): string {
	if (outcome.kind === 'failed') return t('rebuild.failed');
	const parts = [t('rebuild.done', { level: outcome.level, xp: outcome.totalXp })];
	if (outcome.createdCharacter) parts.push(t('rebuild.created'));
	if (outcome.unreadableRows > 0) parts.push(plural(t, 'rebuild.unreadable', outcome.unreadableRows));
	return parts.join(' ');
}
