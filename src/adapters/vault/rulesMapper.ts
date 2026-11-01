import { DEFAULT_RULES, RANK_COUNT, RANK_LEVELS, type CurveConfig, type Difficulty, type GameRules } from '../../domain';
import { asRecord, positiveInteger } from './frontmatterFields';

export interface RulesReading {
	readonly rules: GameRules;
	/** The fields that hold something unusable, as written in the note (`xp.todo.easy`). */
	readonly invalidFields: readonly string[];
}

const DIFFICULTIES: readonly Difficulty[] = ['trivial', 'easy', 'medium', 'hard'];

/** Below 1 a curve can round to 0 XP per level, and `LevelCurve.progressFor` would never end. */
const MIN_CURVE_BASE = 1;
const MAX_CURVE_EXPONENT = 10;

/**
 * Maps the frontmatter of `Rules.md` to the rules of the game (S16). Each field stands on its
 * own: a missing one takes its default, and a wrong one takes its default and is reported, so
 * a typo shows up instead of quietly playing by other numbers. XP values must be whole
 * numbers, because the ledger only reads those back.
 */
export function rulesFromFrontmatter(frontmatter: unknown): RulesReading {
	const fields = asRecord(frontmatter);
	const invalid: string[] = [];
	const xp = section(fields.xp, 'xp', invalid);
	const bonus = section(xp.streak_bonus, 'xp.streak_bonus', invalid);
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
		},
		invalidFields: invalid,
	};
}

function isMissing(value: unknown): boolean {
	return value === undefined || value === null;
}

function section(value: unknown, name: string, invalid: string[]): Record<string, unknown> {
	const fields = asRecord(value);
	if (!isMissing(value) && fields !== value) invalid.push(name);
	return fields;
}

function wholeNumber(value: unknown, fallback: number, name: string, invalid: string[]): number {
	if (isMissing(value)) return fallback;
	const number = positiveInteger(value);
	if (number !== null) return number;
	invalid.push(name);
	return fallback;
}

function difficulties(value: unknown, fallback: Readonly<Record<Difficulty, number>>, name: string, invalid: string[]): Record<Difficulty, number> {
	const fields = section(value, name, invalid);
	return Object.fromEntries(DIFFICULTIES.map((difficulty) => [difficulty, wholeNumber(fields[difficulty], fallback[difficulty], `${name}.${difficulty}`, invalid)])) as Record<Difficulty, number>;
}

function curve(value: unknown, fallback: CurveConfig, name: string, invalid: string[]): CurveConfig {
	const fields = section(value, name, invalid);
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
	if (levels.length === RANK_COUNT && usable.length === RANK_COUNT && ascending) return usable;
	invalid.push('rank_levels');
	return RANK_LEVELS;
}
