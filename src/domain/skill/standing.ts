import { LevelCurve, SKILL_CURVE } from '../rules/LevelCurve';
import { rankIndexFor } from '../rules/Ranks';
import type { Skill, SkillRank } from './Skill';

const curve = new LevelCurve(SKILL_CURVE);

export interface SkillStanding {
	/** 0 while the skill is locked. */
	readonly level: number;
	readonly xpIntoLevel: number;
	/** `null` while the skill is locked: there is no next level to aim at. */
	readonly xpToNext: number | null;
	readonly rankIndex: number | null;
}

/** Level, progress and rank of a skill from its XP. A skill that has just unlocked is level 1 with 0 XP (S3). */
export function skillStanding(unlocked: boolean, xp: number): SkillStanding {
	if (!unlocked) return { level: 0, xpIntoLevel: 0, xpToNext: null, rankIndex: null };
	const { level, xpIntoLevel, xpToNext } = curve.progressFor(xp);
	return { level, xpIntoLevel, xpToNext, rankIndex: rankIndexFor(level) };
}

/** The rank the note describes at `rankIndex`, or `null` when there is none (locked, or a note with fewer ranks). */
export function rankOf(skill: Skill, rankIndex: number | null): SkillRank | null {
	return rankIndex === null ? null : (skill.ranks[rankIndex] ?? null);
}
