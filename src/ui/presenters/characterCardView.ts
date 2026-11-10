import { STAT_IDS, type Character, type StatId } from '../../domain';
import type { MessageKey, Translator } from '../../i18n';
import { statRadarView, type StatRadarView } from './statRadarView';

/** Copy keys of the six stats; the ids themselves are the frontmatter keys of `Character.md` and never change. */
const STAT_KEYS: Readonly<Record<StatId, MessageKey>> = {
	fuerza: 'stat.fuerza',
	vitalidad: 'stat.vitalidad',
	inteligencia: 'stat.inteligencia',
	sabiduria: 'stat.sabiduria',
	espiritu: 'stat.espiritu',
	disciplina: 'stat.disciplina',
};

/** Copy keys of the stats' short labels, as the plaque's radar names its axes (S5, S9). */
const STAT_SHORT_KEYS: Readonly<Record<StatId, MessageKey>> = {
	fuerza: 'stat.fuerza.short',
	vitalidad: 'stat.vitalidad.short',
	inteligencia: 'stat.inteligencia.short',
	sabiduria: 'stat.sabiduria.short',
	espiritu: 'stat.espiritu.short',
	disciplina: 'stat.disciplina.short',
};

/** The label of a stat in the interface language. */
export function statLabel(id: StatId, t: Translator): string {
	return t(STAT_KEYS[id]);
}

/** XP into the current level against the XP the level needs. */
export interface XpBarView {
	readonly current: number;
	readonly total: number;
	/** Whole percent, clamped to 0..100. */
	readonly percent: number;
	readonly text: string;
}

/** What `CharacterCard` shows (S8, game-ui S3). */
export interface CharacterCardView {
	readonly name: string;
	/** `null` when the note has no title. */
	readonly title: string | null;
	/** The number on the level medallion. */
	readonly level: number;
	/** "Level 3": the medallion's name for screen readers. */
	readonly levelText: string;
	/** The small-caps line under the name: "<title> · level 3", or "Level 3" without a title. */
	readonly titleLine: string;
	/** The same line as its phrases, the title and the level, so a narrow card breaks only between them (game-ui S14). */
	readonly titleParts: readonly string[];
	readonly xp: XpBarView;
	/** "Level 4 in 280 XP", under the bar: Dromos has no next title to name (game-ui S3). */
	readonly nextLevelText: string;
	/** The six stats as the plaque's radar (S9), in `STAT_IDS` order, the first axis at the top. */
	readonly radar: StatRadarView;
}

/** Maps a character read from `Character.md` to the card's display values. */
export function characterCardView(character: Character, t: Translator): CharacterCardView {
	const { level, xpIntoLevel, xpToNext } = character;
	const title = character.title === '' ? null : character.title;
	return {
		name: character.name === '' ? t('character.unnamed') : character.name,
		title,
		level,
		levelText: t('character.level', { level }),
		titleLine: title === null ? t('character.level', { level }) : `${title} · ${t('screen.level', { level })}`,
		titleParts: title === null ? [t('character.level', { level })] : [title, t('screen.level', { level })],
		xp: xpBarView(xpIntoLevel, xpToNext),
		nextLevelText: t('character.nextLevel', { level: level + 1, xp: Math.max(0, xpToNext - xpIntoLevel) }),
		radar: statRadarView(
			STAT_IDS.map((id) => ({ id, label: t(STAT_KEYS[id]), shortLabel: t(STAT_SHORT_KEYS[id]), value: character.stats[id] })),
			t,
		),
	};
}

/** XP into the current level against the XP it needs, as the bar shows it. */
export function xpBarView(current: number, total: number): XpBarView {
	return { current, total, percent: percentOf(current, total), text: `${current} / ${total} XP` };
}

function percentOf(part: number, whole: number): number {
	if (whole <= 0) return 0;
	return Math.min(100, Math.max(0, Math.round((part / whole) * 100)));
}
