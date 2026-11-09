import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CampaignSnapshot } from '../../../src/application';
import { createTranslator } from '../../../src/i18n';
import { SendButton } from '../../../src/ui/atoms/SendButton';
import { HomeScreen } from '../../../src/ui/containers/HomeScreen';
import { CampaignHeaderPanel } from '../../../src/ui/molecules/CampaignHeaderPanel';
import { CampaignRoad } from '../../../src/ui/molecules/CampaignRoad';
import { CampaignTabs } from '../../../src/ui/molecules/CampaignTabs';
import { CampaignTaskRow } from '../../../src/ui/molecules/CampaignTaskRow';
import { HabitRow } from '../../../src/ui/molecules/HabitRow';
import { CampaignScreen } from '../../../src/ui/organisms/CampaignScreen';
import { campaignScreenView, groupToggleKey, taskToggleKey, type CampaignDetailView, type CampaignTaskView } from '../../../src/ui/presenters/campaignScreenView';
import { campaignListView } from '../../../src/ui/presenters/campaignView';
import { campaign, habit, phase, task } from '../../domain/campaign/campaignFixtures';
import { clickOf, componentsOf, elementsOf } from './elements';
import { homeDeps, noop } from './homeDeps';

const en = createTranslator('en');
const TODAY = '2026-11-03';
const done = (title: string, phaseId: string | null) => task(title, phaseId, { habiticaId: `h-${title}`, completed: true, completedOn: '2026-11-01' });
const pending = (title: string, phaseId: string | null) => task(title, phaseId, { habiticaId: `h-${title}` });
const kairos = campaign({
	path: 'P/Kairos/README.md',
	title: 'Kairos',
	deadline: '2026-11-28',
	phases: [phase('design', 'completed'), phase('mvp', 'active')],
	tasks: [done('Flows', 'design'), pending('Timer', 'mvp'), task('Report', 'mvp'), pending('Loose', null)],
	habits: [habit('Code 30 minutes'), habit('Walk', { habiticaId: 'hb', streak: 3, days: 7 })],
});
const cheshbon = campaign({ path: 'P/Cheshbon/README.md', title: 'Cheshbon', phases: [phase('one', 'active')], tasks: [pending('Ledger', 'one')] });
const snapshot: CampaignSnapshot = { campaigns: [kairos, cheshbon], areas: [], issues: [], lastSyncedAt: new Date('2026-11-03T12:00:00Z'), status: { kind: 'synced' } };
const screenOf = (value: CampaignSnapshot = snapshot, selected: string | null = null) => campaignScreenView(campaignListView(value, { today: TODAY, defaultStaleAfterDays: 14, t: en }), selected, en);
const view = screenOf();
const detail = view.campaign as CampaignDetailView;
const render = (props: Partial<Parameters<typeof CampaignScreen>[0]> = {}): string =>
	renderToStaticMarkup(<CampaignScreen view={view} sending={null} message={null} onSelect={noop} onOpenNote={noop} onSend={noop} onSendHabit={noop} {...props} />);

const row = (overrides: Partial<CampaignTaskView> = {}): CampaignTaskView => ({ title: 'Report', completed: false, chip: { label: 'Pending', tone: 'pending' }, canSend: false, ...overrides });

describe('CampaignTabs (game-ui S8)', () => {
	it('is a group of buttons named "Choose a campaign", the selected one pressed', () => {
		const html = renderToStaticMarkup(<CampaignTabs label={view.tabsLabel} tabs={view.tabs} onSelect={noop} />);

		expect(html).toMatch(/^<div class="dromos-campaign-tabs" role="group" aria-label="Choose a campaign">/);
		expect([...html.matchAll(/<button type="button" class="dromos-tab" aria-pressed="(\w+)">([^<]*)<\/button>/g)].map((match) => [match[2], match[1]])).toEqual([
			['Kairos', 'true'],
			['Cheshbon', 'false'],
		]);
	});

	it('selects the campaign of the tab chosen', () => {
		const chosen: string[] = [];
		const buttons = elementsOf(CampaignTabs({ label: view.tabsLabel, tabs: view.tabs, onSelect: (path) => chosen.push(path) })).filter((element) => element.type === 'button');

		(buttons[1]?.props.onClick as () => void)();

		expect(chosen).toEqual(['P/Cheshbon/README.md']);
	});
});

