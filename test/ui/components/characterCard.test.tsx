import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Character } from '../../../src/domain';
import { createTranslator } from '../../../src/i18n';
import { StatBadge } from '../../../src/ui/atoms/StatBadge';
import { XpBar } from '../../../src/ui/atoms/XpBar';
import { CharacterCard } from '../../../src/ui/organisms/CharacterCard';
import { CharacterPanel } from '../../../src/ui/organisms/CharacterPanel';
import { characterCardView } from '../../../src/ui/presenters/characterCardView';

const t = createTranslator('en');
const CHARACTER: Character = {
	name: 'Nicolás',
	title: 'Corredor',
	level: 3,
	totalXp: 600,
	xpIntoLevel: 240,
	xpToNext: 520,
	stats: { fuerza: 3, vitalidad: 8, inteligencia: 4, sabiduria: 1, espiritu: 0, disciplina: 6 },
	gameStart: null,
};
const view = characterCardView(CHARACTER, t);
const card = (ceremony: Parameters<typeof CharacterCard>[0]['ceremony'] = null): string => renderToStaticMarkup(<CharacterCard view={view} footer={<p>sync line</p>} ceremony={ceremony} />);

/** The width of the XP bar's fill, in percent. */
const fillWidth = (html: string): string | undefined => /class="dromos-xp-fill" style="width:(\d+)%"/.exec(html)?.[1];

describe('StatBadge draws a stat as six pips (game-ui S3)', () => {
	it('fills as many pips as the value, as one image named by the stat and its value', () => {
		const html = renderToStaticMarkup(<StatBadge stat={view.stats[0]!} />);

		expect(html).toMatch(/role="img" aria-label="Strength 3"/);
		expect(html.match(/class="dromos-pip( is-filled)?"/g)).toHaveLength(6);
		expect(html.match(/class="dromos-pip is-filled"/g)).toHaveLength(3);
		expect(html).toMatch(/<span class="dromos-stat-label" aria-hidden="true">Strength<\/span>/);
	});

	it('shows a value above six as its number, without pips', () => {
		const html = renderToStaticMarkup(<StatBadge stat={view.stats[1]!} />);

		expect(html).toMatch(/role="img" aria-label="Vitality 8"/);
		expect(html).toContain('<span class="dromos-stat-number">8</span>');
		expect(html).not.toContain('dromos-pip');
	});
});

describe('CharacterCard after the design (game-ui S3)', () => {
	it('opens with a level medallion named by the level, and drops the level chip', () => {
		const html = card();

		expect(html).toMatch(/<span class="dromos-level-medal" role="img" aria-label="Level 3">.*<span class="dromos-level-medal-number">3<\/span><\/span>/);
		expect(html).not.toContain('dromos-character-level');
	});

	it('names the title and the level in one line, and the next level under the bar', () => {
		const html = card();

		expect(html).toContain('<p class="dromos-character-title">Corredor · level 3</p>');
		expect(html).toMatch(/<span class="dromos-xp-text">240 \/ 520 XP<\/span><span class="dromos-xp-next">Level 4 in 280 XP<\/span>/);
	});

	it('draws the six stats in their grid', () => {
		expect(card().match(/role="img" aria-label="(Strength|Vitality|Intelligence|Wisdom|Spirit|Discipline) \d+"/g)).toHaveLength(6);
	});

	it('keeps the sync line at its foot and the name as the heading that takes the focus', () => {
		const html = card();

		expect(html).toMatch(/<h2[^>]*tabindex="-1"[^>]*data-screen-heading="true"[^>]*>Nicolás<\/h2>/);
		expect(html.endsWith('<p>sync line</p></section>')).toBe(true);
	});
});

describe('CharacterCard during the level-up ceremony (game-ui S4)', () => {
	it('shows the real progress and a plain medallion when there is no ceremony', () => {
		expect(fillWidth(card(null))).toBe('46');
		expect(card(null)).not.toContain('is-lit');
	});

	it('fills the bar first, before the medallion changes', () => {
		const html = card('fill');

		expect(fillWidth(html)).toBe('100');
		expect(html).toContain('<span class="dromos-level-medal" role="img"');
	});

	it('then turns the medallion ochre and shows the progress into the new level', () => {
		for (const phase of ['medal', 'final'] as const) {
			const html = card(phase);
			expect(html).toContain('<span class="dromos-level-medal is-lit" role="img" aria-label="Level 3">');
			expect(fillWidth(html)).toBe('46');
		}
	});

	it('keeps the screen reader values of the bar real while it fills', () => {
		expect(card('fill')).toMatch(/role="progressbar"[^>]*aria-valuemax="520"[^>]*aria-valuenow="240"/);
	});
});

describe('XpBar', () => {
	it('keeps its markup for the skill cards, which pass no caption', () => {
		expect(renderToStaticMarkup(<XpBar current={40} total={100} percent={40} text="40 / 100 XP" />)).toBe(
			'<div class="dromos-xp"><div class="dromos-xp-track" role="progressbar" aria-label="Experience" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40" aria-valuetext="40 / 100 XP"><div class="dromos-xp-fill" style="width:40%"></div></div><span class="dromos-xp-text">40 / 100 XP</span></div>',
		);
	});
});

describe('CharacterPanel', () => {
	it('still names the expected note when the character is missing, without a card', () => {
		const html = renderToStaticMarkup(<CharacterPanel state={{ kind: 'missing', path: 'Dromos/Character.md' }} footer={null} />);

		expect(html).toContain('<code>Dromos/Character.md</code>');
		expect(html).not.toContain('dromos-level-medal');
	});
});
