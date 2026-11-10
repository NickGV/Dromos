import type { Translator } from '../../i18n';
import { skillRingView, type SkillRingView, type SkillsPageView } from './skillsView';

/** The skills the plaque shows at most, as small ring medallions (S3). */
export const PLAQUE_SKILLS = 4;

/** The skills part of the character's plaque (S3): its title and its small ring medallions. */
export interface PlaqueSkillsView {
	/** "Skills · 2 of 5": the skills earned, of all of them. */
	readonly title: string;
	/** At most `PLAQUE_SKILLS`, each opening the Skills screen on its skill. */
	readonly rings: readonly SkillRingView[];
}

/**
 * The skills nearest to unlocking, for the plaque (S3): the locked skills with the highest progress
 * first, those of the same progress in the order the page gives them, then, when fewer than four
 * are locked, the earned ones in their order. `null` while there is no skill, so the plaque draws
 * no skills part.
 */
export function plaqueSkillsView(page: SkillsPageView, t: Translator): PlaqueSkillsView | null {
	const total = page.earned.length + page.locked.length;
	if (page.emptyText !== null || total === 0) return null;
	// `sort` is stable: locked skills of the same progress keep the page's order.
	const nearest = [...page.locked].sort((left, right) => right.progressPercent - left.progressPercent);
	return {
		title: t('plaque.skills', { earned: page.earned.length, total }),
		rings: [...nearest, ...page.earned].slice(0, PLAQUE_SKILLS).map((card) => skillRingView(card, t)),
	};
}
