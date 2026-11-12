import {
	DEFAULT_RULES,
	EVERY_SKILL,
	HALF_THE_SKILLS,
	LATER_STAGE_IDS,
	RANK_COUNT,
	RANK_LEVELS,
	type CurveConfig,
	type Difficulty,
	type GameRules,
	type SkillsAtRank,
	type StageRequirements,
	type StageRules,
} from '../../domain';
import { asRecord, positiveInteger } from './frontmatterFields';

export interface RulesReading {
	readonly rules: GameRules;
	/** The fields that hold something unusable, as written in the note (`xp.todo.easy`). */
	readonly invalidFields: readonly string[];
}

const DIFFICULTIES: readonly Difficulty[] = ['trivial', 'easy', 'medium', 'hard'];

/** What the note holds, and what any note may carry next to it. */
const NOTE_FIELDS = ['xp', 'level_curve', 'skill_curve', 'rank_levels', 'gold_per_level', 'stages', 'type', 'created', 'updated', 'tags', 'aliases', 'cssclasses', 'position'];

/** Below 1 a curve can round to 0 XP per level, and `LevelCurve.progressFor` would never end. */
const MIN_CURVE_BASE = 1;
const MAX_CURVE_EXPONENT = 10;

/** What a stage may ask in the note (M11 S1), snake case like the note's other fields. */
const STAGE_FIELDS = ['level', 'days', 'skills', 'skills_at_rank', 'campaigns', 'books'];

/**
 * Maps the frontmatter of `Rules.md` to the rules of the game (S16). Each field stands on its
 * own: a missing one takes its default, and a wrong or unknown one is reported, so a typo or
 * broken YAML shows up instead of quietly playing by other numbers; rows priced meanwhile
 * could never be priced again. XP values must be whole numbers the ledger can read back.
 */
export function rulesFromFrontmatter(frontmatter: unknown): RulesReading {
	const fields = asRecord(frontmatter);
	if (fields !== frontmatter) return { rules: DEFAULT_RULES, invalidFields: ['frontmatter'] };
	const invalid = Object.keys(fields).filter((key) => !NOTE_FIELDS.includes(key));
	const xp = section(fields.xp, 'xp', ['todo', 'daily', 'streak_bonus'], invalid);
	const bonus = section(xp.streak_bonus, 'xp.streak_bonus', ['every', 'xp'], invalid);
	const defaults = DEFAULT_RULES;
	const todo = difficulties(xp.todo, defaults.xp.todo, 'xp.todo', invalid);
	const daily = difficulties(xp.daily, defaults.xp.daily, 'xp.daily', invalid);
	const streakBonus = {
		every: wholeNumber(bonus.every, defaults.xp.streakBonus.every, 'xp.streak_bonus.every', invalid),
		xp: wholeNumber(bonus.xp, defaults.xp.streakBonus.xp, 'xp.streak_bonus.xp', invalid),
	};
	return {
		rules: {
			xp: { todo, daily, streakBonus },
			characterCurve: curve(fields.level_curve, defaults.characterCurve, 'level_curve', invalid),
			skillCurve: curve(fields.skill_curve, defaults.skillCurve, 'skill_curve', invalid),
			rankLevels: rankLevels(fields.rank_levels, invalid),
			// `gold_per_level`, snake case like the note's other fields (ADR-019); a whole number above 0, else the default 10 (M10 S3).
			goldPerLevel: wholeNumber(fields.gold_per_level, defaults.goldPerLevel, 'gold_per_level', invalid),
			stages: stages(fields.stages, defaults.stages, invalid),
		},
		invalidFields: invalid,
	};
}

function isMissing(value: unknown): boolean {
	return value === undefined || value === null;
}

function section(value: unknown, name: string, known: readonly string[], invalid: string[]): Record<string, unknown> {
	const fields = asRecord(value);
	if (!isMissing(value) && fields !== value) invalid.push(name);
	for (const key of Object.keys(fields)) {
		if (!known.includes(key)) invalid.push(`${name}.${key}`);
	}
	return fields;
}

function wholeNumber(value: unknown, fallback: number, name: string, invalid: string[]): number {
	if (isMissing(value)) return fallback;
	const number = positiveInteger(value);
	if (number !== null && Number.isSafeInteger(number)) return number;
	invalid.push(name);
	return fallback;
}

function difficulties(value: unknown, fallback: Readonly<Record<Difficulty, number>>, name: string, invalid: string[]): Record<Difficulty, number> {
	const fields = section(value, name, DIFFICULTIES, invalid);
	return Object.fromEntries(DIFFICULTIES.map((difficulty) => [difficulty, wholeNumber(fields[difficulty], fallback[difficulty], `${name}.${difficulty}`, invalid)])) as Record<Difficulty, number>;
}

