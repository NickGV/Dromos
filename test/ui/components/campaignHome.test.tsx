import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CampaignSnapshot } from '../../../src/application';
import { createTranslator } from '../../../src/i18n';
import { HomeScreen } from '../../../src/ui/containers/HomeScreen';
import { CampaignHomeCard } from '../../../src/ui/molecules/CampaignHomeCard';
import { CampaignRoad } from '../../../src/ui/molecules/CampaignRoad';
import { campaignHomeCardView } from '../../../src/ui/presenters/campaignHomeView';
import { campaignCardView } from '../../../src/ui/presenters/campaignView';
import { campaign, phase, task } from '../../domain/campaign/campaignFixtures';
import { clickOf } from './elements';
import { homeDeps, noop } from './homeDeps';

const en = createTranslator('en');
const ctx = { today: '2026-10-31', defaultStaleAfterDays: 14, issues: [], canSend: true, habiticaKnown: true, t: en };
const done = (title: string, phaseId: string) => task(title, phaseId, { habiticaId: `h-${title}`, completed: true, completedOn: '2026-10-25' });
const pending = (title: string, phaseId: string) => task(title, phaseId, { habiticaId: `h-${title}` });
const kairos = campaign({
	path: 'P/Kairos/README.md',
	title: 'Kairos',
	phases: [phase('design', 'completed'), phase('mvp', 'active'), phase('ship', 'planning')],
	tasks: [done('Flows', 'design'), done('Wireframes', 'design'), done('Schema', 'mvp'), pending('Timer', 'mvp'), pending('Report', 'mvp'), pending('Beta', 'ship')],
});
const moving = campaignHomeCardView(campaignCardView(kairos, ctx), en);
const stalled = campaignHomeCardView(campaignCardView(kairos, { ...ctx, today: '2026-11-20' }), en);
const road = (view = moving) => renderToStaticMarkup(<CampaignRoad road={view.road} label={view.progress.label} percent={view.progress.percent} valueText={view.progress.valueText} />);

describe('CampaignRoad (game-ui S7)', () => {
	it('draws one segment per task, phase by phase, done, next and ahead', () => {
		const phases = [...road().matchAll(/<span class="dromos-trail-segments">(.*?)<\/span><span class="dromos-trail-label">/g)].map((match) => [...(match[1] ?? '').matchAll(/dromos-trail-segment is-(\w+)/g)].map((segment) => segment[1]));

		expect(phases).toEqual([['done', 'done'], ['done', 'next', 'ahead'], ['ahead']]);
	});

	it('puts a gate between phases, reached after a complete one', () => {
		expect([...road().matchAll(/class="dromos-trail-gate( is-reached)?"/g)].map((match) => match[1] === ' is-reached')).toEqual([true, false]);
	});

	it('names each phase with its count under it, and weighs it by its tasks', () => {
		const html = road();

		expect(html).toContain('<span class="dromos-trail-label"><span class="dromos-trail-name">Phase mvp</span><span class="dromos-trail-count">1/3</span></span>');
		expect(html).toContain('style="flex-grow:3"');
	});

	it('fills one segment by its percent for a phase without tasks', () => {
		const research = campaignHomeCardView(campaignCardView(campaign({ kind: 'research', created: '2026-10-28', phases: [phase('read', 'completed'), phase('sum', 'active')] }), ctx), en);
		const html = road(research);

		expect(html).toContain('<span class="dromos-trail-segment is-fill is-done"><span class="dromos-trail-fill" style="width:100%"></span></span>');
		expect(html).toContain('<span class="dromos-trail-segment is-fill is-open"><span class="dromos-trail-fill" style="width:0%"></span></span>');
	});

	it('is one progress bar for screen readers', () => {
		const html = road();

		expect(html.match(/role="progressbar"/g)).toHaveLength(1);
		expect(html).toMatch(/^<div class="dromos-trail is-compact" role="progressbar" aria-label="Progress of Kairos" aria-valuemin="0" aria-valuemax="100" aria-valuenow="33" aria-valuetext="Phase mvp 1\/3">/);
	});
});

