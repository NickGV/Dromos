import type { CharacterStanding, GameSnapshot } from '../../application';
import { daysSince } from '../../domain';
import { plural, type Translator } from '../../i18n';
import type { CeremonyPhase } from './levelUpView';

/**
 * What this device last saw of the game (game-ui S15), as it keeps it: the character's total XP
 * and level, the XP of each skill, the task completions that stand, and when it was saved.
 */
export interface LastSeen {
	/** The instant it was saved, as an ISO string. */
	readonly savedAt: string;
	/** The local day it was saved, `YYYY-MM-DD`, from the clock: what "since yesterday" counts from. */
	readonly savedOn: string;
	readonly level: number;
	readonly totalXp: number;
	/** Skill id to its XP. */
	readonly skills: Readonly<Record<string, number>>;
	readonly quests: number;
}

/** A skill that rose since the record, by how much. */
export interface SkillGain {
	readonly name: string;
	readonly xp: number;
}

/** What changed since the record, as the line under the bar tells it. */
export interface VisitDelta {
	/** Signed: a revert makes it negative. */
	readonly xp: number;
	readonly levelChanged: boolean;
	/** The skills that rose, the most first; a skill that fell is not listed. */
	readonly skills: readonly SkillGain[];
	/** Signed: completions less reverts. */
	readonly quests: number;
	/** Calendar days from the record to today, 0 for today. */
	readonly days: number;
}

/** Where the bar and the walker stand while the open sync runs: the record's XP into the level. */
export interface HeldProgress {
	/** Fill width, 0..100. */
	readonly percent: number;
	/** 0..1, for the walker. */
	readonly fraction: number;
}

/** What the character card draws of the visit: the line under the bar, and how the bar moves. */
export interface CardVisit {
	/** The whole line, as the live region says it. */
	readonly line: string | null;
	/** The same line in its parts, which the card keeps whole when it wraps. */
	readonly parts: readonly string[];
	/** The width the bar is held at while the open sync runs; `null` shows the real one. */
	readonly heldPercent: number | null;
	/** The bar moves to its value slowly, as the walker walks (about 1.2 s). */
	readonly catchUp: boolean;
}

/** Skills listed by name before "and N more". */
const SHOWN_SKILLS = 3;

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The record of the game in `snapshot`, saved at `now` on the local day `today`; `null` while the game has no character. */
export function lastSeenOf(snapshot: GameSnapshot, now: Date, today: string): LastSeen | null {
	if (snapshot.character === null) return null;
	const skills: Record<string, number> = {};
	for (const entry of snapshot.skills ?? []) skills[entry.skill.id] = entry.xp;
	return { savedAt: now.toISOString(), savedOn: today, level: snapshot.character.level, totalXp: snapshot.character.totalXp, skills, quests: snapshot.completedQuests ?? 0 };
}

/** The stored record, or `null` for anything that is not one: the device's storage is not to be trusted blindly. */
export function readLastSeen(stored: unknown): LastSeen | null {
	if (typeof stored !== 'object' || stored === null) return null;
	const value = stored as Partial<Record<keyof LastSeen, unknown>>;
	const { savedAt, savedOn, level, totalXp, skills, quests } = value;
	if (typeof savedAt !== 'string' || typeof savedOn !== 'string' || !DAY.test(savedOn)) return null;
	if (!isCount(level) || !isCount(totalXp) || !isCount(quests)) return null;
	if (typeof skills !== 'object' || skills === null || Array.isArray(skills)) return null;
	const entries = Object.entries(skills as Record<string, unknown>);
	if (!entries.every(([, xp]) => isCount(xp))) return null;
	return { savedAt, savedOn, level, totalXp, skills: Object.fromEntries(entries) as Record<string, number>, quests };
}

/**
 * What changed from `previous` to `current`, naming skills by `names` (id to note name). `null`
 * on the first visit on a device, where there is no record, and when nothing changed.
 */
