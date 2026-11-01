import { describe, expect, it } from 'vitest';
import { rulesFromFrontmatter } from '../../../src/adapters/vault/rulesMapper';
import { DEFAULT_RULES, type GameRules } from '../../../src/domain/rules/GameRules';

// Shape of Dromos/Rules.md as 04-Game-Design describes it, with every value changed.
const FULL_NOTE = {
	type: 'dromos-rules',
	xp: {
		todo: { trivial: 1, easy: 2, medium: 3, hard: 4 },
		daily: { trivial: 6, easy: 7, medium: 8, hard: 9 },
		streak_bonus: { every: 3, xp: 50 },
	},
	level_curve: { kind: 'polynomial', base: 10, exponent: 1.2 },
	skill_curve: { kind: 'polynomial', base: 20, exponent: 1.1 },
	rank_levels: [1, 2, 3, 4, 5],
};

const FULL_RULES: GameRules = {
	xp: {
		todo: { trivial: 1, easy: 2, medium: 3, hard: 4 },
		daily: { trivial: 6, easy: 7, medium: 8, hard: 9 },
		streakBonus: { every: 3, xp: 50 },
	},
	characterCurve: { base: 10, exponent: 1.2 },
	skillCurve: { base: 20, exponent: 1.1 },
	rankLevels: [1, 2, 3, 4, 5],
};

describe('rulesFromFrontmatter: reading the note (S16)', () => {
	it('reads every field of a full note, reporting nothing', () => {
		expect(rulesFromFrontmatter(FULL_NOTE)).toEqual({ rules: FULL_RULES, invalidFields: [] });
	});

	it.each([
		['an empty object', {}],
		['undefined', undefined],
		['null', null],
		['a string', 'xp: 5'],
		['an array', [1, 2]],
	])('falls back to every default for %s, without calling it a mistake', (_label, frontmatter) => {
		expect(rulesFromFrontmatter(frontmatter)).toEqual({ rules: DEFAULT_RULES, invalidFields: [] });
	});

	it('a missing field takes its default on its own and is not a mistake', () => {
		const { rules, invalidFields } = rulesFromFrontmatter({ xp: { todo: { easy: 99 } }, skill_curve: { exponent: 2 } });

		expect(rules.xp.todo).toEqual({ ...DEFAULT_RULES.xp.todo, easy: 99 });
		expect(rules.xp.daily).toEqual(DEFAULT_RULES.xp.daily);
		expect(rules.skillCurve).toEqual({ base: DEFAULT_RULES.skillCurve.base, exponent: 2 });
		expect(rules.characterCurve).toEqual(DEFAULT_RULES.characterCurve);
		expect(invalidFields).toEqual([]);
	});

	it('a curve with no kind is read as polynomial', () => {
		expect(rulesFromFrontmatter({ level_curve: { base: 50, exponent: 1 } }).rules.characterCurve).toEqual({ base: 50, exponent: 1 });
	});

	it('reads numbers written as digits in a text', () => {
		const { rules, invalidFields } = rulesFromFrontmatter({ xp: { todo: { easy: '12' } }, level_curve: { base: '50', exponent: '1.5' } });

		expect(rules.xp.todo.easy).toBe(12);
		expect(rules.characterCurve).toEqual({ base: 50, exponent: 1.5 });
		expect(invalidFields).toEqual([]);
	});
});

