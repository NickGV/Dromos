import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createTranslator } from '../../../src/i18n';
import { BriefingPanel } from '../../../src/ui/organisms/BriefingPanel';
import { briefingView } from '../../../src/ui/presenters/briefingView';
import type { SkillCardView } from '../../../src/ui/presenters/skillsView';
import { aBriefing } from '../../fakes/InMemoryBriefingRepository';
import { noop, renderNothing } from './homeDeps';

const en = createTranslator('en');
const TODAY = '2026-11-03';
const caregiver: SkillCardView = {
	id: 'cuidador',
	icon: 'heart-pulse',
	name: 'Caregiver',
	statLabel: 'Vitality',
	description: '',
	unlocked: false,
	level: null,
	levelText: null,
	rankName: null,
	rankDescription: null,
	caption: null,
	xp: null,
	requirements: [{ text: 'See a doctor this year', detail: null, met: false, percent: 0 }],
	progressPercent: 0,
	earnedText: null,
};
const today = briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY, mission: { title: 'Finish the login screen', why: 'It unblocks the beta.' }, nearSkillId: 'cuidador' }) }, TODAY, [caregiver], en);
const render = (view = today, onRequest: (() => void) | null = noop) => renderToStaticMarkup(<BriefingPanel view={view} renderMarkdown={renderNothing} onRequest={onRequest} renderIcon={noop} />);

describe('BriefingPanel as a scroll (game-ui S5)', () => {
	it('rolls the scroll at its top and its bottom', () => {
		const html = render();

		expect(html).toMatch(/^<section class="dromos-card dromos-briefing" aria-label="Briefing from Esdras"><h2 class="dromos-visually-hidden">Briefing from Esdras<\/h2><div class="dromos-scroll-edge" aria-hidden="true"><\/div>/);
		expect(html.endsWith('<div class="dromos-scroll-edge" aria-hidden="true"></div></section>')).toBe(true);
	});

	it('draws a scroll icon in a circle, as a drawing', () => {
		expect(render()).toMatch(/<span class="dromos-briefing-seal" aria-hidden="true"><svg[^>]*viewBox="0 0 24 24"/);
		expect(render()).not.toContain('📜');
	});

	it('signs it "— Esdras" next to the copy-command button, which is a secondary button', () => {
		expect(render()).toMatch(/<div class="dromos-briefing-foot"><button type="button" class="dromos-btn is-small dromos-briefing-request">Copy briefing command<\/button><p class="dromos-briefing-signature">— Esdras<\/p><\/div>/);
	});

	it('keeps the mission, the closest skill and its icon from the host app', () => {
		const html = render();

		expect(html).toContain('Finish the login screen');
		expect(html).toContain('It unblocks the beta.');
		expect(html).toContain('<span class="dromos-briefing-near-icon is-named" aria-hidden="true"></span> Caregiver');
	});

	it('keeps the notice and the dimmed text of another day', () => {
		const old = briefingView({ kind: 'found', briefing: aBriefing({ created: '2026-11-01' }) }, TODAY, [], en);
		const html = render(old, null);

		expect(html).toContain('<p class="dromos-briefing-notice">Esdras has not written today</p>');
		expect(html).toContain('class="dromos-briefing-content is-dimmed"');
		expect(html).not.toContain('<button');
	});
});
