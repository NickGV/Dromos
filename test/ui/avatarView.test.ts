import { describe, expect, it } from 'vitest';
import type { MeasuredSkill } from '../../src/domain/skill/standing';
import { FIRST_AVATAR, MAX_SKILL_OBJECTS } from '../../src/ui/presenters/avatar';
import { avatarView } from '../../src/ui/presenters/avatarView';

function measured(id: string, level = 1, xp = 0): MeasuredSkill {
	return { id, level, xp };
}

describe('avatarView: the figure of a stage and its skills (M11 S1)', () => {
	it('draws the stage it is given', () => {
		expect(avatarView({ stage: 'scholar', skills: [] }).stage).toBe('scholar');
	});

	it('nothing earned carries nothing: the first figure is the runner with no object', () => {
		expect(avatarView({ stage: 'runner', skills: [] })).toEqual(FIRST_AVATAR);
	});

	it('the highest skill comes first: by level, then by XP, then by id, whatever order they come in', () => {
		const skills = [measured('lector', 2, 10), measured('atleta', 1, 90), measured('maestro', 2, 40)];

		expect(avatarView({ stage: 'pilgrim', skills }).objects).toEqual(['maestro', 'lector', 'atleta']);
		expect(avatarView({ stage: 'pilgrim', skills: [measured('lector', 1, 5), measured('cuidador', 1, 5)] }).objects).toEqual(['cuidador', 'lector']);
	});

	it('one object per spot: the higher skill keeps a shared spot and the next skill takes the place', () => {
		// Cronista and exegeta both sit in the hand; mayordomo and desarrollador both on the belt.
		const skills = [measured('cronista', 3), measured('exegeta', 4), measured('mayordomo', 2), measured('desarrollador', 2, 10), measured('atleta', 1)];

		expect(avatarView({ stage: 'student', skills }).objects).toEqual(['exegeta', 'desarrollador', 'atleta']);
	});

	it(`carries at most ${MAX_SKILL_OBJECTS} objects, the highest skills`, () => {
		const skills = [measured('atleta', 5), measured('centinela', 4), measured('cuidador', 3), measured('lector', 2), measured('reposo', 1)];

		expect(avatarView({ stage: 'mentor', skills }).objects).toEqual(['atleta', 'centinela', 'cuidador']);
	});

	it('a skill with no object gives nothing and takes no place', () => {
		const skills = [measured('herrero', 9), measured('constructor', 8), measured('__proto__', 7), measured('lector', 1)];

		expect(avatarView({ stage: 'wayfarer', skills }).objects).toEqual(['lector']);
	});
});
