import { describe, expect, it } from 'vitest';
import type { CampaignSnapshot } from '../../src/application';
import { createTranslator } from '../../src/i18n';
import { campaignScreenView, deadlineText } from '../../src/ui/presenters/campaignScreenView';
import { campaignListView } from '../../src/ui/presenters/campaignView';
import { campaign, phase, task } from '../domain/campaign/campaignFixtures';

const en = createTranslator('en');
const es = createTranslator('es');
const TODAY = '2026-11-03';

const done = (title: string, phaseId: string | null) => task(title, phaseId, { habiticaId: `h-${title}`, completed: true, completedOn: '2026-11-01' });
const pending = (title: string, phaseId: string | null) => task(title, phaseId, { habiticaId: `h-${title}` });

const kairos = campaign({
	path: 'P/Kairos/README.md',
	title: 'Kairos',
	deadline: '2026-11-28',
	phases: [phase('design', 'completed'), phase('mvp', 'active'), phase('ship', 'planning')],
	tasks: [done('Flows', 'design'), done('Schema', 'mvp'), pending('Timer', 'mvp'), task('Report', 'mvp'), pending('Beta', 'ship'), pending('Loose', null), pending('Stray', 'gone')],
});
const cheshbon = campaign({ path: 'P/Cheshbon/README.md', title: 'Cheshbon', phases: [phase('one', 'active')], tasks: [pending('Ledger', 'one')] });

function snapshot(overrides: Partial<CampaignSnapshot> = {}): CampaignSnapshot {
	return { campaigns: [kairos, cheshbon], areas: [], issues: [], lastSyncedAt: new Date('2026-11-03T12:00:00Z'), status: { kind: 'synced' }, ...overrides };
}

const screen = (value: CampaignSnapshot, selected: string | null = null, t = en) => campaignScreenView(campaignListView(value, { today: TODAY, defaultStaleAfterDays: 14, t }), selected, t);

describe('deadlineText (game-ui S8)', () => {
	it('gives the date and the days left, with the day and the short month', () => {
		expect(deadlineText('2026-11-28', 25, en)).toBe('Due 28 Nov · 25 days left');
		expect(deadlineText('2026-11-28', 25, es)).toBe('Entrega 28 nov · faltan 25 días');
		expect(deadlineText('2026-11-04', 1, en)).toBe('Due 4 Nov · 1 day left');
		expect(deadlineText('2026-11-04', 1, es)).toBe('Entrega 4 nov · falta 1 día');
	});

	it('reads the date as written, with no time-zone shift, on the first and the last day of a month', () => {
		expect(deadlineText('2027-01-01', 59, en)).toBe('Due 1 Jan · 59 days left');
		expect(deadlineText('2026-12-31', 58, es)).toBe('Entrega 31 dic · faltan 58 días');
	});

	it('says "Due today" on the day itself', () => {
		expect(deadlineText('2026-11-03', 0, en)).toBe('Due today');
		expect(deadlineText('2026-11-03', 0, es)).toBe('Entrega hoy');
	});

	it('counts the days overdue once past', () => {
		expect(deadlineText('2026-10-31', -3, en)).toBe('3 days overdue');
		expect(deadlineText('2026-11-02', -1, en)).toBe('1 day overdue');
		expect(deadlineText('2026-10-31', -3, es)).toBe('Entrega vencida hace 3 días');
		expect(deadlineText('2026-11-02', -1, es)).toBe('Entrega vencida hace 1 día');
	});

	it('says there is no deadline when there is none, or it is no real day', () => {
		expect(deadlineText(null, null, en)).toBe('No deadline');
		expect(deadlineText(null, null, es)).toBe('Sin fecha de entrega');
		expect(deadlineText('2026-13-01', null, en)).toBe('No deadline');
	});
});

