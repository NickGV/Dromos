import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { GameSnapshot } from '../../../src/application';
import { skillStanding } from '../../../src/domain';
import { createTranslator } from '../../../src/i18n';
import { RingMedallion } from '../../../src/ui/atoms/RingMedallion';
import { SkillIcon } from '../../../src/ui/atoms/SkillIcon';
import { HomeScreen } from '../../../src/ui/containers/HomeScreen';
import { SkillRingButton } from '../../../src/ui/molecules/SkillRingButton';
import type { SkillRingView } from '../../../src/ui/presenters/skillsView';
import { skill } from '../../domain/skill/skillFixtures';
import { clickOf } from './elements';
import { IDLE_GAME, homeDeps, noop } from './homeDeps';

const CIRCUMFERENCE = 2 * Math.PI * 38;
const reader: SkillRingView = { id: 'lector', name: 'Reader', icon: 'book-open', earned: true, level: 2, percent: 40, caption: 'Level 2 · 40/160', ariaLabel: 'Reader, Level 2 · 40/160' };
const athlete: SkillRingView = { id: 'atleta', name: 'Athlete', icon: '🏃', earned: false, level: null, percent: 75, caption: 'Habit streak: 15 of 20 days', ariaLabel: 'Athlete, locked, Habit streak: 15 of 20 days' };

/** The drawn length of the ring's arc, or `null` when there is no arc. */
const arcOf = (html: string): number | null => {
	const dash = /class="dromos-ring-arc"[^>]*stroke-dasharray="([\d.]+) /.exec(html)?.[1];
	return dash === undefined ? null : Number(dash);
};

describe('RingMedallion (game-ui S9)', () => {
	it('draws the arc as the fraction of the ring an earned skill has gone through its level', () => {
		const html = renderToStaticMarkup(<RingMedallion percent={40} earned icon="📖" badge={2} renderIcon={noop} />);

		expect(arcOf(html)).toBeCloseTo(0.4 * CIRCUMFERENCE, 1);
		expect(html).toMatch(/^<span class="dromos-ring is-earned" style="width:88px;height:88px" aria-hidden="true">/);
		expect(html).toContain('<span class="dromos-ring-badge">2</span>');
		expect(html).not.toContain('dromos-ring-lock');
	});

	it('draws the arc of a locked skill as its unlock progress, with the lock instead of a badge', () => {
		const html = renderToStaticMarkup(<RingMedallion percent={75} earned={false} icon="📖" badge={null} renderIcon={noop} />);

		expect(arcOf(html)).toBeCloseTo(0.75 * CIRCUMFERENCE, 1);
		expect(html).toContain('class="dromos-ring is-locked"');
		expect(html).toContain('class="dromos-ring-lock"');
		expect(html).not.toContain('dromos-ring-badge');
	});

	it('draws no arc at zero, and fits the size it is given', () => {
		const html = renderToStaticMarkup(<RingMedallion percent={0} earned={false} icon="" badge={null} renderIcon={noop} size={56} />);

		expect(arcOf(html)).toBeNull();
		expect(html).toContain('style="width:56px;height:56px"');
	});
});

describe('SkillIcon (game-ui S9)', () => {
	it('leaves an icon name to the host app, which draws it into an empty box', () => {
		expect(renderToStaticMarkup(<SkillIcon icon="book-open" renderIcon={noop} className="dromos-ring-icon" />)).toBe('<span class="dromos-ring-icon is-named" aria-hidden="true"></span>');
	});

	it('writes anything else, such as an emoji, as text', () => {
		expect(renderToStaticMarkup(<SkillIcon icon="📖" renderIcon={noop} className="dromos-ring-icon" />)).toBe('<span class="dromos-ring-icon" aria-hidden="true">📖</span>');
	});

	it('draws nothing for a skill without an icon', () => {
		expect(renderToStaticMarkup(<SkillIcon icon="" renderIcon={noop} className="dromos-ring-icon" />)).toBe('');
	});
});

describe('SkillRingButton (game-ui S9)', () => {
	it('is a button named by the skill and its caption, with the serif name and the caption under the ring', () => {
		const html = renderToStaticMarkup(<SkillRingButton view={athlete} onOpen={noop} renderIcon={noop} />);

		expect(html).toMatch(/^<button type="button" class="dromos-ring-button is-locked" aria-label="Athlete, locked, Habit streak: 15 of 20 days">/);
		expect(html).toContain('<span class="dromos-ring-name">Athlete</span><span class="dromos-ring-caption">Habit streak: 15 of 20 days</span>');
	});

	it('opens its own skill', () => {
		const opened: string[] = [];

		clickOf(SkillRingButton({ view: reader, onOpen: (id) => opened.push(id), renderIcon: noop }))();

		expect(opened).toEqual(['lector']);
	});
});

describe('HomeScreen shows the skills as one row of ring medallions', () => {
	const game: GameSnapshot = {
		...IDLE_GAME,
		status: { kind: 'synced' },
		skills: [
			{ skill: skill({ id: 'lector', name: 'Reader', icon: 'book-open', unlocked: true, unlockedOn: '2026-10-01' }), xp: 40, standing: skillStanding(true, 40), rank: null, requirements: [], recent: [] },
			{ skill: skill({ id: 'atleta', name: 'Athlete', icon: '🏃' }), xp: 0, standing: skillStanding(false, 0), rank: null, requirements: [{ requirement: { kind: 'quests', count: 4 }, done: 1, total: 4, met: false }], recent: [] },
		],
	};

	it('draws a ring medallion per skill on home, earned first', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps({ game })} />);

		expect([...html.matchAll(/class="dromos-ring-button [^"]*" aria-label="([^"]+)"/g)].map((match) => match[1])).toEqual(['Reader, Level 1 · 40/100', 'Athlete, locked, Quests with this skill: 1 of 4']);
		expect(html).toContain('<section class="dromos-section dromos-skills" aria-label="Skills">');
	});

	// game-ui S9: the skills screen draws the same rings as its grid; skillsScreen.test.tsx checks it.
	it('draws the same rings as the grid of the skills screen, the first one pressed', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps({ game })} initialScreen="skills" />);

		expect([...html.matchAll(/class="dromos-ring-button [^"]*" aria-label="([^",]+)[^"]*" aria-pressed="(\w+)"/g)].map((match) => [match[1], match[2]])).toEqual([
			['Reader', 'true'],
			['Athlete', 'false'],
		]);
	});
});

describe('the English copy of the ring', () => {
	it('is in Spanish too', () => {
		const es = createTranslator('es');
		expect([es('skills.ring.caption', { level: 2, current: 40, total: 160 }), es('skills.ring.locked')]).toEqual(['Nivel 2 · 40/160', 'bloqueada']);
	});
});
