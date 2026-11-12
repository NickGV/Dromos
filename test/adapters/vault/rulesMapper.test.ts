import { describe, expect, it } from 'vitest';
import { rulesFromFrontmatter } from '../../../src/adapters/vault/rulesMapper';
import { DEFAULT_STAGE_RULES } from '../../../src/domain/character/stageRules';
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
	gold_per_level: 25,
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
	goldPerLevel: 25,
	stages: DEFAULT_STAGE_RULES,
};

describe('rulesFromFrontmatter: the gold of a level (M10 S3)', () => {
	it('reads gold_per_level, and is 10 when the note does not set it', () => {
		expect(rulesFromFrontmatter({ gold_per_level: 25 }).rules.goldPerLevel).toBe(25);
		expect(rulesFromFrontmatter({ gold_per_level: '15' }).rules.goldPerLevel).toBe(15);
		expect(rulesFromFrontmatter({}).rules.goldPerLevel).toBe(10);
		expect(rulesFromFrontmatter({}).invalidFields).toEqual([]);
	});

	it.each([['ten'], [0], [-5], [2.5], [true]])('keeps 10 for a gold_per_level that is not a whole number above 0 (%s), and names it', (value) => {
		expect(rulesFromFrontmatter({ gold_per_level: value })).toEqual({ rules: DEFAULT_RULES, invalidFields: ['gold_per_level'] });
	});
});

