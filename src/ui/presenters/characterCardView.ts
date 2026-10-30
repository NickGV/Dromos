import { STAT_IDS, type Character, type StatId } from '../../domain';

/** Spanish labels of the four stats. */
export const STAT_LABELS: Readonly<Record<StatId, string>> = {
	fuerza: 'Fuerza',
	inteligencia: 'Inteligencia',
	espiritu: 'Espíritu',
	disciplina: 'Disciplina',
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
export function characterCardView(character: Character): CharacterCardView {
	const { xpIntoLevel, xpToNext } = character;
	return {
		name: character.name === '' ? 'Sin nombre' : character.name,
		title: character.title === '' ? null : character.title,
		levelText: `Nivel ${character.level}`,
		xp: { current: xpIntoLevel, total: xpToNext, percent: percentOf(xpIntoLevel, xpToNext), text: `${xpIntoLevel} / ${xpToNext} XP` },
		stats: STAT_IDS.map((id) => ({ id, label: STAT_LABELS[id], value: character.stats[id] })),
	};
}

function percentOf(part: number, whole: number): number {
	if (whole <= 0) return 0;
	return Math.min(100, Math.max(0, Math.round((part / whole) * 100)));
}