describe('CampaignHeaderPanel (game-ui S8)', () => {
	it('opens the note of its campaign', () => {
		const opened: string[] = [];

		clickOf(CampaignHeaderPanel({ view: detail, onOpenNote: (path) => opened.push(path) }))();

		expect(opened).toEqual(['P/Kairos/README.md']);
	});

	it('shows the kind, the name, the deadline and the hatched overall bar with its count and the next step', () => {
		const html = renderToStaticMarkup(<CampaignHeaderPanel view={detail} onOpenNote={noop} />);

		expect(html).toContain('<p class="dromos-campaign-hero-kind">Project</p>');
		expect(html).toMatch(/<h3 class="dromos-campaign-hero-name">Kairos<\/h3>/);
		expect(html).toContain('<p class="dromos-campaign-hero-due">Due 28 Nov · 25 days left</p>');
		expect(html).toMatch(/role="progressbar" aria-label="Progress of Kairos" aria-valuemin="0" aria-valuemax="100" aria-valuenow="25" aria-valuetext="1 of 4 tasks"/);
		expect(html).toContain('<span>1 of 4 tasks</span>');
		expect(html).toContain('Next step · <em>Timer</em>');
		expect(html).toMatch(/<button type="button" class="dromos-btn is-small"[^>]*>Open note<\/button>/);
		expect(html).not.toContain('dromos-seal');
	});

	it('shows the seal and the stale text while the campaign is stale', () => {
		const html = renderToStaticMarkup(<CampaignHeaderPanel view={{ ...detail, seal: 'stalled', staleText: 'No progress for 9 days' }} onOpenNote={noop} />);

		expect(html).toContain('<span class="dromos-seal">stalled</span><span class="dromos-campaign-hero-stale-text">No progress for 9 days</span>');
	});
});

describe('CampaignTaskRow (game-ui S8)', () => {
	it('draws the hand-drawn circle, checked and struck through once done, with its state chip', () => {
		const completed = renderToStaticMarkup(<CampaignTaskRow row={row({ title: 'Flows', completed: true, chip: { label: 'Done', tone: 'done' } })} sending={false} onSend={noop} />);
		const open = renderToStaticMarkup(<CampaignTaskRow row={row({ chip: { label: 'Next', tone: 'next' } })} sending={false} onSend={noop} />);

		expect(completed).toMatch(/^<li class="dromos-task is-completed">/);
		expect(completed).toContain('class="dromos-quest-tick"');
		expect(completed).toContain('<span class="dromos-task-chip is-done">Done</span>');
		expect(open).toMatch(/^<li class="dromos-task">/);
		expect(open).toContain('class="dromos-quest-circle"');
		expect(open).not.toContain('dromos-quest-tick');
		expect(open).toContain('<span class="dromos-task-chip is-next">Next</span>');
	});

	it('shows "Send to Habitica" only when the task can be sent', () => {
		expect(renderToStaticMarkup(<CampaignTaskRow row={row({ canSend: true })} sending={false} onSend={noop} />)).toContain('Send to Habitica');
		expect(renderToStaticMarkup(<CampaignTaskRow row={row({ canSend: false })} sending={false} onSend={noop} />)).not.toContain('<button');
	});

	it('keeps the button busy, not disabled, while it sends', () => {
		const busy = renderToStaticMarkup(<CampaignTaskRow row={row({ canSend: true })} sending onSend={noop} />);

		expect(/<button[^>]*>/.exec(busy)?.[0]).toBe('<button type="button" class="dromos-send-button" aria-disabled="true" aria-busy="true">');
		expect(busy).toContain('Sending…');
		expect(busy).not.toContain('dromos-send-icon');
	});
});

describe('SendButton', () => {
	it('sends on click while idle, with the send icon beside its label', () => {
		const sent: string[] = [];
		const html = renderToStaticMarkup(<SendButton sending={false} onSend={noop} label="Send to Habitica" sendingLabel="Sending…" />);

		clickOf(SendButton({ sending: false, onSend: () => sent.push('sent'), label: 'Send to Habitica', sendingLabel: 'Sending…' }))();

		expect(sent).toEqual(['sent']);
		expect(html).toMatch(/^<button type="button" class="dromos-send-button" aria-disabled="false" aria-busy="false"><svg class="dromos-send-icon"[^>]*aria-hidden="true"/);
		expect(html).toMatch(/<\/svg>Send to Habitica<\/button>$/);
	});

	it('ignores clicks while it sends', () => {
		expect(() => clickOf(SendButton({ sending: true, onSend: noop, label: 'Send to Habitica', sendingLabel: 'Sending…' }))).toThrow('the button has no onClick');
	});
});

