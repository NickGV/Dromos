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
import { elementsOf } from './elements';
import { homeDeps, noop } from './homeDeps';
import { InMemoryDeviceStore } from '../../fakes/InMemoryDeviceStore';

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

describe('CampaignHomeCard (game-ui S7, folded on home by home-fit S1)', () => {
	const card = (view = moving, open = false, handlers: { onToggle?: (path: string) => void; onOpen?: (path: string) => void } = {}) =>
		CampaignHomeCard({ view, open, cardId: 'dromos-campaigns-1-0', onToggle: handlers.onToggle ?? noop, onOpen: handlers.onOpen ?? noop });
	const html = (view = moving, open = false) => renderToStaticMarkup(card(view, open));
	const buttons = (node: ReturnType<typeof card>) => elementsOf(node).filter((element) => element.type === 'button');

	it('shows the count while the campaign moves, and the clay seal instead while it is stalled', () => {
		const running = html();
		const stuck = html(stalled);

		expect(running).toContain('<span class="dromos-campaign-card-count">3 of 6 tasks</span>');
		expect(running).not.toContain('dromos-seal');
		expect(stuck).toContain('<span class="dromos-seal is-small">stalled</span>');
		expect(stuck).not.toContain('dromos-campaign-card-count');
		expect(stuck).toContain('<p class="dromos-campaign-card-note">No progress for 26 days</p>');
	});

	it('gives the next step in italics after its label', () => {
		expect(html()).toContain('<span class="dromos-campaign-card-next-label">Next step · </span><em>Timer</em>');
	});

	it('makes its header row the toggle: one button inside the heading, folded, controlling the road', () => {
		const folded = html();

		expect(folded).toMatch(
			/<h3 class="dromos-campaign-card-title"><button type="button" class="dromos-campaign-card-toggle" aria-expanded="false" aria-controls="dromos-campaigns-1-0-road"><span class="dromos-campaign-card-name">Kairos<\/span><span class="dromos-campaign-card-count">3 of 6 tasks<\/span><svg class="dromos-campaign-card-chevron"[^>]*aria-hidden="true"/,
		);
		expect(folded).toMatch(/^<article class="dromos-panel dromos-campaign-card">/);
	});

	it('folded, shows one thin bar of the whole campaign and the next step, and hides the road', () => {
		const folded = html();

		expect(folded).toContain(
			'<div class="dromos-campaign-card-summary"><p class="dromos-campaign-card-next"><span class="dromos-campaign-card-next-label">Next step · </span><em>Timer</em></p><span class="dromos-campaign-card-bar" role="progressbar" aria-label="Progress of Kairos" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-valuetext="3 of 6 tasks"><span class="dromos-campaign-card-bar-fill" style="width:50%"></span></span></div>',
		);
		expect(folded).toContain('<div class="dromos-campaign-card-body" id="dromos-campaigns-1-0-road" hidden="">');
	});

	it('open, shows its road as before and a way to the campaigns screen, and drops the thin bar', () => {
		const open = html(moving, true);

		expect(open).toMatch(/^<article class="dromos-panel dromos-campaign-card is-open">/);
		expect(open).toContain('aria-expanded="true" aria-controls="dromos-campaigns-1-0-road"');
		expect(open).toContain('<div class="dromos-campaign-card-body" id="dromos-campaigns-1-0-road"><div class="dromos-trail is-compact" role="progressbar"');
		expect(open).not.toContain('dromos-campaign-card-summary');
		expect(open).toContain('<button type="button" class="dromos-btn is-small dromos-campaign-card-open" aria-label="Open campaign Kairos">Open campaign</button>');
	});

	it('toggles its own campaign from the header, and opens it on the campaigns screen from the open card', () => {
		const toggledPaths: string[] = [];
		const opened: string[] = [];
		const [toggle, open] = buttons(card(moving, true, { onToggle: (path) => toggledPaths.push(path), onOpen: (path) => opened.push(path) }));

		(toggle?.props.onClick as () => void)();
		(open?.props.onClick as () => void)();

		expect(toggledPaths).toEqual(['P/Kairos/README.md']);
		expect(opened).toEqual(['P/Kairos/README.md']);
	});

	it('keeps one short line for what Habitica no longer has', () => {
		const issues = [{ campaignPath: kairos.path, taskTitle: 'Timer', kind: 'habitica-task-missing' as const }];
		const view = campaignHomeCardView(campaignCardView(kairos, { ...ctx, issues }), en);

		expect(html(view, true)).toContain('<p class="dromos-campaign-card-problem">1 task or habit not found in Habitica</p>');
	});
});

describe('HomeScreen shows compact campaign cards on home, and the campaign screen on the campaigns screen', () => {
	const snapshot: CampaignSnapshot = { campaigns: [kairos], areas: [], issues: [], lastSyncedAt: new Date('2026-10-31T10:00:00Z'), status: { kind: 'synced' } };
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

	it('folds every card on home at first (home-fit S1)', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={deps()} />);

		expect(html).toMatch(/<button type="button" class="dromos-campaign-card-toggle" aria-expanded="false" aria-controls="dromos-campaigns-\d+-0-road">/);
	});

	it('opens the cards this device kept open (home-fit S1)', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={{ ...deps(), deviceStore: new InMemoryDeviceStore({ 'home-campaigns-open': ['P/Kairos/README.md'] }) }} />);

		expect(html).toMatch(/<button type="button" class="dromos-campaign-card-toggle" aria-expanded="true"/);
		expect(html).toContain('>Open campaign</button>');
	});

	it('keeps the empty state on home before the first sync', () => {
		expect(renderToStaticMarkup(<HomeScreen deps={homeDeps()} />)).toContain('Campaigns will appear after syncing.');
	});
});