describe('rulesFromFrontmatter: a wrong value never reaches the game (S16)', () => {
	it.each([
		['zero', 0],
		['negative', -5],
		['a fraction, which the ledger could not read back', 2.5],
		['text', 'mucho'],
		['a list', [5]],
		['not a number', Number.NaN],
		['infinite', Number.POSITIVE_INFINITY],
	])('an XP value that is %s keeps the default and is named', (_label, value) => {
		const { rules, invalidFields } = rulesFromFrontmatter({ xp: { daily: { hard: value } } });

		expect(rules.xp.daily.hard).toBe(DEFAULT_RULES.xp.daily.hard);
		expect(invalidFields).toEqual(['xp.daily.hard']);
	});

	it.each([
		['every', 'xp.streak_bonus.every', 0],
		['every', 'xp.streak_bonus.every', 1.5],
		['xp', 'xp.streak_bonus.xp', -1],
	])('a streak bonus %s that cannot work keeps the default (%s = %s)', (key, name, value) => {
		const { rules, invalidFields } = rulesFromFrontmatter({ xp: { streak_bonus: { [key]: value } } });

		expect(rules.xp.streakBonus).toEqual(DEFAULT_RULES.xp.streakBonus);
		expect(invalidFields).toEqual([name]);
	});

	// A base below 1 rounds to 0 XP per level, and `LevelCurve.progressFor` would never end.
	it.each([0, 0.001, 0.49, -100, Number.NaN, Number.POSITIVE_INFINITY, 'mucho'])('a curve base of %s keeps the default: it could hang the plugin', (base) => {
		const { rules, invalidFields } = rulesFromFrontmatter({ skill_curve: { base } });

		expect(rules.skillCurve.base).toBe(DEFAULT_RULES.skillCurve.base);
		expect(invalidFields).toEqual(['skill_curve.base']);
	});

	it.each([0, -1, 11, Number.NaN, Number.POSITIVE_INFINITY, 'mucho'])('a curve exponent of %s keeps the default', (exponent) => {
		const { rules, invalidFields } = rulesFromFrontmatter({ level_curve: { exponent } });

		expect(rules.characterCurve.exponent).toBe(DEFAULT_RULES.characterCurve.exponent);
		expect(invalidFields).toEqual(['level_curve.exponent']);
	});

	it('a curve of another kind keeps the whole default curve, since its numbers mean something else', () => {
		const { rules, invalidFields } = rulesFromFrontmatter({ level_curve: { kind: 'exponential', base: 50, exponent: 2 } });

		expect(rules.characterCurve).toEqual(DEFAULT_RULES.characterCurve);
		expect(invalidFields).toEqual(['level_curve.kind']);
	});

	it.each([
		['too few', [1, 5, 10]],
		['too many', [1, 2, 3, 4, 5, 6]],
		['out of order', [1, 10, 5, 15, 20]],
		['repeated', [1, 5, 5, 15, 20]],
		['with a zero', [0, 5, 10, 15, 20]],
		['with a text', [1, 5, 'ten', 15, 20]],
		['not a list', 5],
	])('rank levels %s keep the default', (_label, rank_levels) => {
		const { rules, invalidFields } = rulesFromFrontmatter({ rank_levels });

		expect(rules.rankLevels).toEqual(DEFAULT_RULES.rankLevels);
		expect(invalidFields).toEqual(['rank_levels']);
	});

	it.each([
		['xp', { xp: 5 }],
		['xp.todo', { xp: { todo: 'mucho' } }],
		['xp.streak_bonus', { xp: { streak_bonus: [1] } }],
		['skill_curve', { skill_curve: 2 }],
	])('a section that is not a section is named: %s', (name, frontmatter) => {
		const { rules, invalidFields } = rulesFromFrontmatter(frontmatter);

		expect(rules).toEqual(DEFAULT_RULES);
		expect(invalidFields).toEqual([name]);
	});

	it('names every mistake and keeps the good values next to them', () => {
		const { rules, invalidFields } = rulesFromFrontmatter({ xp: { todo: { easy: 'x', hard: 40 } }, skill_curve: { base: 0, exponent: 2 }, rank_levels: [1] });

		expect(rules.xp.todo).toEqual({ ...DEFAULT_RULES.xp.todo, hard: 40 });
		expect(rules.skillCurve).toEqual({ base: DEFAULT_RULES.skillCurve.base, exponent: 2 });
		expect(invalidFields).toEqual(['xp.todo.easy', 'skill_curve.base', 'rank_levels']);
	});
});
