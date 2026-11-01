import { describe, expect, it } from 'vitest';
import { skillIdFromTag, skillTag } from '../../../src/domain/skill/Skill';

describe('skill tags: skill/<id> (S14)', () => {
	it('builds the tag of a skill', () => {
		expect(skillTag('lector')).toBe('skill/lector');
	});

	it.each([
		['skill/lector', 'lector'],
		['skill/labiolector', 'labiolector'],
		['Skill/Lector', 'lector'],
		['  skill/atleta ', 'atleta'],
	])('reads the skill id out of the tag %s', (tag, id) => {
		expect(skillIdFromTag(tag)).toBe(id);
	});

	it.each(['', 'skill/', 'skill', 'lector', 'area/lector', 'skill/a/b', 'skill/ '])('%j is not a skill tag', (tag) => {
		expect(skillIdFromTag(tag)).toBeNull();
	});
});
