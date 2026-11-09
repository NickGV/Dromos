import { describe, expect, it } from 'vitest';
import { areaFromNote, buildAreas, isAreaNote } from '../../../src/adapters/vault/areaMapper';
import { buildActiveCampaigns, buildCompletedCampaigns, type VaultNote } from '../../../src/adapters/vault/campaignMapper';

const ID = '3f2a1c8e-0000-4000-8000-000000000001';
const BIBLIOTHEKE = '03 - Areas/Bibliotheke/Archeion - Bibliotheke.md';

function note(path: string, frontmatter: unknown): VaultNote {
	return { path, frontmatter, createdOn: '2026-11-06' };
}

const archeion = (frontmatter: Record<string, unknown>, path = BIBLIOTHEKE): VaultNote =>
	note(path, { type: 'archeion', status: 'active', title: 'Archeion - Bibliotheke', skill: ['lector'], ...frontmatter });

describe('isAreaNote (ADR-017)', () => {
	it('accepts an archeion note whose status is not archived, a missing status included', () => {
		for (const status of ['active', 'planning', 'paused', 'completed', undefined]) expect(isAreaNote(archeion({ status }))).toBe(true);
	});

	it('rejects an archived archeion and every other type', () => {
		expect(isAreaNote(archeion({ status: 'archived' }))).toBe(false);
		for (const type of ['index', 'research', 'study-session', 'book', undefined]) expect(isAreaNote(archeion({ type }))).toBe(false);
		expect(isAreaNote(note(BIBLIOTHEKE, undefined))).toBe(false);
	});
});

describe('areaFromNote (ADR-017)', () => {
	it('maps its path, title, skills and habits, with the schema of a campaign habit', () => {
		const area = areaFromNote(
			archeion({
				skill: ['Lector', 'escritor'],
				habits: [
					{ title: 'Leer 10 minutos', days: 21, skill: 'lector', habitica_id: ` ${ID} ` },
					{ title: 'Releer notas', habitica_id: null },
				],
			}),
		);

		expect(area).toEqual({
			path: BIBLIOTHEKE,
			title: 'Archeion - Bibliotheke',
			skills: ['lector', 'escritor'],
			habits: [
				{ title: 'Leer 10 minutos', days: 21, skills: ['lector'], habiticaId: ID, streak: null },
				{ title: 'Releer notas', days: 21, skills: [], habiticaId: null, streak: null },
			],
		});
	});

	it('takes the file name as title when the frontmatter has none, and reads a single skill as a list', () => {
		const area = areaFromNote(archeion({ title: '  ', skill: 'lector' }));

		expect(area.title).toBe('Archeion - Bibliotheke');
		expect(area.skills).toEqual(['lector']);
		expect(areaFromNote(archeion({ title: undefined }, '03 - Areas/Kairos/Archeion - Kairos.md')).title).toBe('Archeion - Kairos');
	});

	it('falls back to no skills and no habits for missing or wrongly typed fields, never a throw', () => {
		expect(areaFromNote(archeion({ skill: undefined, habits: 'text' }))).toMatchObject({ skills: [], habits: [] });
		expect(areaFromNote(archeion({ skill: 7, habits: [{ days: 3 }, null, { title: 'Ok', days: 'x' }] })).habits).toEqual([
			{ title: 'Ok', days: 21, skills: [], habiticaId: null, streak: null },
		]);
	});
});

describe('buildAreas (ADR-017)', () => {
	it('lists the areas that are not archived, ordered by title, and nothing else', () => {
		const notes = [
			archeion({ title: 'Archeion - Kairos', skill: 'desarrollador' }, '03 - Areas/Kairos/Archeion - Kairos.md'),
			archeion({}),
			archeion({ title: 'Archeion - Cheshbon', status: 'archived' }, '03 - Areas/Cheshbon/Archeion - Cheshbon.md'),
			note('02 - Projects/Dromos/README.md', { type: 'index', status: 'active', title: 'Dromos', habits: [{ title: 'Leer 10 minutos' }] }),
		];

		expect(buildAreas(notes).map((area) => area.title)).toEqual(['Archeion - Bibliotheke', 'Archeion - Kairos']);
	});

	it('areas are never campaigns: the campaign lists leave archeion notes out', () => {
		const notes = [
			archeion({ habits: [{ title: 'Leer 10 minutos' }] }),
			archeion({ status: 'completed' }, '03 - Areas/Old/Archeion - Old.md'),
			archeion({}, '02 - Projects/Odd/README.md'),
			note('02 - Projects/Dromos/README.md', { type: 'index', status: 'active', title: 'Dromos' }),
		];

		expect(buildActiveCampaigns(notes).map((campaign) => campaign.title)).toEqual(['Dromos']);
		expect(buildCompletedCampaigns(notes)).toEqual([]);
	});
});