describe('campaignScreenView: the tabs (game-ui S8)', () => {
	it('has one tab per campaign and selects the first one by default', () => {
		const view = screen(snapshot());

		expect(view.tabs).toEqual([
			{ path: 'P/Kairos/README.md', title: 'Kairos', selected: true },
			{ path: 'P/Cheshbon/README.md', title: 'Cheshbon', selected: false },
		]);
		expect(view.tabsLabel).toBe('Choose a campaign');
		expect(view.campaign?.title).toBe('Kairos');
	});

	it('selects the campaign asked for, and falls back to the first one when it is gone', () => {
		expect(screen(snapshot(), 'P/Cheshbon/README.md').tabs.map((tab) => tab.selected)).toEqual([false, true]);
		expect(screen(snapshot(), 'P/Cheshbon/README.md').campaign?.title).toBe('Cheshbon');
		expect(screen(snapshot(), 'P/Gone/README.md').campaign?.title).toBe('Kairos');
	});

	it('titles the header card after the campaign, and in Spanish too', () => {
		expect(screen(snapshot()).title).toBe('Campaigns · Kairos');
		expect(screen(snapshot(), null, es).title).toBe('Campañas · Kairos');
		expect(screen(snapshot(), null, es).tabsLabel).toBe('Elegir campaña');
	});

	it('keeps the empty states, with the plain title and no campaign', () => {
		const none = screen(snapshot({ campaigns: [] }));
		const before = screen(snapshot({ campaigns: null }));

		expect([none.title, none.emptyText, none.tabs, none.campaign]).toEqual(['Campaigns', 'No active campaigns.', [], null]);
		expect(before.emptyText).toBe('Campaigns will appear after syncing.');
	});

	it('keeps the notice while Habitica is not set up, with the campaigns of the vault', () => {
		const view = screen(snapshot({ status: { kind: 'not-configured' } }));

		expect(view.notice).toBe('Connect your Habitica account to see the progress of sent tasks.');
		expect(view.campaign?.title).toBe('Kairos');
	});
});

describe('campaignScreenView: the header panel (game-ui S8)', () => {
	const detail = screen(snapshot()).campaign;

	it('gives the kind, the name, the deadline and the note to open', () => {
		expect(detail).toMatchObject({ path: 'P/Kairos/README.md', kindLabel: 'Project', title: 'Kairos', deadlineText: 'Due 28 Nov · 25 days left', openNoteLabel: 'Open note' });
	});

	it('counts every task for the overall bar and names the next step', () => {
		expect(detail?.progress).toEqual({ percent: 29, countText: '2 of 7 tasks', label: 'Progress of Kairos' });
		expect([detail?.nextLabel, detail?.next]).toEqual(['Next step', 'Timer']);
	});

	it('shows the seal and the stale text only while the campaign is stale', () => {
		expect([detail?.seal, detail?.staleText]).toEqual([null, null]);
		const stale = screen(snapshot({ campaigns: [{ ...kairos, created: '2026-08-01', tasks: kairos.tasks.map((item) => (item.completed ? { ...item, completedOn: '2026-10-01' } : item)) }] })).campaign;
		expect([stale?.seal, stale?.staleText]).toEqual(['stalled', 'No progress for 33 days']);
	});

	it('names the road apart from the overall bar, and counts each phase in tasks', () => {
		expect(detail?.roadProgress.label).toBe('Route of Kairos');
		expect(detail?.road.phases.map((stretch) => stretch.countText)).toEqual(['1/1 tasks', '1/3 tasks', '0/1 tasks']);
		expect(screen(snapshot(), null, es).campaign?.road.phases[1]?.countText).toBe('1/3 tareas');
	});

	it('lists every problem of the campaign in full', () => {
		const view = screen(snapshot({ issues: [{ campaignPath: 'P/Kairos/README.md', taskTitle: 'Beta', kind: 'habitica-task-missing' }] }));
		expect(view.campaign?.warnings).toEqual(['"Beta" was not found in Habitica.']);
	});
});

