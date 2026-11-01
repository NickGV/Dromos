import { describe, expect, it } from 'vitest';
import { rankOf, skillStanding } from '../../../src/domain/skill/standing';
import { skill } from './skillFixtures';

describe('skillStanding: level, progress and rank of a skill (S3, S4)', () => {
	it('a locked skill is level 0, has no XP to next and no rank', () => {
		expect(skillStanding(false, 500)).toEqual({ level: 0, xpIntoLevel: 0, xpToNext: null, rankIndex: null });
	});

	it('a skill that was just unlocked is level 1 with 0 XP and the first rank', () => {
		expect(skillStanding(true, 0)).toEqual({ level: 1, xpIntoLevel: 0, xpToNext: 100, rankIndex: 0 });
	});

	it('follows the skill curve: 100 XP to level 2, then 246 to level 3', () => {
		expect(skillStanding(true, 100)).toEqual({ level: 2, xpIntoLevel: 0, xpToNext: 246, rankIndex: 0 });
		expect(skillStanding(true, 346)).toMatchObject({ level: 3, xpIntoLevel: 0 });
	});

	it('changes rank at levels 5 and 10', () => {
		const level5 = 100 + 246 + 417 + 606; // xp to leave levels 1, 2, 3 and 4
		expect(skillStanding(true, level5 - 1)).toMatchObject({ level: 4, rankIndex: 0 });
		expect(skillStanding(true, level5)).toMatchObject({ level: 5, rankIndex: 1 });
	});

	it('reads invalid XP as zero', () => {
		expect(skillStanding(true, Number.NaN)).toMatchObject({ level: 1, xpIntoLevel: 0 });
	});
});

describe('rankOf', () => {
	const ranks = [0, 1, 2, 3, 4].map((index) => ({ name: `Rank ${index}`, description: `Description ${index}` }));

	it('returns the rank at the index', () => {
		expect(rankOf(skill({ ranks }), 2)).toEqual({ name: 'Rank 2', description: 'Description 2' });
	});

	it('returns null without an index, for a locked skill, or when the note has fewer ranks', () => {
		expect(rankOf(skill({ ranks }), null)).toBeNull();
		expect(rankOf(skill({ ranks: ranks.slice(0, 2) }), 4)).toBeNull();
		expect(rankOf(skill(), 0)).toBeNull();
	});
});