describe('CampaignScreen (game-ui S8)', () => {
	it('opens with the tabs, then the header panel, the path and the tasks by phase', () => {
		const html = render();

		expect(html).toMatch(/^<div class="dromos-campaign-screen dromos-campaigns">/);
		const order = ['dromos-campaign-tabs', 'dromos-campaign-hero', '>The route</h3>', '>Tasks by phase</h3>', '>Habits</h3>'].map((marker) => html.indexOf(marker));
		expect(order.every((position) => position > 0)).toBe(true);
		expect([...order].sort((left, right) => left - right)).toEqual(order);
	});

	it('draws the path with the wide road and a gate between phases', () => {
		const html = render();

		expect(html).toMatch(/<div class="dromos-trail is-wide" role="progressbar" aria-label="Route of Kairos"/);
		expect(html).toContain('class="dromos-trail-gate is-reached"');
	});

	it('gives one panel per phase with its name and count in a tinted header, the tasks without a phase last', () => {
		const html = render();

		expect([...html.matchAll(/<h4 class="dromos-task-group-name">([^<]*)<\/h4><span class="dromos-task-group-count">([^<]*)<\/span>/g)].map((match) => [match[1], match[2]])).toEqual([
			['Phase design', '1/1'],
			['Phase mvp', '0/2'],
			['Without a phase', '0/1'],
		]);
	});

	it('offers the send button on the task that can be sent and on the habit never sent, busy only for the one being sent', () => {
		const html = render({ sending: { kind: 'task', title: 'Report' } });
		const buttons = [...html.matchAll(/<button type="button" class="dromos-send-button"[^>]*>/g)].map((match) => match[0]);

		expect(buttons).toEqual([
			'<button type="button" class="dromos-send-button" aria-disabled="true" aria-busy="true">',
			'<button type="button" class="dromos-send-button" aria-disabled="false" aria-busy="false">',
		]);
	});

	it('sends a task or a habit by its title, as the campaign card did', () => {
		const sent: string[] = [];
		const tree = CampaignScreen({ view, sending: null, message: null, onSelect: noop, onOpenNote: noop, onSend: (title) => sent.push(`task:${title}`), onSendHabit: (title) => sent.push(`habit:${title}`) });

		for (const element of componentsOf(tree, CampaignTaskRow)) (element.props.onSend as () => void)();
		for (const element of componentsOf(tree, HabitRow)) (element.props.onSend as () => void)();

		expect(sent).toEqual(['task:Flows', 'task:Timer', 'task:Report', 'task:Loose', 'habit:Code 30 minutes', 'habit:Walk']);
	});

	it('selects a campaign from its tabs and opens the note of the one shown', () => {
		const calls: string[] = [];
		const tree = CampaignScreen({ view, sending: null, message: null, onSelect: (path) => calls.push(`select:${path}`), onOpenNote: (path) => calls.push(`open:${path}`), onSend: noop, onSendHabit: noop });

		(componentsOf(tree, CampaignTabs)[0]?.props.onSelect as (path: string) => void)('P/Cheshbon/README.md');
		(componentsOf(tree, CampaignHeaderPanel)[0]?.props.onOpenNote as (path: string) => void)('P/Kairos/README.md');

		expect(calls).toEqual(['select:P/Cheshbon/README.md', 'open:P/Kairos/README.md']);
	});

	it('shows the result of the last send and every problem of the campaign', () => {
		const withProblem = screenOf({ ...snapshot, issues: [{ campaignPath: 'P/Kairos/README.md', taskTitle: 'Timer', kind: 'habitica-task-missing' }] });
		const html = renderToStaticMarkup(
			<CampaignScreen view={withProblem} sending={null} message={{ tone: 'success', message: 'Task sent to Habitica.' }} onSelect={noop} onOpenNote={noop} onSend={noop} onSendHabit={noop} />,
		);

		expect(html).toMatch(/<p class="dromos-campaign-message is-success" role="status" aria-live="polite">Task sent to Habitica.<\/p>/);
		expect(html).toContain('<p class="dromos-campaign-warning" role="status">&quot;Timer&quot; was not found in Habitica.</p>');
	});

	it('keeps the empty state and the notice', () => {
		const empty = renderToStaticMarkup(<CampaignScreen view={screenOf({ ...snapshot, campaigns: [] })} sending={null} message={null} onSelect={noop} onOpenNote={noop} onSend={noop} onSendHabit={noop} />);
		const notConfigured = renderToStaticMarkup(
			<CampaignScreen view={screenOf({ ...snapshot, status: { kind: 'not-configured' } })} sending={null} message={null} onSelect={noop} onOpenNote={noop} onSend={noop} onSendHabit={noop} />,
		);

		expect(empty).toContain('No active campaigns.');
		expect(empty).not.toContain('dromos-campaign-tabs');
		expect(notConfigured).toContain('<p class="dromos-campaign-notice">Connect your Habitica account to see the progress of sent tasks.</p>');
		expect(notConfigured).not.toContain('dromos-send-button');
	});
});

