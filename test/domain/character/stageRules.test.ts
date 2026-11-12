import { describe, expect, it } from 'vitest';
import { STAGE_IDS, type StageId } from '../../../src/domain/character/Stage';
import { DEFAULT_STAGE_RULES, LATER_STAGE_IDS, stageFor, type LaterStageId, type StageEvidence, type StageRules } from '../../../src/domain/character/stageRules';

/** The skills of the vault today (S1: "every skill (14 today)"). */
const TOTAL_SKILLS = 14;

/**
 * `count` earned skills, the first ones raised to the ranks given as `[rank, how many]`, rank N
 * being the N-th rank (1-based). The others hold the first rank, as any earned skill does.
 */
function earned(count: number, ...raised: readonly (readonly [number, number])[]): StageEvidence['earned'] {
	const skills: { rankIndex: number | null }[] = Array.from({ length: count }, () => ({ rankIndex: 0 }));
	let next = 0;
	for (const [rank, many] of raised) {
		for (let index = 0; index < many; index += 1) skills[next++] = { rankIndex: rank - 1 };
	}
	return skills;
}

function evidence(overrides: Partial<StageEvidence> = {}): StageEvidence {
	return { level: 1, days: 0, earned: [], totalSkills: TOTAL_SKILLS, campaigns: 0, books: 0, ...overrides };
}

/** The least evidence that reaches each stage: its own requirements and every earlier stage's. */
const LEAST: Readonly<Record<LaterStageId, StageEvidence>> = {
	wayfarer: evidence({ level: 3, days: 30 }),
	pilgrim: evidence({ level: 5, days: 30, earned: earned(1) }),
	apprentice: evidence({ level: 7, days: 30, earned: earned(2), campaigns: 1 }),
	disciple: evidence({ level: 9, days: 30, earned: earned(3), campaigns: 1, books: 5 }),
	traveller: evidence({ level: 11, days: 30, earned: earned(4, [2, 1]), campaigns: 1, books: 5 }),
	student: evidence({ level: 13, days: 30, earned: earned(5, [2, 1]), campaigns: 3, books: 5 }),
	scholar: evidence({ level: 16, days: 30, earned: earned(6, [3, 2]), campaigns: 3, books: 20 }),
	mentor: evidence({ level: 19, days: 30, earned: earned(8, [3, 2]), campaigns: 3, books: 20 }),
	counsellor: evidence({ level: 22, days: 30, earned: earned(10, [3, 2]), campaigns: 10, books: 20 }),
	elder: evidence({ level: 26, days: 30, earned: earned(12, [4, 4]), campaigns: 10, books: 20 }),
	sage: evidence({ level: 30, days: 30, earned: earned(14, [4, 7]), campaigns: 10, books: 50 }),
};

/** Each requirement of a stage one short, from the least evidence that reaches it. */
const ONE_SHORT: readonly (readonly [LaterStageId, string, Partial<StageEvidence>])[] = [
	['wayfarer', 'level 2', { level: 2 }],
	['wayfarer', '29 days', { days: 29 }],
	['pilgrim', 'level 4', { level: 4 }],
	['pilgrim', 'no skill', { earned: earned(0) }],
	['apprentice', 'level 6', { level: 6 }],
	['apprentice', '1 skill', { earned: earned(1) }],
	['apprentice', 'no campaign', { campaigns: 0 }],
	['disciple', 'level 8', { level: 8 }],
	['disciple', '2 skills', { earned: earned(2) }],
	['disciple', '4 books', { books: 4 }],
	['traveller', 'level 10', { level: 10 }],
	['traveller', '3 skills', { earned: earned(3, [2, 1]) }],
	['traveller', 'no skill at rank 2', { earned: earned(4) }],
	['student', 'level 12', { level: 12 }],
	['student', '4 skills', { earned: earned(4, [2, 1]) }],
	['student', '2 campaigns', { campaigns: 2 }],
	['scholar', 'level 15', { level: 15 }],
	['scholar', '5 skills', { earned: earned(5, [3, 2]) }],
	['scholar', '1 skill at rank 3', { earned: earned(6, [3, 1], [2, 1]) }],
	['scholar', '19 books', { books: 19 }],
	['mentor', 'level 18', { level: 18 }],
	['mentor', '7 skills', { earned: earned(7, [3, 2]) }],
	['counsellor', 'level 21', { level: 21 }],
	['counsellor', '9 skills', { earned: earned(9, [3, 2]) }],
	['counsellor', '9 campaigns', { campaigns: 9 }],
	['elder', 'level 25', { level: 25 }],
	['elder', '11 skills', { earned: earned(11, [4, 4]) }],
	['elder', '3 skills at rank 4', { earned: earned(12, [4, 3]) }],
	['sage', 'level 29', { level: 29 }],
	['sage', '13 of the 14 skills', { earned: earned(13, [4, 7]) }],
	['sage', '6 of the 14 skills at rank 4', { earned: earned(14, [4, 6]) }],
	['sage', '49 books', { books: 49 }],
];