function curve(value: unknown, fallback: CurveConfig, name: string, invalid: string[]): CurveConfig {
	const fields = section(value, name, ['kind', 'base', 'exponent'], invalid);
	if (!isMissing(fields.kind) && fields.kind !== 'polynomial') {
		invalid.push(`${name}.kind`);
		return fallback;
	}
	return {
		base: curveNumber(fields.base, fallback.base, `${name}.base`, (base) => base >= MIN_CURVE_BASE, invalid),
		exponent: curveNumber(fields.exponent, fallback.exponent, `${name}.exponent`, (exponent) => exponent > 0 && exponent <= MAX_CURVE_EXPONENT, invalid),
	};
}

function curveNumber(value: unknown, fallback: number, name: string, isValid: (number: number) => boolean, invalid: string[]): number {
	if (isMissing(value)) return fallback;
	const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
	if (typeof number === 'number' && Number.isFinite(number) && isValid(number)) return number;
	invalid.push(name);
	return fallback;
}

function rankLevels(value: unknown, invalid: string[]): readonly number[] {
	if (isMissing(value)) return RANK_LEVELS;
	const levels = Array.isArray(value) ? (value as unknown[]).map((level) => positiveInteger(level)) : [];
	const usable = levels.filter((level): level is number => level !== null);
	const ascending = usable.every((level, position) => position === 0 || level > (usable[position - 1] ?? 0));
	// A skill that has just unlocked is level 1, so the first rank has to start there.
	const startsAtOne = usable[0] === RANK_LEVELS[0];
	if (levels.length === RANK_COUNT && usable.length === RANK_COUNT && ascending && startsAtOne) return usable;
	invalid.push('rank_levels');
	return RANK_LEVELS;
}

/**
 * What each stage asks (M11 S1): `stages.<id>` changes only the parts it writes, and every other
 * part keeps the default table. The runner asks nothing, so it is no stage the note can name.
 */
function stages(value: unknown, fallback: StageRules, invalid: string[]): StageRules {
	const fields = section(value, 'stages', LATER_STAGE_IDS, invalid);
	return Object.fromEntries(LATER_STAGE_IDS.map((id) => [id, stage(fields[id], fallback[id], `stages.${id}`, invalid)])) as Record<keyof StageRules, StageRequirements>;
}

function stage(value: unknown, fallback: StageRequirements, name: string, invalid: string[]): StageRequirements {
	const fields = section(value, name, STAGE_FIELDS, invalid);
	return {
		level: part(fields.level, stageCount, fallback.level, `${name}.level`, invalid),
		days: part(fields.days, stageCount, fallback.days, `${name}.days`, invalid),
		skills: part(fields.skills, (skills) => (skills === EVERY_SKILL ? EVERY_SKILL : stageCount(skills)), fallback.skills, `${name}.skills`, invalid),
		skillsAtRank: skillsAtRank(fields.skills_at_rank, fallback.skillsAtRank, `${name}.skills_at_rank`, invalid),
		campaigns: part(fields.campaigns, stageCount, fallback.campaigns, `${name}.campaigns`, invalid),
		books: part(fields.books, stageCount, fallback.books, `${name}.books`, invalid),
	};
}

/**
 * `{ rank, count }`: a part not written keeps the default's, and a count of 0 asks nothing. A stage
 * whose default asks no skill at a rank needs both parts, since there is no default to complete it.
 */
function skillsAtRank(value: unknown, fallback: SkillsAtRank | null, name: string, invalid: string[]): SkillsAtRank | null {
	if (isMissing(value)) return fallback;
	const mistakes = invalid.length;
	const fields = section(value, name, ['rank', 'count'], invalid);
	if (fields !== value) return fallback;
	const rank = part(fields.rank, rankNumber, fallback?.rank ?? null, `${name}.rank`, invalid);
	const count = part(fields.count, (count) => (count === HALF_THE_SKILLS ? HALF_THE_SKILLS : stageCount(count)), fallback?.count ?? null, `${name}.count`, invalid);
	if (rank === null || count === null) {
		if (invalid.length === mistakes) invalid.push(name);
		return fallback;
	}
	return count === 0 ? null : { rank, count };
}

/** One part of a stage: missing keeps `fallback`; one that `read` cannot use keeps it too, and is named. */
function part<T>(value: unknown, read: (value: unknown) => T | null, fallback: T, name: string, invalid: string[]): T {
	if (isMissing(value)) return fallback;
	const usable = read(value);
	if (usable !== null) return usable;
	invalid.push(name);
	return fallback;
}

/** A whole number of 0 or more, written as a number or as digits in a text; 0 asks nothing. */
function stageCount(value: unknown): number | null {
	if (value === 0 || (typeof value === 'string' && /^\s*0+\s*$/.test(value))) return 0;
	const number = positiveInteger(value);
	return number !== null && Number.isSafeInteger(number) ? number : null;
}

/** Rank N, 1-based, of the five ranks every skill climbs. */
function rankNumber(value: unknown): number | null {
	const rank = positiveInteger(value);
	return rank !== null && rank <= RANK_COUNT ? rank : null;
}