describe('CampaignRoad keeps the home card as it was', () => {
	it('draws the compact road with each name and count under its segments, and no flag', () => {
		const html = renderToStaticMarkup(<CampaignRoad road={detail.road} label="Progress of Kairos" percent={50} valueText="Phase mvp 0/2" />);

		expect(html).toMatch(/^<div class="dromos-trail is-compact"/);
		expect(html).toContain('<span class="dromos-trail-segments"><span class="dromos-trail-segment is-done"></span></span><span class="dromos-trail-label"><span class="dromos-trail-name">Phase design</span>');
		expect(html).not.toContain('dromos-trail-flag');
	});

	it('draws the wide road with a flag and the name above the segments, and the count under them', () => {
		const html = renderToStaticMarkup(<CampaignRoad road={detail.road} label="Path of Kairos" percent={50} valueText="Phase mvp 0/2" size="wide" />);

		expect(html).toContain('<span class="dromos-trail-head"><svg class="dromos-trail-flag"');
		expect(html).toMatch(/<span class="dromos-trail-name">Phase design<\/span><\/span><span class="dromos-trail-segments">/);
		expect(html).toContain('<span class="dromos-trail-count">1/1 tasks</span>');
	});
});

describe('HomeScreen on the campaigns screen (game-ui S8)', () => {
	it('titles the header card after the first campaign, with no second "Campaigns" title', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps({ campaigns: snapshot })} initialScreen="campaigns" />);

		expect(html).toMatch(/<main[^>]*><header class="dromos-panel dromos-screen-header"><h2[^>]*>Campaigns · Kairos<\/h2>/);
		// The signpost names the screen on its burnt-in plank (game-ui S14); no title repeats it.
		expect(html.match(/>Campaigns</g)).toEqual(['>Campaigns<']);
		expect(html).toMatch(/<button[^>]*class="dromos-plank is-current"[^>]*>Campaigns<\/button>/);
		expect(html).toMatch(/<button type="button" class="dromos-tab" aria-pressed="true">Kairos<\/button>/);
	});

	it('nests its headings under the screen heading', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps({ campaigns: snapshot })} initialScreen="campaigns" />);
		const levels = [...html.matchAll(/<h(\d)[^>]*>(.*?)<\/h\1>/g)].map((match) => [Number(match[1]), (match[2] ?? '').replace(/<[^>]+>/g, '')]);

		expect(levels).toEqual([
			[2, 'Campaigns · Kairos'],
			[3, 'Kairos'],
			[3, 'The route'],
			[3, 'Tasks by phase'],
			[4, 'Phase design'],
			[4, 'Phase mvp'],
			[4, 'Without a phase'],
			[3, 'Habits'],
		]);
	});

	it('keeps the compact cards on the home screen', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps({ campaigns: snapshot })} />);

		expect(html).toContain('dromos-campaign-card');
		expect(html).not.toContain('dromos-campaign-tabs');
	});
});

