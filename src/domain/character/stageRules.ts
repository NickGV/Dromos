import type { SkillStanding } from '../skill/standing';
import { FIRST_STAGE, STAGE_IDS, type StageId } from './Stage';

/** Every stage after the first: the runner asks nothing, so it has no rule. */
export type LaterStageId = Exclude<StageId, (typeof STAGE_IDS)[0]>;

/** The stages that ask something, in order. */
export const LATER_STAGE_IDS = STAGE_IDS.slice(1) as readonly LaterStageId[];

/** "Every skill": each skill the vault holds, earned. */
export const EVERY_SKILL = 'all';
/** "Half of them": half of every skill the vault holds, rounded up. */
export const HALF_THE_SKILLS = 'half';

/** Earned skills at a rank or higher. */
export interface SkillsAtRank {
	/** Rank N is the N-th entry of the rank levels, 1-based: rank 2 starts at level 5 by default. */
	readonly rank: number;
	readonly count: number | typeof HALF_THE_SKILLS;
}

/** What one stage asks (M11 S1). Every number is a least amount, and 0 asks nothing. */
export interface StageRequirements {
	/** The character's level. */
	readonly level: number;
	/** Days on the road, since `game_start`. */
	readonly days: number;
	/** Earned skills. */
	readonly skills: number | typeof EVERY_SKILL;
	/** `null` asks for no skill at any rank. */
	readonly skillsAtRank: SkillsAtRank | null;
	/** Finished campaigns. */
	readonly campaigns: number;
	/** Finished books. */
	readonly books: number;
}

/** What each stage after the first asks; `Rules.md` may change any part (M11 S1). */
export type StageRules = Readonly<Record<LaterStageId, StageRequirements>>;

const NOTHING: StageRequirements = { level: 0, days: 0, skills: 0, skillsAtRank: null, campaigns: 0, books: 0 };

function asks(requirements: Partial<StageRequirements>): StageRequirements {
	return { ...NOTHING, ...requirements };
}

/**
 * The requirement table of S1 (L9, settled in L11): the sage at level 30 takes 10 years or more,
 * and every stage before it combines the level with skills, ranks, campaigns, books and days.
 */
export const DEFAULT_STAGE_RULES: StageRules = {
	wayfarer: asks({ level: 3, days: 30 }),
	pilgrim: asks({ level: 5, skills: 1 }),
	apprentice: asks({ level: 7, skills: 2, campaigns: 1 }),
	disciple: asks({ level: 9, skills: 3, books: 5 }),
	traveller: asks({ level: 11, skills: 4, skillsAtRank: { rank: 2, count: 1 } }),
	student: asks({ level: 13, skills: 5, campaigns: 3 }),
	scholar: asks({ level: 16, skills: 6, skillsAtRank: { rank: 3, count: 2 }, books: 20 }),
	mentor: asks({ level: 19, skills: 8 }),
	counsellor: asks({ level: 22, skills: 10, campaigns: 10 }),
	elder: asks({ level: 26, skills: 12, skillsAtRank: { rank: 4, count: 4 } }),
	sage: asks({ level: 30, skills: EVERY_SKILL, skillsAtRank: { rank: 4, count: HALF_THE_SKILLS }, books: 50 }),
};

/** What the vault says of the character, for the stage rules. */
export interface StageEvidence {
	readonly level: number;
	/** Days since `game_start`. */
	readonly days: number;
	/** One entry per earned skill, with the rank it holds (`null` for none). */
	readonly earned: readonly Pick<SkillStanding, 'rankIndex'>[];
	/** Every skill the vault holds, earned or not: what "every skill" and "half of them" count. */
	readonly totalSkills: number;
	readonly campaigns: number;
	readonly books: number;
}

/** One part of what a stage asks, in the order of the requirement table. */
export type StageRequirementId = 'level' | 'days' | 'skills' | 'skillsAtRank' | 'campaigns' | 'books';

