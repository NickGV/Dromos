import type { GameEvent } from '../../application';
import type { Translator } from '../../i18n';
import type { SkillCardView } from './skillsView';

/**
 * The steps of a character level-up (game-ui S4): the XP bar fills, then the medallion turns
 * ochre, then the ribbon unfurls and the panel opens. `final` is also where reduced motion starts.
 */
export type CeremonyPhase = 'fill' | 'medal' | 'final';

/** One skill event of the sync, as the ceremony lists it: a small medallion and a line. */
export interface CeremonyRowView {
	readonly key: string;
	readonly skillId: string;
	/** The skill's icon, or `''` when its note is gone. */
	readonly icon: string;
	/** "Reader rose to level 3", or "New skill: Reader". */
	readonly text: string;
	/** The new rank when it changed, the stat an unlocked skill feeds; else `null`. */
	readonly detail: string | null;
}

/**
 * The level-up ceremony (game-ui S4), from the events not dismissed yet. With a character level
 * the ribbon unfurls over the scene and the card runs its bar and medallion first; skill events
 * alone open the panel at once, without a ribbon.
 */
export interface CeremonyView {
	/** The highest level the character reached, or `null` when only skills moved. */
	readonly level: number | null;
	readonly ribbon: { readonly kicker: string; readonly title: string } | null;
	readonly title: string;
	readonly rows: readonly CeremonyRowView[];
	readonly dismissLabel: string;
	readonly ariaLabel: string;
}

/** `null` when there is nothing to celebrate. `skills` gives each row its icon and stat. */
export function ceremonyView(events: readonly GameEvent[], skills: readonly SkillCardView[], t: Translator): CeremonyView | null {
	if (events.length === 0) return null;
	const levels = events.flatMap((event) => (event.kind === 'character-level' ? [event.level] : []));
	const level = levels.length > 0 ? Math.max(...levels) : null;
	const rows = events.flatMap((event, index) => {
		if (event.kind === 'character-level') return [];
		const card = skills.find((skill) => skill.id === event.skillId);
		const base = { key: `${index}:${event.skillId}`, skillId: event.skillId, icon: card?.icon ?? '' };
		if (event.kind === 'skill-unlocked') return [{ ...base, text: t('ceremony.unlocked', { name: event.name }), detail: card ? t('ceremony.feeds', { stat: card.statLabel }) : null }];
		return [{ ...base, text: t('ceremony.skillLevel', { name: event.name, level: event.level }), detail: event.rankChanged && event.rank !== null ? t('ceremony.rank', { rank: event.rank }) : null }];
	});
	return {
		level,
		ribbon: level === null ? null : { kicker: t('ceremony.ribbon'), title: t('character.level', { level }) },
		title: level === null ? t('ceremony.title.skills') : t('ceremony.title', { level }),
		rows,
		dismissLabel: t('event.dismiss'),
		ariaLabel: t('ceremony.aria'),
	};
}

/** The toasts of a sync (S18): an unlock only, since the ceremony shows the levels. */
export function unlockNotices(events: readonly GameEvent[], t: Translator): string[] {
	return events.flatMap((event) => (event.kind === 'skill-unlocked' ? [t('event.skillUnlocked', { name: event.name })] : []));
}
