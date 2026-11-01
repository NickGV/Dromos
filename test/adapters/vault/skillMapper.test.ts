import { describe, expect, it } from 'vitest';
import { buildSkills, isSkillNote, skillFromNote } from '../../../src/adapters/vault/skillMapper';

// Frontmatter of Dromos/Skills/lector.md in the Logos vault.
const LECTOR = {
	type: 'dromos-skill',
	created: '2026-10-31',
	id: 'lector',
	name: 'Lector',
	icon: '📖',
	stat: 'inteligencia',
	description: 'Leer libros completos y sacarles provecho.',
	habitica_tag: 'skill/lector',
	ranks: [
		{ name: 'Hojeador', description: 'Abre libros y los recorre sin prisa.' },
		{ name: 'Lector constante', description: 'Termina lo que empieza y toma notas.' },
		{ name: 'Lector atento', description: 'Conecta lo leído con lo que ya sabe.' },
		{ name: 'Lector profundo', description: 'Relee, contrasta y cuestiona al autor.' },
		{ name: 'Maestro lector', description: 'Lee con método y deja lo leído en el vault.' },
	],
	requirements: [{ kind: 'quests', count: 5 }],
	unlocked: false,
	unlocked_on: null,
	level: 0,
	xp: 0,
	xp_to_next: null,
};

const CENTINELA = {
	...LECTOR,
	id: 'centinela',
	name: 'Centinela',
	stat: 'disciplina',
	habitica_tag: 'skill/centinela',
	requirements: [
		{ kind: 'habit', days: 21 },
		{ kind: 'manual', id: 'deep-work-test', text: 'Pasar el Deep Work Test de la semana 1', confirmed: false, confirmed_on: null },
	],
};

const note = (frontmatter: unknown, path = 'Dromos/Skills/lector.md') => ({ path, frontmatter });
const invalid = (frontmatter: unknown, path?: string) => {
	const result = skillFromNote(note(frontmatter, path));
	if (result.kind !== 'invalid') throw new Error('expected an invalid skill');
	return result.reason;
};

describe('skillFromNote: reading a skill note', () => {
	it('maps a full locked skill', () => {
		expect(skillFromNote(note(LECTOR))).toEqual({
			kind: 'skill',
			skill: {
				id: 'lector',
				name: 'Lector',
				icon: '📖',
				stat: 'inteligencia',
				description: 'Leer libros completos y sacarles provecho.',
				habiticaTag: 'skill/lector',
				ranks: LECTOR.ranks,
				requirements: [{ kind: 'quests', count: 5 }],
				unlocked: false,
				unlockedOn: null,
			},
		});
	});

	it('maps habit and manual requirements', () => {
		const result = skillFromNote(note(CENTINELA, 'Dromos/Skills/centinela.md'));

		expect(result).toMatchObject({
			kind: 'skill',
			skill: {
				requirements: [
					{ kind: 'habit', days: 21 },
					{ kind: 'manual', id: 'deep-work-test', text: 'Pasar el Deep Work Test de la semana 1', confirmed: false, confirmedOn: null },
				],
			},
		});
	});

	it('maps a campaigns requirement and a confirmed manual one with its date', () => {
		const frontmatter = {
			...LECTOR,
			requirements: [
				{ kind: 'campaigns', count: 1 },
				{ kind: 'manual', id: 'x', text: 'Done', confirmed: true, confirmed_on: '2026-11-09' },
			],
		};

		expect(skillFromNote(note(frontmatter))).toMatchObject({
			skill: { requirements: [{ kind: 'campaigns', count: 1 }, { kind: 'manual', confirmed: true, confirmedOn: '2026-11-09' }] },
		});
	});

	it('reads the unlock projection: unlocked and its date', () => {
		expect(skillFromNote(note({ ...LECTOR, unlocked: true, unlocked_on: '2026-11-09' }))).toMatchObject({
			skill: { unlocked: true, unlockedOn: '2026-11-09' },
		});
	});

	it('an unlock by hand without a date is unlocked with no date yet', () => {
		expect(skillFromNote(note({ ...LECTOR, unlocked: true, unlocked_on: null }))).toMatchObject({ skill: { unlocked: true, unlockedOn: null } });
	});

	it('a locked skill ignores a stray date; only `true` unlocks', () => {
		expect(skillFromNote(note({ ...LECTOR, unlocked: false, unlocked_on: '2026-11-09' }))).toMatchObject({ skill: { unlocked: false, unlockedOn: null } });
		expect(skillFromNote(note({ ...LECTOR, unlocked: 'yes' }))).toMatchObject({ skill: { unlocked: false } });
	});

	it('ignores the derived projection fields: level, xp and xp_to_next', () => {
		const result = skillFromNote(note({ ...LECTOR, level: 9, xp: 99999, xp_to_next: 1 }));

		expect(result).toEqual(skillFromNote(note(LECTOR)));
	});

	it('uses the file name as id when the note has none, and the id as name when it has no name', () => {
		const { id: _id, name: _name, ...rest } = LECTOR;

		expect(skillFromNote(note(rest))).toMatchObject({ skill: { id: 'lector', name: 'lector' } });
	});

	it('defaults the optional text fields and keeps the rest valid', () => {
		const result = skillFromNote(note({ type: 'dromos-skill', id: 'lector', stat: 'inteligencia' }));

		expect(result).toEqual({
			kind: 'skill',
			skill: {
				id: 'lector',
				name: 'lector',
				icon: '',
				stat: 'inteligencia',
				description: '',
				habiticaTag: 'skill/lector',
				ranks: [],
				requirements: [],
				unlocked: false,
				unlockedOn: null,
			},
		});
	});

	it('keeps at most five ranks and skips the ones without a name', () => {
		const ranks = [...LECTOR.ranks, { name: 'Sixth', description: 'x' }, { description: 'no name' }, 'text'];
		const frontmatter = { ...LECTOR, ranks: [{ description: 'no name' }, ...ranks] };

		const result = skillFromNote(note(frontmatter));

		expect(result).toMatchObject({ skill: { ranks: LECTOR.ranks } });
	});
});