describe('CampaignHomeCard (game-ui S7)', () => {
	it('shows the count while the campaign moves, and the clay seal instead while it is stalled', () => {
		const running = renderToStaticMarkup(<CampaignHomeCard view={moving} onOpen={noop} />);
		const stuck = renderToStaticMarkup(<CampaignHomeCard view={stalled} onOpen={noop} />);

		expect(running).toContain('<span class="dromos-campaign-card-count">3 of 6 tasks</span>');
		expect(running).not.toContain('dromos-seal');
		expect(stuck).toContain('<span class="dromos-seal">stalled</span>');
		expect(stuck).not.toContain('dromos-campaign-card-count');
		expect(stuck).toContain('<p class="dromos-campaign-card-note">No progress for 26 days</p>');
	});

	it('gives the next step in italics after its label', () => {
		expect(renderToStaticMarkup(<CampaignHomeCard view={moving} onOpen={noop} />)).toContain('<span class="dromos-campaign-card-next-label">Next step · </span><em>Timer</em>');
	});

	it('is one button, named to open the campaign, inside the heading of the card', () => {
		const html = renderToStaticMarkup(<CampaignHomeCard view={moving} onOpen={noop} />);

		expect(html.match(/<button/g)).toHaveLength(1);
		expect(html).toMatch(/<h3 class="dromos-campaign-card-title"><button type="button" class="dromos-campaign-card-open" aria-label="Open campaign Kairos">Kairos<\/button><\/h3>/);
	});

	it('opens its own campaign', () => {
		const opened: string[] = [];

		clickOf(CampaignHomeCard({ view: moving, onOpen: (path) => opened.push(path) }))();

		expect(opened).toEqual(['P/Kairos/README.md']);
	});

	it('keeps one short line for what Habitica no longer has', () => {
		const issues = [{ campaignPath: kairos.path, taskTitle: 'Timer', kind: 'habitica-task-missing' as const }];
		const view = campaignHomeCardView(campaignCardView(kairos, { ...ctx, issues }), en);

		expect(renderToStaticMarkup(<CampaignHomeCard view={view} onOpen={noop} />)).toContain('<p class="dromos-campaign-card-problem">1 task or habit not found in Habitica</p>');
	});
});

describe('HomeScreen shows compact campaign cards on home, and the campaign screen on the campaigns screen', () => {
	const snapshot: CampaignSnapshot = { campaigns: [kairos], issues: [], lastSyncedAt: new Date('2026-10-31T10:00:00Z'), status: { kind: 'synced' } };
	const deps = () => {
		const base = homeDeps();
		return { ...base, campaigns: { ...base.campaigns, campaignSnapshot: () => snapshot, clock: { today: () => '2026-10-31', now: () => new Date('2026-10-31T12:00:00Z') } } };
	};

	it('draws the cards on home, without the send buttons, the tasks or the habits', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={deps()} />);

		expect(html).toContain('<section class="dromos-section dromos-campaigns" aria-label="Campaigns">');
		expect(html).toContain('aria-label="Open campaign Kairos"');
		expect(html).not.toContain('dromos-task-group');
		expect(html).not.toContain('Send to Habitica');
	});

	// game-ui S8: campaignScreen.test.tsx checks the screen itself.
	it('draws the campaign screen, with its tasks by phase, on the campaigns screen', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={deps()} initialScreen="campaigns" />);

		expect(html).toContain('<div class="dromos-campaign-screen dromos-campaigns">');
		expect(html).toContain('dromos-task-group');
		expect(html).not.toContain('dromos-campaign-card');
	});

	it('keeps the empty state on home before the first sync', () => {
		expect(renderToStaticMarkup(<HomeScreen deps={homeDeps()} />)).toContain('Campaigns will appear after syncing.');
	});
});
