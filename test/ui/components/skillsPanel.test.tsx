import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SkillsPanel } from '../../../src/ui/organisms/SkillsPanel';
import type { SkillCardView, SkillsPageView } from '../../../src/ui/presenters/skillsView';
import { noop } from './homeDeps';

function card(id: string, unlocked: boolean): SkillCardView {
	return {
		id,
		icon: unlocked ? '📖' : '🏃',
		name: unlocked ? 'Lector' : 'Atleta',
		statLabel: unlocked ? 'Intelligence' : 'Strength',
		description: unlocked ? 'Reading books.' : 'Training sessions.',
		unlocked,
		level: unlocked ? 2 : null,
		levelText: unlocked ? 'Level 2' : null,
		rankName: unlocked ? 'Aprendiz' : null,
		rankDescription: null,
		caption: unlocked ? 'Aprendiz' : 'Quests with this skill: 3 of 5',
		xp: null,
		requirements: unlocked ? [] : [{ text: 'Quests with this skill: 3 of 5', detail: null, met: false, percent: 60 }],
		progressPercent: unlocked ? 100 : 60,
		earnedText: null,
	};
}

const view: SkillsPageView = {
	title: 'Skills',
	emptyText: null,
	notice: null,
	earnedTitle: 'Earned (1)',
	lockedTitle: 'To unlock (1)',
	earned: [card('lector', true)],
	locked: [card('atleta', false)],
	problems: [],
};

const render = (selectedId: string | null): string => renderToStaticMarkup(<SkillsPanel view={view} selectedId={selectedId} onSelect={noop} renderIcon={noop} />);

/** The opening tag of the medallion button of `id`. */
function medallion(html: string, id: string): string {
	return new RegExp(`<button[^>]*aria-controls="dromos-skill-${id}"[^>]*>`).exec(html)?.[0] ?? '';
}

describe('SkillsPanel shows the skills as medallions', () => {
	it('renders one closed medallion per skill and no detail while none is chosen', () => {
		const html = render(null);
		expect(medallion(html, 'lector')).toContain('aria-expanded="false"');
		expect(medallion(html, 'atleta')).toContain('aria-expanded="false"');
		expect(html).not.toContain('<article');
	});

	it('shows the level of an earned skill and the closest requirement of a locked one', () => {
		const html = render(null);
		expect(html).toMatch(/class="dromos-medallion-badge"[^>]*>2</);
		expect(html).toContain('Level 2');
		expect(html).toContain('Locked');
		expect(html).toContain('Quests with this skill: 3 of 5');
	});

	it('opens the card of the chosen skill under its medallions, with its name as a heading', () => {
		const html = render('atleta');
		expect(medallion(html, 'atleta')).toContain('aria-expanded="true"');
		expect(medallion(html, 'lector')).toContain('aria-expanded="false"');
		expect(html).toMatch(/<article[^>]*id="dromos-skill-atleta"/);
		expect(html).toMatch(/<h4[^>]*>Atleta<\/h4>/);
		expect(html).not.toContain('id="dromos-skill-lector"');
	});
});
