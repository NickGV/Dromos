import { describe, expect, it } from 'vitest';
import type { CampaignSnapshot, LinkOutcome, QuestSnapshot, SyncStatus } from '../../src/application';
import type { Character } from '../../src/domain';
import { createTranslator } from '../../src/i18n';
import { campaignCardView, campaignListView } from '../../src/ui/presenters/campaignView';
import { characterCardView } from '../../src/ui/presenters/characterCardView';
import { linkOutcomeView } from '../../src/ui/presenters/linkOutcomeView';
import { questListView } from '../../src/ui/presenters/questListView';
import { agoText, syncBannerView } from '../../src/ui/presenters/syncBanner';
import { campaign, phase, task } from '../domain/campaign/campaignFixtures';
import { aQuest } from '../fakes/quests';

const t = createTranslator('en');
const NOW = new Date('2026-10-31T15:00:00.000Z');

describe('English: sync banner', () => {
	const quests = (status: SyncStatus, minutes: number | null = null): QuestSnapshot => ({
		quests: minutes === null ? null : [],
		lastSyncedAt: minutes === null ? null : new Date(NOW.getTime() - minutes * 60_000),
		status,
	});
	const banner = (status: SyncStatus, minutes: number | null = null) => syncBannerView(quests(status, minutes), NOW, t);

	it('says how long ago', () => {
		expect(agoText(0, t)).toBe('less than 1 min ago');
		expect(agoText(1, t)).toBe('1 min ago');
		expect(agoText(75, t)).toBe('75 min ago');
		expect(banner({ kind: 'synced' }, 5)).toEqual({ tone: 'success', message: 'Synced 5 min ago', detail: null });
	});

	it('words every status', () => {
		expect(banner({ kind: 'idle' })).toMatchObject({ message: 'Not synced yet' });
		expect(banner({ kind: 'syncing' })).toMatchObject({ message: 'Syncing…' });
		expect(banner({ kind: 'offline' })).toMatchObject({ tone: 'warning', message: 'Offline' });
		expect(banner({ kind: 'not-configured' })).toEqual({
			tone: 'neutral',
			message: 'Connect your Habitica account',
			detail: 'Enter your Habitica user ID and API token in the Dromos settings.',
		});
		expect(banner({ kind: 'unauthorized' })).toMatchObject({ tone: 'error', message: 'Invalid token' });
		expect(banner({ kind: 'error' })).toMatchObject({ message: 'Could not sync with Habitica', detail: 'Try again in a few minutes.' });
	});

	it('says how long to wait, in the singular and the plural', () => {
		const wait = (retryAfterSeconds: number | null) => banner({ kind: 'rate-limited', retryAfterSeconds }).detail;

		expect(wait(1)).toBe('Wait 1 second before syncing again.');
		expect(wait(42)).toBe('Wait 42 seconds before syncing again.');
		expect(wait(null)).toBe('Wait a moment before syncing again.');
	});

	it('tells that the list on screen is the last one of the session after a failure', () => {
		expect(banner({ kind: 'offline' }, 12).detail).toBe('Showing the last list fetched this session (12 min ago).');
	});
});

describe('English: quests', () => {
	it('words the empty states and the due labels', () => {
		expect(questListView(null, '2026-10-31', t).emptyText).toBe('Quests will appear after syncing with Habitica.');
		expect(questListView([], '2026-10-31', t).emptyText).toBe('No quests for today');
		const view = questListView(
			[aQuest('a', { type: 'todo', dueDate: '2026-10-29', dueToday: true }), aQuest('b', { type: 'todo', dueDate: '2026-10-31', dueToday: true })],
			'2026-10-31',
			t,
		);
		expect(view.todos.map((row) => row.due?.label)).toEqual(['Overdue', 'Today']);
	});
});

describe('English: character card', () => {
	const character: Character = {
		name: '',
		title: '',
		level: 4,
		totalXp: 900,
		xpIntoLevel: 240,
		xpToNext: 520,
		stats: { fuerza: 2, inteligencia: 4, espiritu: 3, disciplina: 5 },
	};

	it('words the level, the missing name and the four stats, keeping the data keys', () => {
		const view = characterCardView(character, t);

		expect(view.name).toBe('Unnamed');
		expect(view.levelText).toBe('Level 4');
		expect(view.xp.text).toBe('240 / 520 XP');
		expect(view.stats.map((stat) => [stat.id, stat.label])).toEqual([
			['fuerza', 'Strength'],
			['inteligencia', 'Intelligence'],
			['espiritu', 'Spirit'],
			['disciplina', 'Discipline'],
		]);
	});
});

