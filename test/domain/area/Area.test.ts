import { describe, expect, it } from 'vitest';
import { habitSkills, isReadingHabit, READING_SKILL } from '../../../src/domain';
import { area, habit } from '../campaign/campaignFixtures';

const bibliotheke = area({ title: 'Archeion - Bibliotheke', skills: ['lector'] });
const learnings = area({ path: '03 - Areas/Learnings/Archeion - Learnings.md', title: 'Archeion - Learnings', skills: ['lector'] });
const bible = area({ path: '03 - Areas/Bible/Archeion - Bible.md', title: 'Archeion - Bible', skills: ['teologo'] });

describe('habitSkills', () => {
	it('is the habit own skills when it has some, else the skills of the note it is declared in', () => {
		expect(habitSkills(habit('Leer', { skills: ['estudiante'] }), ['lector'])).toEqual(['estudiante']);
		expect(habitSkills(habit('Leer'), ['lector', 'escritor'])).toEqual(['lector', 'escritor']);
		expect(habitSkills(habit('Leer'), [])).toEqual([]);
	});
});

describe('isReadingHabit (ADR-017, 2026-11-09 change)', () => {
	it('uses the skill of the reading to-do, lector', () => {
		expect(READING_SKILL).toBe('lector');
	});

	it('shows a Bibliotheke habit whose own skill is lector', () => {
		expect(isReadingHabit(habit('Leer 10 minutos', { skills: ['lector'] }), bibliotheke)).toBe(true);
	});

	it('does not show a Learnings habit whose own skill is another, though its Archeion is lector', () => {
		expect(isReadingHabit(habit('Repasar', { skills: ['estudiante'] }), learnings)).toBe(false);
	});

	it('shows a Learnings habit with no skill: it falls back to its Archeion, lector', () => {
		expect(isReadingHabit(habit('Leer un artículo'), learnings)).toBe(true);
	});

	it('shows a Bible habit whose own skill is lector, though its Archeion is teologo', () => {
		expect(isReadingHabit(habit('Leer la Biblia', { skills: ['lector'] }), bible)).toBe(true);
		expect(isReadingHabit(habit('Orar'), bible)).toBe(false);
	});
});
