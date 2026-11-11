import { DEFAULT_RULES, RANK_COUNT, RANK_LEVELS, type CurveConfig, type Difficulty, type GameRules } from '../../domain';
import { asRecord, positiveInteger } from './frontmatterFields';

export interface RulesReading {
	readonly rules: GameRules;
	/** The fields that hold something unusable, as written in the note (`xp.todo.easy`). */
	readonly invalidFields: readonly string[];
}

const DIFFICULTIES: readonly Difficulty[] = ['trivial', 'easy', 'medium', 'hard'];

/** What the note holds, and what any note may carry next to it. */
const NOTE_FIELDS = ['xp', 'level_curve', 'skill_curve', 'rank_levels', 'gold_per_level', 'type', 'created', 'updated', 'tags', 'aliases', 'cssclasses', 'position'];

/** Below 1 a curve can round to 0 XP per level, and `LevelCurve.progressFor` would never end. */
const MIN_CURVE_BASE = 1;
const MAX_CURVE_EXPONENT = 10;

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