describe('rulesFromFrontmatter: reading the note (S16)', () => {
	it('reads every field of a full note, reporting nothing', () => {
		expect(rulesFromFrontmatter(FULL_NOTE)).toEqual({ rules: FULL_RULES, invalidFields: [] });
	});

	it('an empty frontmatter is every default, and no mistake', () => {
		expect(rulesFromFrontmatter({})).toEqual({ rules: DEFAULT_RULES, invalidFields: [] });
	});

	it.each([
		['undefined, as broken YAML reads', undefined],
		['null', null],
		['a string', 'xp: 5'],
		['an array', [1, 2]],
	])('a note whose frontmatter is %s plays by the defaults and says so', (_label, frontmatter) => {
		expect(rulesFromFrontmatter(frontmatter)).toEqual({ rules: DEFAULT_RULES, invalidFields: ['frontmatter'] });
	});

	it('the fields every note may carry are not mistakes', () => {
		const frontmatter = { type: 'dromos-rules', created: '2026-11-01', updated: '2026-11-02', tags: ['system'], aliases: [], cssclasses: [], position: {} };

		expect(rulesFromFrontmatter(frontmatter).invalidFields).toEqual([]);
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
		['too big for the ledger to read back', 1e21],
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
		['not starting at level 1, which would leave a new skill with no rank', [2, 4, 6, 8, 10]],
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

	it.each([
		['level_curves', { level_curves: { base: 50 } }],
		['xp.dailies', { xp: { dailies: { easy: 1 } } }],
		['xp.todo.Easy', { xp: { todo: { Easy: 1 } } }],
		['xp.streak_bonus.days', { xp: { streak_bonus: { days: 3 } } }],
		['skill_curve.bases', { skill_curve: { bases: 3 } }],
	])('a field it does not know is named, since a typo must not quietly play by the defaults: %s', (name, frontmatter) => {
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

describe('rulesFromFrontmatter: what each stage asks (M11 S1)', () => {
	it('a note without stages plays by the table of S1, and that is no mistake', () => {
		const { rules, invalidFields } = rulesFromFrontmatter({ gold_per_level: 25 });

		expect(rules.stages).toEqual(DEFAULT_STAGE_RULES);
		expect(invalidFields).toEqual([]);
	});

	it('reads what a stage asks, and every part not written keeps its default', () => {
		const { rules, invalidFields } = rulesFromFrontmatter({
			stages: {
				wayfarer: { level: 4, days: 60 },
				traveller: { skills: 5, skills_at_rank: { rank: 3, count: 2 }, campaigns: 2, books: 8 },
			},
		});

		expect(rules.stages).toEqual({
			...DEFAULT_STAGE_RULES,
			wayfarer: { ...DEFAULT_STAGE_RULES.wayfarer, level: 4, days: 60 },
			traveller: { level: 11, days: 0, skills: 5, skillsAtRank: { rank: 3, count: 2 }, campaigns: 2, books: 8 },
		});
		expect(invalidFields).toEqual([]);
	});

	it('reads "all" skills and "half" of them at a rank, and numbers written as digits in a text', () => {
		const { rules, invalidFields } = rulesFromFrontmatter({ stages: { elder: { skills: 'all', skills_at_rank: { count: 'half' } }, sage: { level: '40', skills: '14' } } });

		expect(rules.stages.elder).toEqual({ ...DEFAULT_STAGE_RULES.elder, skills: 'all', skillsAtRank: { rank: 4, count: 'half' } });
		expect(rules.stages.sage).toEqual({ ...DEFAULT_STAGE_RULES.sage, level: 40, skills: 14 });
		expect(invalidFields).toEqual([]);
	});

	it('a part of skills at a rank keeps the other part of the default', () => {
		const { rules, invalidFields } = rulesFromFrontmatter({ stages: { scholar: { skills_at_rank: { rank: 2 } }, traveller: { skills_at_rank: { count: 3 } } } });

		expect(rules.stages.scholar.skillsAtRank).toEqual({ rank: 2, count: 2 });
		expect(rules.stages.traveller.skillsAtRank).toEqual({ rank: 2, count: 3 });
		expect(invalidFields).toEqual([]);
	});

	it('0 asks nothing: a requirement can be taken away', () => {
		const { rules, invalidFields } = rulesFromFrontmatter({ stages: { wayfarer: { days: 0 }, sage: { books: '0', skills_at_rank: { count: 0 } } } });

		expect(rules.stages.wayfarer).toEqual({ ...DEFAULT_STAGE_RULES.wayfarer, days: 0 });
		expect(rules.stages.sage).toEqual({ ...DEFAULT_STAGE_RULES.sage, books: 0, skillsAtRank: null });
		expect(invalidFields).toEqual([]);
	});

	it('a stage that asked no skill at a rank can ask one when the note gives both parts', () => {
		const { rules, invalidFields } = rulesFromFrontmatter({ stages: { pilgrim: { skills_at_rank: { rank: 2, count: 1 } } } });

		expect(rules.stages.pilgrim.skillsAtRank).toEqual({ rank: 2, count: 1 });
		expect(invalidFields).toEqual([]);
	});

	it.each([
		['level', 'mucho'],
		['level', -1],
		['level', 2.5],
		['level', 'all'],
		['days', Number.NaN],
		['days', [30]],
		['skills', 'half'],
		['skills', 'todas'],
		['campaigns', 'all'],
		['books', Number.POSITIVE_INFINITY],
		['books', 1e21],
	])('a %s of %s keeps the default of that part only, and is named', (field, value) => {
		const { rules, invalidFields } = rulesFromFrontmatter({ stages: { scholar: { campaigns: 4, [field]: value } } });

		expect(rules.stages).toEqual({ ...DEFAULT_STAGE_RULES, scholar: { ...DEFAULT_STAGE_RULES.scholar, campaigns: field === 'campaigns' ? 0 : 4 } });
		expect(invalidFields).toEqual([`stages.scholar.${field}`]);
	});

	it.each([
		['rank', 0],
		['rank', 6],
		['rank', 'half'],
		['count', 'all'],
		['count', -2],
	])('a skills_at_rank %s of %s keeps the default of that part only, and is named', (field, value) => {
		const { rules, invalidFields } = rulesFromFrontmatter({ stages: { elder: { skills_at_rank: { [field]: value } } } });

		expect(rules.stages).toEqual(DEFAULT_STAGE_RULES);
		expect(invalidFields).toEqual([`stages.elder.skills_at_rank.${field}`]);
	});

	it('a stage that asked no skill at a rank, given only one part, asks none and names it', () => {
		const { rules, invalidFields } = rulesFromFrontmatter({ stages: { pilgrim: { skills_at_rank: { count: 1 } } } });

		expect(rules.stages).toEqual(DEFAULT_STAGE_RULES);
		expect(invalidFields).toEqual(['stages.pilgrim.skills_at_rank']);
	});

	it.each([
		['stages', { stages: 5 }],
		['stages', { stages: ['wayfarer'] }],
		['stages.wayfarer', { stages: { wayfarer: 3 } }],
		['stages.scholar.skills_at_rank', { stages: { scholar: { skills_at_rank: 2 } } }],
	])('a section that is not a section keeps its defaults and is named: %s', (name, frontmatter) => {
		const { rules, invalidFields } = rulesFromFrontmatter(frontmatter);

		expect(rules).toEqual(DEFAULT_RULES);
		expect(invalidFields).toEqual([name]);
	});

	it.each([
		['stages.runner', { stages: { runner: { level: 1 } } }],
		['stages.sabio', { stages: { sabio: { level: 40 } } }],
		['stages.wayfarer.xp', { stages: { wayfarer: { xp: 100 } } }],
		['stages.elder.skills_at_rank.ranks', { stages: { elder: { skills_at_rank: { ranks: 3 } } } }],
	])('a stage or a part it does not know is named, and nothing changes: %s', (name, frontmatter) => {
		const { rules, invalidFields } = rulesFromFrontmatter(frontmatter);

		expect(rules).toEqual(DEFAULT_RULES);
		expect(invalidFields).toEqual([name]);
	});

	it('a note with stages still reads every other field as before', () => {
		const { rules, invalidFields } = rulesFromFrontmatter({ ...FULL_NOTE, stages: { wayfarer: { level: 4 } } });

		expect(rules).toEqual({ ...FULL_RULES, stages: { ...DEFAULT_STAGE_RULES, wayfarer: { ...DEFAULT_STAGE_RULES.wayfarer, level: 4 } } });
		expect(invalidFields).toEqual([]);
	});
});