function previous(stage: StageId): StageId {
	return STAGE_IDS[STAGE_IDS.indexOf(stage) - 1] ?? 'runner';
}

describe('DEFAULT_STAGE_RULES: the requirement table of S1 (M11)', () => {
	it('asks what the table asks, stage by stage; the runner asks nothing', () => {
		expect(LATER_STAGE_IDS).toEqual(STAGE_IDS.slice(1));
		expect(DEFAULT_STAGE_RULES).toEqual({
			wayfarer: { level: 3, days: 30, skills: 0, skillsAtRank: null, campaigns: 0, books: 0 },
			pilgrim: { level: 5, days: 0, skills: 1, skillsAtRank: null, campaigns: 0, books: 0 },
			apprentice: { level: 7, days: 0, skills: 2, skillsAtRank: null, campaigns: 1, books: 0 },
			disciple: { level: 9, days: 0, skills: 3, skillsAtRank: null, campaigns: 0, books: 5 },
			traveller: { level: 11, days: 0, skills: 4, skillsAtRank: { rank: 2, count: 1 }, campaigns: 0, books: 0 },
			student: { level: 13, days: 0, skills: 5, skillsAtRank: null, campaigns: 3, books: 0 },
			scholar: { level: 16, days: 0, skills: 6, skillsAtRank: { rank: 3, count: 2 }, campaigns: 0, books: 20 },
			mentor: { level: 19, days: 0, skills: 8, skillsAtRank: null, campaigns: 0, books: 0 },
			counsellor: { level: 22, days: 0, skills: 10, skillsAtRank: null, campaigns: 10, books: 0 },
			elder: { level: 26, days: 0, skills: 12, skillsAtRank: { rank: 4, count: 4 }, campaigns: 0, books: 0 },
			sage: { level: 30, days: 0, skills: 'all', skillsAtRank: { rank: 4, count: 'half' }, campaigns: 0, books: 50 },
		});
	});
});

describe('stageFor: each stage of the default table (M11 S1)', () => {
	it('a new character, at level 1 on its first day, is the runner', () => {
		expect(stageFor(evidence())).toBe('runner');
	});

	it.each(LATER_STAGE_IDS)('reaches %s with its requirements and every earlier one met', (stage) => {
		expect(stageFor(LEAST[stage])).toBe(stage);
	});

	it.each(ONE_SHORT)('stays one stage before %s with %s', (stage, _label, short) => {
		expect(stageFor({ ...LEAST[stage], ...short })).toBe(previous(stage));
	});

	it('more than a stage asks is still that stage until the next one is met', () => {
		expect(stageFor({ ...LEAST.pilgrim, level: 6, earned: earned(5), books: 12 })).toBe('pilgrim');
	});
});

describe('stageFor: the arc is never skipped (M11 S1, sequential stages)', () => {
	it('everything the sage asks, but 29 days on the road, is still the runner: the wayfarer comes first', () => {
		expect(stageFor({ ...LEAST.sage, days: 29 })).toBe('runner');
	});

	it('the disciple’s books and more, without the apprentice’s campaign, stops at the pilgrim', () => {
		expect(stageFor({ ...LEAST.disciple, level: 12, books: 30, campaigns: 0 })).toBe('pilgrim');
	});
});

