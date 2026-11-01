import { describe, expect, it } from 'vitest';
import { longestStreakBySkill } from '../../../src/domain/skill/habitEvidence';

const daily = (skills: string[], streak: number | null) => ({ kind: 'daily' as const, skills, streak });

describe('longestStreakBySkill: the habit evidence of a skill', () => {
	it('is the longest streak among the dailies tagged with the skill', () => {
		const result = longestStreakBySkill([daily(['reposo'], 9), daily(['reposo', 'cuidador'], 21), daily(['cuidador'], 4)]);

		expect(result.get('reposo')).toBe(21);
		expect(result.get('cuidador')).toBe(21);
	});

	it('gives nothing for a skill with no daily', () => {
		expect(longestStreakBySkill([daily(['reposo'], 3)]).get('lector')).toBeUndefined();
	});

	it('ignores to-dos, dailies without skill and invalid streaks', () => {
		const result = longestStreakBySkill([
			{ kind: 'todo', skills: ['reposo'], streak: 50 },
			daily([], 30),
			daily(['reposo'], null),
			daily(['reposo'], -4),
			daily(['reposo'], Number.NaN),
		]);

		expect(result.size).toBe(0);
	});
});
