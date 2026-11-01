import { describe, expect, it } from 'vitest';
import {
	applyCharacterProjection,
	applySkillProjection,
	characterProjectionChanged,
	skillProjectionChanged,
	type CharacterProjection,
	type SkillProjection,
} from '../../../src/adapters/vault/projections';

const CHARACTER: CharacterProjection = {
	level: 3,
	totalXp: 400,
	xpToNext: 520,
	stats: { fuerza: 5, vitalidad: 0, inteligencia: 25, sabiduria: 0, espiritu: 10, disciplina: 0 },
	lastSync: '2026-11-09',
};

const NOTE = () => ({
	type: 'dromos-character',
	created: '2026-10-28',
	name: 'Nicolás',
	title: 'Corredor',
	level: 1,
	total_xp: 0,
	xp_to_next: 100,
	stats: { fuerza: 0, inteligencia: 0, espiritu: 0, disciplina: 0 },
	last_sync: null,
	updated_by: 'manual',
});

describe('applyCharacterProjection', () => {
	it('writes the derived fields and the six stats, and marks Dromos as the writer', () => {
		const frontmatter: Record<string, unknown> = NOTE();

		applyCharacterProjection(frontmatter, CHARACTER);

		expect(frontmatter).toEqual({
			type: 'dromos-character',
			created: '2026-10-28',
			name: 'Nicolás',
			title: 'Corredor',
			level: 3,
			total_xp: 400,
			xp_to_next: 520,
			stats: { fuerza: 5, inteligencia: 25, espiritu: 10, disciplina: 0, vitalidad: 0, sabiduria: 0 },
			last_sync: '2026-11-09',
			updated_by: 'dromos',
		});
	});

	it('never touches the fields that belong to the user and Esdras', () => {
		const frontmatter: Record<string, unknown> = { ...NOTE(), mood: 'calm' };

		applyCharacterProjection(frontmatter, CHARACTER);

		expect(frontmatter).toMatchObject({ name: 'Nicolás', title: 'Corredor', created: '2026-10-28', mood: 'calm' });
	});

	it('creates the stats map when the note has none or has a wrong one', () => {
		for (const stats of [undefined, null, 7, ['x']]) {
			const frontmatter: Record<string, unknown> = { ...NOTE(), stats };

			applyCharacterProjection(frontmatter, CHARACTER);

			expect(frontmatter.stats).toEqual(CHARACTER.stats);
		}
	});

	it('is idempotent', () => {
		const once: Record<string, unknown> = NOTE();
		applyCharacterProjection(once, CHARACTER);
		const twice = structuredClone(once);

		applyCharacterProjection(twice, CHARACTER);

		expect(twice).toEqual(once);
	});
});

describe('characterProjectionChanged', () => {
	it('is true for a note that disagrees', () => {
		expect(characterProjectionChanged(NOTE(), CHARACTER)).toBe(true);
	});

	it('is false once the note holds the projection, even on another day: last_sync alone never rewrites the note', () => {
		const frontmatter: Record<string, unknown> = NOTE();
		applyCharacterProjection(frontmatter, CHARACTER);

		expect(characterProjectionChanged(frontmatter, CHARACTER)).toBe(false);
		expect(characterProjectionChanged(frontmatter, { ...CHARACTER, lastSync: '2026-11-10' })).toBe(false);
	});

	it('is true when one stat differs', () => {
		const frontmatter: Record<string, unknown> = NOTE();
		applyCharacterProjection(frontmatter, CHARACTER);

		expect(characterProjectionChanged(frontmatter, { ...CHARACTER, stats: { ...CHARACTER.stats, sabiduria: 1 } })).toBe(true);
	});

	it('is true for a note without frontmatter', () => {
		expect(characterProjectionChanged(undefined, CHARACTER)).toBe(true);
	});
});

const LOCKED: SkillProjection = { unlocked: false, unlockedOn: null, level: 0, xp: 0, xpToNext: null };
const UNLOCKED: SkillProjection = { unlocked: true, unlockedOn: '2026-11-09', level: 1, xp: 0, xpToNext: 100 };

const SKILL = () => ({
	type: 'dromos-skill',
	id: 'lector',
	name: 'Lector',
	requirements: [{ kind: 'quests', count: 5 }],
	unlocked: false,
	unlocked_on: null,
	level: 0,
	xp: 0,
	xp_to_next: null,
});

describe('applySkillProjection', () => {
	it('writes the unlock and the standing, and nothing else', () => {
		const frontmatter: Record<string, unknown> = SKILL();

		applySkillProjection(frontmatter, UNLOCKED);

		expect(frontmatter).toEqual({
			type: 'dromos-skill',
			id: 'lector',
			name: 'Lector',
			requirements: [{ kind: 'quests', count: 5 }],
			unlocked: true,
			unlocked_on: '2026-11-09',
			level: 1,
			xp: 0,
			xp_to_next: 100,
		});
	});

	it('writes a locked skill as null date and null xp_to_next', () => {
		const frontmatter: Record<string, unknown> = { ...SKILL(), unlocked: true, unlocked_on: '2026-11-09', level: 4, xp: 500, xp_to_next: 417 };

		applySkillProjection(frontmatter, LOCKED);

		expect(frontmatter).toMatchObject({ unlocked: false, unlocked_on: null, level: 0, xp: 0, xp_to_next: null });
	});
});

describe('skillProjectionChanged', () => {
	it('is false when the note already holds the projection', () => {
		const frontmatter: Record<string, unknown> = SKILL();
		applySkillProjection(frontmatter, UNLOCKED);

		expect(skillProjectionChanged(frontmatter, UNLOCKED)).toBe(false);
	});

	it('is true when the level, the XP or the unlock differ', () => {
		const frontmatter: Record<string, unknown> = SKILL();
		applySkillProjection(frontmatter, UNLOCKED);

		expect(skillProjectionChanged(frontmatter, { ...UNLOCKED, level: 2 })).toBe(true);
		expect(skillProjectionChanged(frontmatter, { ...UNLOCKED, xp: 40 })).toBe(true);
		expect(skillProjectionChanged(frontmatter, LOCKED)).toBe(true);
	});
});