describe('stageFor: "every skill" and "half of them at rank 4" (M11 S1)', () => {
	it('every skill is every skill the vault holds, whatever their number', () => {
		expect(stageFor({ ...LEAST.sage, totalSkills: 16, earned: earned(14, [4, 8]) })).toBe('elder');
		expect(stageFor({ ...LEAST.sage, totalSkills: 16, earned: earned(16, [4, 8]) })).toBe('sage');
	});

	it('half of an odd number of skills rounds up: 7 of 13', () => {
		expect(stageFor({ ...LEAST.sage, totalSkills: 13, earned: earned(13, [4, 7]) })).toBe('sage');
		expect(stageFor({ ...LEAST.sage, totalSkills: 13, earned: earned(13, [4, 6]) })).toBe('elder');
	});

	it('a skill above the asked rank counts for it', () => {
		expect(stageFor({ ...LEAST.sage, earned: earned(14, [5, 7]) })).toBe('sage');
	});

	it('a vault that lists no skill never meets "every skill" nor half of them', () => {
		expect(stageFor({ ...LEAST.sage, totalSkills: 0 })).toBe('elder');
	});
});

describe('stageFor: missing evidence (M11 S1)', () => {
	it('no character at all is the runner', () => {
		expect(stageFor(null)).toBe('runner');
	});

	it('evidence that says nothing is the runner', () => {
		expect(stageFor({})).toBe('runner');
	});

	it('a missing part counts as nothing: no days on the road stops before the wayfarer', () => {
		const { level, earned: skills, totalSkills, campaigns, books } = LEAST.sage;

		expect(stageFor({ level, earned: skills, totalSkills, campaigns, books })).toBe('runner');
	});

	it.each([
		['not a number', Number.NaN],
		['infinite', Number.POSITIVE_INFINITY],
		['negative', -30],
	])('a number that is %s counts as 0', (_label, value) => {
		expect(stageFor({ ...LEAST.wayfarer, days: value })).toBe('runner');
		expect(stageFor({ ...LEAST.apprentice, campaigns: value })).toBe('pilgrim');
		expect(stageFor({ ...LEAST.disciple, books: value })).toBe('apprentice');
		expect(stageFor({ ...LEAST.wayfarer, level: value })).toBe('runner');
	});

	it('a skill with no rank counts as earned but at no rank', () => {
		expect(stageFor({ ...LEAST.traveller, earned: [{ rankIndex: null }, ...earned(3)] })).toBe('disciple');
		expect(stageFor({ ...LEAST.disciple, earned: [{ rankIndex: null }, ...earned(2)] })).toBe('disciple');
	});
});

describe('stageFor: other rules (Rules.md, M11 S1)', () => {
	it('plays by the rules it is given', () => {
		const rules: StageRules = { ...DEFAULT_STAGE_RULES, wayfarer: { ...DEFAULT_STAGE_RULES.wayfarer, level: 2, days: 7 } };

		expect(stageFor(evidence({ level: 2, days: 7 }), rules)).toBe('wayfarer');
		expect(stageFor(evidence({ level: 2, days: 7 }))).toBe('runner');
	});

	it('a requirement of 0 asks nothing', () => {
		const rules: StageRules = { ...DEFAULT_STAGE_RULES, wayfarer: { ...DEFAULT_STAGE_RULES.wayfarer, days: 0 } };

		expect(stageFor(evidence({ level: 3 }), rules)).toBe('wayfarer');
	});

	it('a count of skills at a rank asks that many', () => {
		const rules: StageRules = { ...DEFAULT_STAGE_RULES, traveller: { ...DEFAULT_STAGE_RULES.traveller, skillsAtRank: { rank: 2, count: 3 } } };

		expect(stageFor({ ...LEAST.traveller, earned: earned(4, [2, 2]) }, rules)).toBe('disciple');
		expect(stageFor({ ...LEAST.traveller, earned: earned(4, [2, 3]) }, rules)).toBe('traveller');
	});
});