describe('English: campaigns', () => {
	const ctx = { today: '2026-10-31', defaultStaleAfterDays: 14, issues: [], canSend: true, habiticaKnown: true, t };
	const open = campaign({
		title: 'Kairos',
		created: '2026-08-01',
		phases: [phase('mvp', 'active')],
		tasks: [task('Timer', 'mvp', { habiticaId: 'h1', completed: true, completedOn: '2026-10-22' }), task('Screen', 'mvp', { habiticaId: 'h2' })],
	});

	it('words the card', () => {
		const card = campaignCardView(open, ctx);

		expect(card).toMatchObject({ kindLabel: 'Project', chip: 'Phase mvp 1/2', next: 'Screen' });
		expect(campaignCardView({ ...open, kind: 'research' }, ctx)).toMatchObject({ kindLabel: 'Research', chip: '0/1 phases' });
		expect(campaignCardView(campaign({ created: '2026-10-30' }), ctx).chip).toBe('0/0 tasks');
	});

	it('words the stalled stamp data and the warning for a missing task', () => {
		const issues = [{ campaignPath: open.path, taskTitle: 'Screen', kind: 'habitica-task-missing' as const }];

		expect(campaignCardView(open, { ...ctx, issues }).warnings).toEqual(['"Screen" was not found in Habitica.']);
	});

	it('words the list: empty states, notices and the footer in both numbers', () => {
		const snapshot = (overrides: Partial<CampaignSnapshot>): CampaignSnapshot => ({
			campaigns: [open],
			issues: [],
			lastSyncedAt: NOW,
			status: { kind: 'synced' },
			...overrides,
		});
		const view = (value: CampaignSnapshot) => campaignListView(value, { today: '2026-10-31', defaultStaleAfterDays: 14, t });

		expect(view(snapshot({ campaigns: null })).emptyText).toBe('Campaigns will appear after syncing.');
		expect(view(snapshot({ campaigns: [] })).emptyText).toBe('No active campaigns.');
		expect(view(snapshot({})).footer).toBe('1 active campaign');
		expect(view(snapshot({ campaigns: [open, open] })).footer).toBe('2 active campaigns');
		expect(view(snapshot({ status: { kind: 'not-configured' } })).notice).toBe('Connect your Habitica account to see the progress of sent tasks.');
		expect(view(snapshot({ status: { kind: 'offline' } })).notice).toBe('Progress could not be refreshed from Habitica.');
	});
});

describe('English: send to Habitica', () => {
	const messages = (outcome: LinkOutcome) => linkOutcomeView(outcome, t).message;

	it('words every outcome', () => {
		expect(messages({ kind: 'linked', habiticaId: 'x' })).toBe('Task sent to Habitica.');
		expect(messages({ kind: 'already-linked' })).toBe('That task is already in Habitica.');
		expect(messages({ kind: 'not-found' })).toBe('The task was not found in the note. Sync and try again.');
		expect(messages({ kind: 'not-a-project' })).toBe('Only project tasks are sent to Habitica.');
		expect(messages({ kind: 'habitica-failed', error: 'Offline' })).toBe('Offline: the task could not be sent.');
		expect(messages({ kind: 'habitica-failed', error: 'Unauthorized' })).toBe('Invalid token: the task could not be sent.');
		expect(messages({ kind: 'habitica-failed', error: 'RateLimited' })).toBe('Too many requests to Habitica. Try again in a moment.');
		expect(messages({ kind: 'habitica-failed', error: 'Unknown' })).toBe('The task could not be sent to Habitica.');
		expect(messages({ kind: 'duplicate', habiticaId: 'abc' })).toContain('Id: abc');
		expect(messages({ kind: 'write-failed', habiticaId: 'abc' })).toBe('The task was created in Habitica but its id could not be saved in the note. Id: abc');
	});
});
