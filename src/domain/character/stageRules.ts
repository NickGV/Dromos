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

/**
 * The stage the character has reached (M11 S1). Stages are sequential: the character is at the last
 * stage of the unbroken run, from the second on, whose requirements all hold, so a stage counts only
 * when every earlier one holds too and the arc is never skipped. Nothing is remembered: evidence that
 * falls back lowers the stage. Missing evidence counts as nothing, and with no character at all
 * (`null`) the stage is the first.
 */
export function stageFor(evidence: Partial<StageEvidence> | null, rules: StageRules = DEFAULT_STAGE_RULES): StageId {
	if (evidence === null) return FIRST_STAGE;
	const known = counted(evidence);
	let reached: StageId = FIRST_STAGE;
	for (const stage of LATER_STAGE_IDS) {
		if (!meets(known, rules[stage])) break;
		reached = stage;
	}
	return reached;
}

/** The evidence with every missing or unusable number read as 0, so no rule ever compares `NaN`. */
function counted(evidence: Partial<StageEvidence>): StageEvidence {
	return {
		level: amount(evidence.level),
		days: amount(evidence.days),
		earned: evidence.earned ?? [],
		totalSkills: amount(evidence.totalSkills),
		campaigns: amount(evidence.campaigns),
		books: amount(evidence.books),
	};
}

function amount(value: number | undefined): number {
	return value !== undefined && Number.isFinite(value) && value > 0 ? value : 0;
}

function meets(evidence: StageEvidence, requirements: StageRequirements): boolean {
	return (
		evidence.level >= requirements.level &&
		evidence.days >= requirements.days &&
		meetsCount(evidence.earned.length, requirements.skills, evidence.totalSkills) &&
		meetsRank(evidence, requirements.skillsAtRank) &&
		evidence.campaigns >= requirements.campaigns &&
		evidence.books >= requirements.books
	);
}

function meetsRank(evidence: StageEvidence, required: SkillsAtRank | null): boolean {
	if (required === null) return true;
	const atRank = evidence.earned.filter(({ rankIndex }) => rankIndex !== null && rankIndex >= required.rank - 1).length;
	return meetsCount(atRank, required.count, evidence.totalSkills);
}

/** `all` and `half` count the skills the vault holds; a vault that lists none never meets them. */
function meetsCount(count: number, required: number | typeof EVERY_SKILL | typeof HALF_THE_SKILLS, totalSkills: number): boolean {
	if (typeof required === 'number') return count >= required;
	if (totalSkills === 0) return false;
	return count >= (required === EVERY_SKILL ? totalSkills : Math.ceil(totalSkills / 2));
}