describe('skillFromNote: invalid notes are reported, never half-read', () => {
	it('an id that differs from the file name', () => {
		expect(invalid({ ...LECTOR, id: 'otro' })).toBe('The id "otro" does not match the file name "lector".');
	});

	it('an unknown stat', () => {
		expect(invalid({ ...LECTOR, stat: 'carisma' })).toBe('Unknown stat "carisma".');
		expect(invalid({ ...LECTOR, stat: undefined })).toBe('Unknown stat "undefined".');
	});

	it('a Habitica tag that is not skill/<id>', () => {
		expect(invalid({ ...LECTOR, habitica_tag: 'skills/lector' })).toBe('The Habitica tag must be "skill/lector".');
	});

	it.each([
		['an unknown kind', { kind: 'visits', count: 3 }],
		['a missing kind', { count: 3 }],
		['a zero count', { kind: 'quests', count: 0 }],
		['a text count', { kind: 'quests', count: '5' }],
		['a fractional count', { kind: 'campaigns', count: 1.5 }],
		['a missing habit days', { kind: 'habit' }],
		['a manual without text', { kind: 'manual', id: 'x', confirmed: false }],
		['a manual without id', { kind: 'manual', text: 'x', confirmed: false }],
		['a plain text', 'quests'],
	])('a requirement with %s: dropping it would unlock the skill too easily', (_label, requirement) => {
		expect(invalid({ ...LECTOR, requirements: [{ kind: 'quests', count: 1 }, requirement] })).toBe('Requirement 2 is not valid.');
	});

	it('requirements that are not a list', () => {
		expect(invalid({ ...LECTOR, requirements: { kind: 'quests', count: 5 } })).toBe('The requirements must be a list.');
	});

	it('a manual requirement that is not confirmed with a boolean stays unconfirmed', () => {
		const frontmatter = { ...LECTOR, requirements: [{ kind: 'manual', id: 'x', text: 'T', confirmed: 'true' }] };

		expect(skillFromNote(note(frontmatter))).toMatchObject({ skill: { requirements: [{ confirmed: false, confirmedOn: null }] } });
	});
});

describe('buildSkills', () => {
	it('keeps only dromos-skill notes, reports the invalid ones and sorts by id', () => {
		const notes = [
			note(CENTINELA, 'Dromos/Skills/centinela.md'),
			note({ type: 'dromos-character' }, 'Dromos/Character.md'),
			note({ ...LECTOR, stat: 'nope' }, 'Dromos/Skills/broken.md'),
			note(LECTOR),
		];

		const { skills, invalid: problems } = buildSkills(notes);

		expect(skills.map((skill) => skill.id)).toEqual(['centinela', 'lector']);
		expect(problems).toEqual([{ path: 'Dromos/Skills/broken.md', reason: 'The id "lector" does not match the file name "broken".' }]);
	});

	it('is a skill note only when type is dromos-skill', () => {
		expect(isSkillNote(note(LECTOR))).toBe(true);
		expect(isSkillNote(note({ type: 'dromos-ledger' }))).toBe(false);
		expect(isSkillNote(note(undefined))).toBe(false);
	});
});