describe('campaignScreenView: the tasks by phase (game-ui S8)', () => {
	const groups = screen(snapshot()).campaign?.groups ?? [];

	it('groups the tasks by phase in road order, the ones without a known phase last', () => {
		expect(groups.map((group) => [group.name, group.countText, group.tasks.map((row) => row.title)])).toEqual([
			['Phase design', '1/1', ['Flows']],
			['Phase mvp', '1/3', ['Schema', 'Timer', 'Report']],
			['Phase ship', '0/1', ['Beta']],
			['Without a phase', '0/2', ['Loose', 'Stray']],
		]);
	});

	it('leaves out a phase with no tasks, and has no group for a campaign without tasks', () => {
		const research = campaign({ kind: 'research', path: 'R/Spaced/README.md', title: 'Spaced', phases: [phase('read', 'completed'), phase('sum', 'active')] });
		const partly = { ...kairos, tasks: kairos.tasks.filter((item) => item.phase !== 'ship') };

		expect(screen(snapshot({ campaigns: [research] })).campaign?.groups).toEqual([]);
		expect(screen(snapshot({ campaigns: [partly] })).campaign?.groups.map((group) => group.name)).toEqual(['Phase design', 'Phase mvp', 'Without a phase']);
	});

	it('chips each task: Done, Next, Pending, Not linked and Not found in Habitica', () => {
		const view = screen(snapshot({ status: { kind: 'not-configured' }, issues: [{ campaignPath: 'P/Kairos/README.md', taskTitle: 'Beta', kind: 'habitica-task-missing' }] }));
		const chips = (view.campaign?.groups ?? []).flatMap((group) => group.tasks.map((row) => [row.title, row.chip.label, row.chip.tone]));

		expect(chips).toEqual([
			['Flows', 'Done', 'done'],
			['Schema', 'Done', 'done'],
			['Timer', 'Next', 'next'],
			['Report', 'Not linked', 'unsent'],
			['Beta', 'Not found in Habitica', 'missing'],
			['Loose', 'Pending', 'pending'],
			['Stray', 'Pending', 'pending'],
		]);
	});

	it('chips the states in Spanish too', () => {
		const rows = (screen(snapshot(), null, es).campaign?.groups ?? []).flatMap((group) => group.tasks.map((row) => row.chip.label));
		expect(rows.slice(0, 4)).toEqual(['Hecha', 'Hecha', 'Siguiente', 'Pendiente']);
	});

	it('offers to send only a task never sent, and only while Habitica is set up, with no Not linked chip beside the button', () => {
		const sendable = groups.flatMap((group) => group.tasks).filter((row) => row.canSend);
		const notConfigured = (screen(snapshot({ status: { kind: 'not-configured' } })).campaign?.groups ?? []).flatMap((group) => group.tasks);

		expect(sendable.map((row) => [row.title, row.chip.label])).toEqual([['Report', 'Pending']]);
		expect(notConfigured.some((row) => row.canSend)).toBe(false);
	});

	it('marks a completed task as completed', () => {
		expect(groups[0]?.tasks[0]?.completed).toBe(true);
		expect(groups[1]?.tasks[1]?.completed).toBe(false);
	});
});

describe('campaignScreenView: the copy in both languages', () => {
	it('titles the sections, the habits one "Dailies" (ADR-021)', () => {
		const english = screen(snapshot()).campaign;
		const spanish = screen(snapshot(), null, es).campaign;

		expect([english?.pathTitle, english?.tasksTitle, english?.habitsTitle, english?.openNoteLabel]).toEqual(['The route', 'Tasks by phase', 'Dailies', 'Open note']);
		expect([spanish?.pathTitle, spanish?.tasksTitle, spanish?.habitsTitle, spanish?.openNoteLabel]).toEqual(['La ruta', 'Tareas por fase', 'Diarias', 'Abrir nota']);
		expect(spanish?.progress.countText).toBe('2 de 7 tareas');
		expect(spanish?.deadlineText).toBe('Entrega 28 nov · faltan 25 días');
	});
});

describe('campaignScreenView: a task deleted in Habitica (ADR-021, S3)', () => {
	const issues = [{ campaignPath: 'P/Kairos/README.md', taskTitle: 'Beta', kind: 'habitica-task-deleted' as const }];
	const beta = (value: CampaignSnapshot, t = en) => (screen(value, null, t).campaign?.groups ?? []).flatMap((group) => group.tasks).find((row) => row.title === 'Beta');

	it('chips it "Deleted in Habitica" and offers "Send again" instead of "Send"', () => {
		expect(beta(snapshot({ issues }))).toMatchObject({ chip: { label: 'Deleted in Habitica', tone: 'deleted' }, canSend: false, canResend: true });
		expect(beta(snapshot({ issues }), es)?.chip.label).toBe('Borrada en Habitica');
	});

	it('chips it deleted with no button while Habitica is not set up', () => {
		expect(beta(snapshot({ issues, status: { kind: 'not-configured' } }))).toMatchObject({ chip: { label: 'Deleted in Habitica' }, canResend: false });
	});

	it('offers "Send again" on no task Habitica did not confirm deleted', () => {
		const rows = (screen(snapshot({ issues: [{ campaignPath: 'P/Kairos/README.md', taskTitle: 'Beta', kind: 'habitica-task-missing' }] })).campaign?.groups ?? []).flatMap((group) => group.tasks);

		expect(rows.some((row) => row.canResend)).toBe(false);
	});
});