/** One part a stage asks, against what the vault holds (stage-card S1). */
export interface StageRequirementProgress {
	readonly id: StageRequirementId;
	/** What the vault holds now: the level, the days, the earned skills, those at the rank or above, the finished campaigns or books. */
	readonly value: number;
	/** The least the stage asks; "every skill" and "half of them" are counted from the skills the vault holds. */
	readonly target: number;
	/** How the stage words a count of skills: a number, every skill or half of them; `count` for every other part. */
	readonly share: 'count' | typeof EVERY_SKILL | typeof HALF_THE_SKILLS;
	/** The rank, rank N being the N-th, for `skillsAtRank`; `null` for every other part. */
	readonly rank: number | null;
	/** What `stageFor` checks: a vault that lists no skill never meets "every skill" nor half of them. */
	readonly met: boolean;
}

/**
 * The stage the character has reached (M11 S1). Stages are sequential: the character is at the last
 * stage of the unbroken run, from the second on, whose requirements all hold, so a stage counts only
 * when every earlier one holds too and the arc is never skipped. Nothing is remembered: evidence that
 * falls back lowers the stage. Missing evidence counts as nothing, and with no character at all
 * (`null`) the stage is the first.
 */
export function stageFor(evidence: Partial<StageEvidence> | null, rules: StageRules = DEFAULT_STAGE_RULES): StageId {
	if (evidence === null) return FIRST_STAGE;
	const known = countedEvidence(evidence);
	let reached: StageId = FIRST_STAGE;
	for (const stage of LATER_STAGE_IDS) {
		if (!progressOf(known, rules[stage]).every(({ met }) => met)) break;
		reached = stage;
	}
	return reached;
}

/**
 * What a stage asks, one entry per part it asks, in the table's order, each with what the vault
 * holds, the target and whether it is met (stage-card S1). A part of 0, or a count of 0 at a rank,
 * asks nothing and is left out. It is the very check `stageFor` makes, so the stage card and the
 * figure never disagree; missing or unusable evidence counts as 0 here too.
 */
export function stageProgress(evidence: Partial<StageEvidence> | null, requirements: StageRequirements): StageRequirementProgress[] {
	return progressOf(countedEvidence(evidence), requirements);
}

/** The evidence with every missing or unusable number read as 0, so no rule ever compares `NaN`: what the rules count. */
export function countedEvidence(evidence: Partial<StageEvidence> | null): StageEvidence {
	return {
		level: amount(evidence?.level),
		days: amount(evidence?.days),
		earned: evidence?.earned ?? [],
		totalSkills: amount(evidence?.totalSkills),
		campaigns: amount(evidence?.campaigns),
		books: amount(evidence?.books),
	};
}

function amount(value: number | undefined): number {
	return value !== undefined && Number.isFinite(value) && value > 0 ? value : 0;
}

function progressOf(evidence: StageEvidence, requirements: StageRequirements): StageRequirementProgress[] {
	const parts: StageRequirementProgress[] = [];
	const plain = (id: StageRequirementId, value: number, target: number): void => {
		if (target > 0) parts.push({ id, value, target, share: 'count', rank: null, met: value >= target });
	};
	plain('level', evidence.level, requirements.level);
	plain('days', evidence.days, requirements.days);
	if (requirements.skills !== 0) parts.push(skillCount('skills', evidence.earned.length, requirements.skills, null, evidence.totalSkills));
	const atRank = requirements.skillsAtRank;
	if (atRank !== null && atRank.count !== 0) {
		const value = evidence.earned.filter(({ rankIndex }) => rankIndex !== null && rankIndex >= atRank.rank - 1).length;
		parts.push(skillCount('skillsAtRank', value, atRank.count, atRank.rank, evidence.totalSkills));
	}
	plain('campaigns', evidence.campaigns, requirements.campaigns);
	plain('books', evidence.books, requirements.books);
	return parts;
}

/** `all` and `half` count the skills the vault holds; a vault that lists none never meets them. */
function skillCount(id: StageRequirementId, value: number, required: number | typeof EVERY_SKILL | typeof HALF_THE_SKILLS, rank: number | null, totalSkills: number): StageRequirementProgress {
	if (typeof required === 'number') return { id, value, target: required, share: 'count', rank, met: value >= required };
	const target = required === EVERY_SKILL ? totalSkills : Math.ceil(totalSkills / 2);
	return { id, value, target, share: required, rank, met: totalSkills > 0 && value >= target };
}
