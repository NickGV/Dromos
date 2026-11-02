import { describe, expect, it } from 'vitest';
import { briefingFromNote } from '../../../src/adapters/vault/briefingMapper';
import { isBriefingOf } from '../../../src/domain';

const PATH = 'Dromos/Briefing.md';
const TODAY = '2026-11-03';

describe('briefingFromNote', () => {
	it('reads a full note', () => {
		const frontmatter = {
			type: 'dromos-briefing',
			created: TODAY,
			mission: { title: 'Cerrar la pantalla de registro de Kairos', habitica_id: '3f2a1c8e', why: 'Lleva 9 días sin moverse.' },
			near_unlock: { skill: 'lector', remaining: 2 },
			stale_campaigns: ['cheshbon'],
		};

		expect(briefingFromNote(PATH, frontmatter, '\nShalom.\n\nHoy la carrera pide una sola cosa.\n')).toEqual({
			path: PATH,
			created: TODAY,
			mission: { title: 'Cerrar la pantalla de registro de Kairos', why: 'Lleva 9 días sin moverse.' },
			nearSkillId: 'lector',
			body: 'Shalom.\n\nHoy la carrera pide una sola cosa.',
		});
	});

	it('keeps the text of a note with no frontmatter, which belongs to no day', () => {
		const briefing = briefingFromNote(PATH, undefined, 'Shalom.');

		expect(briefing).toEqual({ path: PATH, created: null, mission: null, nearSkillId: null, body: 'Shalom.' });
		expect(isBriefingOf(briefing, TODAY)).toBe(false);
	});

	it('is of today when created is today', () => {
		expect(isBriefingOf(briefingFromNote(PATH, { created: TODAY }, 'Shalom.'), TODAY)).toBe(true);
	});

	it('is not of today when created is a past day', () => {
		expect(isBriefingOf(briefingFromNote(PATH, { created: '2026-11-02' }, 'Shalom.'), TODAY)).toBe(false);
	});

	it('reads created written as a date-time or as a Date', () => {
		expect(briefingFromNote(PATH, { created: `${TODAY}T07:30:00` }, '').created).toBe(TODAY);
		expect(briefingFromNote(PATH, { created: new Date(2026, 10, 3, 7, 30) }, '').created).toBe(TODAY);
	});

	it('treats a created that is not a date as no day', () => {
		expect(briefingFromNote(PATH, { created: 'hoy' }, '').created).toBeNull();
		expect(briefingFromNote(PATH, { created: 20261103 }, '').created).toBeNull();
	});

	it('has no mission without a title, and a mission without why keeps its title', () => {
		expect(briefingFromNote(PATH, { mission: { why: 'Porque sí.' } }, '').mission).toBeNull();
		expect(briefingFromNote(PATH, { mission: 'Cerrar Kairos' }, '').mission).toBeNull();
		expect(briefingFromNote(PATH, { mission: { title: 'Cerrar Kairos', why: 3 } }, '').mission).toEqual({ title: 'Cerrar Kairos', why: null });
	});

	it('has no near skill when near_unlock names none', () => {
		expect(briefingFromNote(PATH, { near_unlock: { remaining: 2 } }, '').nearSkillId).toBeNull();
		expect(briefingFromNote(PATH, { near_unlock: 'lector' }, '').nearSkillId).toBeNull();
	});
});
