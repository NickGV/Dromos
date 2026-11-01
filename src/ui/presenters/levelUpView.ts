import type { GameEvent } from '../../application';
import type { Translator } from '../../i18n';

/** The dismissible banner shown when the view opens after a level-up or an unlock (S10). */
export interface LevelUpBannerView {
	readonly messages: readonly string[];
	readonly dismissLabel: string;
}

/** `null` when there is nothing to announce. */
export function levelUpBannerView(events: readonly GameEvent[], t: Translator): LevelUpBannerView | null {
	if (events.length === 0) return null;
	return { messages: events.map((event) => messageFor(event, t)), dismissLabel: t('event.dismiss') };
}

function messageFor(event: GameEvent, t: Translator): string {
	switch (event.kind) {
		case 'character-level':
			return t('event.characterLevel', { level: event.level });
		case 'skill-unlocked':
			return t('event.skillUnlocked', { name: event.name });
		case 'skill-level':
			return event.rankChanged && event.rank !== null
				? t('event.skillLevelRank', { name: event.name, level: event.level, rank: event.rank })
				: t('event.skillLevel', { name: event.name, level: event.level });
	}
}