describe('missions on campaign tasks (missions S2)', () => {
	it('chips a task with 3 or more subtasks as a mission, after its state', () => {
		const withMission = campaign({ path: 'P/M/README.md', title: 'M', phases: [phase('one', 'active')], tasks: [task('Plan', 'one', { habiticaId: 'h1', checklist: { done: 2, total: 5 } })] });

		expect(screenOf({ ...snapshot, campaigns: [withMission] }).campaign?.groups[0]?.tasks[0]?.mission).toBe('Mission · 2/5');
		expect(renderToStaticMarkup(<CampaignTaskRow row={row({ mission: 'Mission · 2/5' })} sending={false} onSend={noop} />)).toContain(
			'<span class="dromos-task-chip is-pending">Pending</span><span class="dromos-task-chip is-mission">Mission · 2/5</span>',
		);
	});

	it('gives a plain task no mission chip', () => {
		expect(detail.groups.flatMap((group) => group.tasks).every((row) => row.mission === undefined)).toBe(true);
		expect(renderToStaticMarkup(<CampaignTaskRow row={row()} sending={false} onSend={noop} />)).not.toContain('is-mission');
	});
});

describe('"View more" in a phase panel (missions S3)', () => {
	const long = campaign({ path: 'P/Long/README.md', title: 'Long', phases: [phase('one', 'active')], tasks: Array.from({ length: 8 }, (_, index) => pending(`Task ${index}`, 'one')) });
	const longSnapshot: CampaignSnapshot = { ...snapshot, campaigns: [long] };

	it('folds a phase of more than 6 tasks to 6 and keeps the full count', () => {
		const group = screenOf(longSnapshot).campaign?.groups[0];

		expect(group?.tasks).toHaveLength(6);
		expect(group?.countText).toBe('0/8');
		expect(group?.more).toEqual({ label: 'View more (2)', expanded: false });
	});

	it('shows every task of a phase once its panel is expanded', () => {
		const page = campaignScreenView(campaignListView(longSnapshot, { today: TODAY, defaultStaleAfterDays: 14, t: en }), null, en, new Set([groupToggleKey('P/Long/README.md', 'one')]));

		expect(page.campaign?.groups[0]?.tasks).toHaveLength(8);
		expect(page.campaign?.groups[0]?.more).toEqual({ label: 'View less', expanded: true });
	});

	it('draws the toggle inside the folded panel, and none in a short one', () => {
		const html = renderToStaticMarkup(<CampaignScreen view={screenOf(longSnapshot)} sending={null} message={null} onSelect={noop} onOpenNote={noop} onSend={noop} onSendHabit={noop} />);

		expect(html).toContain('<button type="button" class="dromos-btn is-small dromos-list-toggle" aria-expanded="false">View more (2)</button>');
		expect(render()).not.toContain('dromos-list-toggle');
	});
});

describe('open a mission among the campaign tasks (missions S5)', () => {
	const items = [
		{ title: 'Sketch', completed: true },
		{ title: 'Build', completed: false },
		{ title: 'Ship', completed: false },
	];
	const withMission = campaign({ path: 'P/M/README.md', title: 'M', phases: [phase('one', 'active')], tasks: [task('Plan', 'one', { habiticaId: 'h1', checklist: { done: 1, total: 3, items } })] });
	const missionSnapshot: CampaignSnapshot = { ...snapshot, campaigns: [withMission] };
	const list = campaignListView(missionSnapshot, { today: TODAY, defaultStaleAfterDays: 14, t: en });

	it('folds the mission to its toggle, and lists its subtasks once the reader opens it', () => {
		expect(campaignScreenView(list, null, en).campaign?.groups[0]?.tasks[0]?.subtasks).toEqual({ open: false, toggleLabel: 'Show the subtasks of Plan', items: [] });
		expect(campaignScreenView(list, null, en, new Set(), new Set([taskToggleKey('P/M/README.md', 'Plan')])).campaign?.groups[0]?.tasks[0]?.subtasks).toEqual({
			open: true,
			toggleLabel: 'Hide the subtasks of Plan',
			items,
		});
	});

	it('draws the toggle on the row, and the subtasks under its title once open', () => {
		const open = renderToStaticMarkup(<CampaignTaskRow row={row({ subtasks: { open: true, toggleLabel: 'Hide the subtasks of Report', items } })} sending={false} onSend={noop} />);

		expect(open).toContain('<button type="button" class="clickable-icon dromos-subtasks-toggle" aria-expanded="true" aria-label="Hide the subtasks of Report">');
		expect([...open.matchAll(/<li class="(dromos-subtask[^"]*)">/g)].map((match) => match[1])).toEqual(['dromos-subtask is-completed', 'dromos-subtask', 'dromos-subtask']);
	});
});
