import { STAT_IDS, type Character, type StatId } from '../../domain';
import type { MessageKey, Translator } from '../../i18n';

/** Copy keys of the four stats; the ids themselves are the frontmatter keys of `Character.md` and never change. */
const STAT_KEYS: Readonly<Record<StatId, MessageKey>> = {
	fuerza: 'stat.fuerza',
	inteligencia: 'stat.inteligencia',
	espiritu: 'stat.espiritu',
	disciplina: 'stat.disciplina',
};

export interface StatBadgeView {
	readonly id: StatId;
	readonly label: string;
	readonly value: number;
}

/** XP into the current level against the XP the level needs. */
export interface XpBarView {
	readonly current: number;
	readonly total: number;
	/** Whole percent, clamped to 0..100. */
	readonly percent: number;
	readonly text: string;
}

/** What `CharacterCard` shows (S8). */
export interface CharacterCardView {
	readonly name: string;
	/** `null` when the note has no title. */
	readonly title: string | null;
	readonly levelText: string;
	readonly xp: XpBarView;
	/** Always the four stats, in `STAT_IDS` order. */
	readonly stats: readonly StatBadgeView[];
}

/** Maps a character read from `Character.md` to the card's display values. */
export function characterCardView(character: Character, t: Translator): CharacterCardView {
	const { xpIntoLevel, xpToNext } = character;
	return {
		name: character.name === '' ? t('character.unnamed') : character.name,
		title: character.title === '' ? null : character.title,
		levelText: t('character.level', { level: character.level }),
		xp: { current: xpIntoLevel, total: xpToNext, percent: percentOf(xpIntoLevel, xpToNext), text: `${xpIntoLevel} / ${xpToNext} XP` },
		stats: STAT_IDS.map((id) => ({ id, label: t(STAT_KEYS[id]), value: character.stats[id] })),
	};
}

function percentOf(part: number, whole: number): number {
	if (whole <= 0) return 0;
	return Math.min(100, Math.max(0, Math.round((part / whole) * 100)));
}
