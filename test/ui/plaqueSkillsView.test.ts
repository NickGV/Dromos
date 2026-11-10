import { describe, expect, it } from 'vitest';
import { createTranslator } from '../../src/i18n';
import { plaqueSkillsView } from '../../src/ui/presenters/plaqueSkillsView';
import type { SkillCardView, SkillsPageView } from '../../src/ui/presenters/skillsView';

const en = createTranslator('en');
const es = createTranslator('es');

/** A skill card as `skillsPageView` builds it: earned at level 1, or locked at `progress` percent. */
function card(id: string, progress: number | 'earned'): SkillCardView {
	const unlocked = progress === 'earned';
	return {
		id,
		icon: 'book-open',
		name: id,
		statLabel: 'Intelligence',
		description: '',
		unlocked,
		level: unlocked ? 1 : null,
		levelText: unlocked ? 'Level 1' : null,
		rankName: null,
		rankDescription: null,
		caption: unlocked ? null : `${id} to do`,
		xp: unlocked ? { current: 40, total: 100, percent: 40, text: '40 / 100 XP' } : null,
		requirements: [],
		progressPercent: unlocked ? 100 : progress,
		earnedText: null,
	};
}

function page(earned: readonly SkillCardView[], locked: readonly SkillCardView[], emptyText: string | null = null): SkillsPageView {
	return { title: 'Skills', emptyText, notice: null, earned, locked, problems: [] };
}

const ids = (view: ReturnType<typeof plaqueSkillsView>): string[] => view?.rings.map((ring) => ring.id) ?? [];

describe('plaqueSkillsView: the skills on the plaque (S3)', () => {
	it('shows the four locked skills with the highest progress first', () => {
		const view = plaqueSkillsView(page([card('reader', 'earned')], [card('a', 10), card('b', 80), card('c', 50), card('d', 0), card('e', 65)]), en);

		expect(ids(view)).toEqual(['b', 'e', 'c', 'a']);
	});

	it('keeps the order it was given between locked skills of the same progress', () => {
		const view = plaqueSkillsView(page([], [card('first', 40), card('second', 40), card('third', 90), card('fourth', 40), card('fifth', 40)]), en);

		expect(ids(view)).toEqual(['third', 'first', 'second', 'fourth']);
	});

	it('fills with earned skills, in their order, when fewer than four are locked', () => {
		const view = plaqueSkillsView(page([card('scribe', 'earned'), card('reader', 'earned'), card('runner', 'earned')], [card('a', 20), card('b', 70)]), en);

		expect(ids(view)).toEqual(['b', 'a', 'scribe', 'reader']);
	});

	it('shows every skill when there are fewer than four', () => {
		expect(ids(plaqueSkillsView(page([card('reader', 'earned')], [card('a', 20)]), en))).toEqual(['a', 'reader']);
	});

	it('draws each one as the ring of the skills screen, with the same accessible name', () => {
		const view = plaqueSkillsView(page([card('reader', 'earned')], [card('a', 20)]), en);

		expect(view?.rings.map((ring) => [ring.ariaLabel, ring.percent, ring.earned])).toEqual([
			['a, locked, a to do', 20, false],
			['reader, Level 1 · 40/100', 40, true],
		]);
	});

	it('titles the part "Skills · N of M", the earned skills of all of them, in English and Spanish', () => {
		const skills = page([card('reader', 'earned'), card('scribe', 'earned')], [card('a', 20), card('b', 10), card('c', 5)]);

		expect(plaqueSkillsView(skills, en)?.title).toBe('Skills · 2 of 5');
		expect(plaqueSkillsView(skills, es)?.title).toBe('Skills · 2 de 5');
	});

	it('draws no skills part while there is no skill', () => {
		expect(plaqueSkillsView(page([], []), en)).toBeNull();
		expect(plaqueSkillsView(page([], [], 'Loading the skills…'), en)).toBeNull();
	});
});