export function visitDelta(previous: LastSeen | null, current: LastSeen, names: ReadonlyMap<string, string>): VisitDelta | null {
	if (previous === null) return null;
	const xp = current.totalXp - previous.totalXp;
	const quests = current.quests - previous.quests;
	const ids = new Set([...Object.keys(previous.skills), ...Object.keys(current.skills)]);
	const gains = [...ids].map((id) => ({ id, xp: (current.skills[id] ?? 0) - (previous.skills[id] ?? 0) }));
	if (xp === 0 && quests === 0 && gains.every((gain) => gain.xp === 0)) return null;
	const skills = gains
		.filter((gain) => gain.xp > 0)
		.map((gain) => ({ name: names.get(gain.id) ?? gain.id, xp: gain.xp }))
		.sort((left, right) => right.xp - left.xp || left.name.localeCompare(right.name));
	return { xp, levelChanged: current.level !== previous.level, skills, quests, days: Math.max(0, daysSince(previous.savedOn, current.savedOn)) };
}

/** "+45 XP since yesterday · Reader +15 · 2 quests": the XP and when, the skills that rose, the quests. */
export function sinceVisitText(delta: VisitDelta, t: Translator): string {
	return sinceVisitParts(delta, t).join(' · ');
}

/** The parts of the line, in order: "+45 XP since yesterday", "Reader +15", "2 quests". */
export function sinceVisitParts(delta: VisitDelta, t: Translator): string[] {
	const when = delta.days === 0 ? 'since.xp.today' : delta.days === 1 ? 'since.xp.yesterday' : 'since.xp.days';
	const parts = [t(when, { xp: signed(delta.xp), days: delta.days })];
	for (const gain of delta.skills.slice(0, SHOWN_SKILLS)) parts.push(t('since.skill', { name: gain.name, xp: signed(gain.xp) }));
	if (delta.skills.length > SHOWN_SKILLS) parts.push(t('since.more', { count: delta.skills.length - SHOWN_SKILLS }));
	if (delta.quests !== 0) parts.push(plural(t, 'since.quests', Math.abs(delta.quests), { n: delta.quests > 0 ? String(delta.quests) : signed(delta.quests) }));
	return parts;
}

/**
 * The XP into the level `previous` had, drawn on today's level: where the bar and the walker wait
 * while the open sync runs. `null` without a record, or when the level is another one: then the
 * ceremony, or nothing, moves the bar.
 */
export function heldProgress(previous: LastSeen | null, standing: Pick<CharacterStanding, 'level' | 'totalXp' | 'xpIntoLevel' | 'xpToNext'>): HeldProgress | null {
	if (previous === null || previous.level !== standing.level || standing.xpToNext <= 0) return null;
	const into = Math.min(standing.xpToNext, Math.max(0, standing.xpIntoLevel - (standing.totalXp - previous.totalXp)));
	const fraction = into / standing.xpToNext;
	return { percent: Math.round(fraction * 100), fraction };
}

/**
 * The visit as the card shows it. While a level-up ceremony runs it owns the bar, so the bar is
 * neither held nor slowed; across a level change the line shows without the bar moving slowly.
 * `motion` is false under reduced motion and where nothing can animate: the bar shows its value at once.
 */
export function visitCardView(
	input: { readonly delta: VisitDelta | null; readonly held: HeldProgress | null; readonly ceremony: CeremonyPhase | null; readonly motion: boolean },
	t: Translator,
): CardVisit {
	const { delta, held, ceremony, motion } = input;
	const free = motion && ceremony === null;
	const parts = delta ? sinceVisitParts(delta, t) : [];
	return {
		line: delta ? parts.join(' · ') : null,
		parts,
		heldPercent: free && held ? held.percent : null,
		catchUp: free && delta !== null && !delta.levelChanged && delta.xp !== 0,
	};
}

/** "+45", "−10" (a true minus sign), "±0". */
function signed(value: number): string {
	if (value > 0) return `+${value}`;
	if (value < 0) return `−${-value}`;
	return '±0';
}

function isCount(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}
