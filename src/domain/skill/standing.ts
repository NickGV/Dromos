import { DEFAULT_RULES, type GameRules } from '../rules/GameRules';
import { LevelCurve } from '../rules/LevelCurve';
import { rankIndexFor } from '../rules/Ranks';
import type { Skill, SkillRank } from './Skill';

export interface SkillStanding {
	/** 0 while the skill is locked. */
	readonly level: number;
	readonly xpIntoLevel: number;
	/** `null` while the skill is locked: there is no next level to aim at. */
	readonly xpToNext: number | null;
	readonly rankIndex: number | null;
}

/** Level, progress and rank of a skill from its XP. A skill that has just unlocked is level 1 with 0 XP (S3). */
export function skillStanding(unlocked: boolean, xp: number, rules: Pick<GameRules, 'skillCurve' | 'rankLevels'> = DEFAULT_RULES): SkillStanding {
	if (!unlocked) return { level: 0, xpIntoLevel: 0, xpToNext: null, rankIndex: null };
	const { level, xpIntoLevel, xpToNext } = new LevelCurve(rules.skillCurve).progressFor(xp);
	return { level, xpIntoLevel, xpToNext, rankIndex: rankIndexFor(level, rules.rankLevels) };
}

/** The rank the note describes at `rankIndex`, or `null` when there is none (locked, or a note with fewer ranks). */
export function rankOf(skill: Skill, rankIndex: number | null): SkillRank | null {
	return rankIndex === null ? null : (skill.ranks[rankIndex] ?? null);
}

/** An earned skill measured against the others: its level, and its XP since it was earned. */
export interface MeasuredSkill {
	readonly id: string;
	readonly level: number;
	readonly xp: number;
}

/**
 * Highest first (M11 S1): the higher level, then the more XP, then the id, so the order never
 * depends on how the vault lists the skills.
 */
export function byHighestSkill(left: MeasuredSkill, right: MeasuredSkill): number {
	return right.level - left.level || right.xp - left.xp || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
}
