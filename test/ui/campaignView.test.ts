import { describe, expect, it } from 'vitest';
import type { CampaignSnapshot } from '../../src/application';
import { campaignCardView, campaignListView } from '../../src/ui/presenters/campaignView';
import { campaign, phase, task } from '../domain/campaign/campaignFixtures';

const TODAY = '2026-10-31';
const ctx = { today: TODAY, defaultStaleAfterDays: 14, issues: [] };

const kairos = campaign({
	path: 'P/Kairos/README.md',
	title: 'Kairos',
	created: '2026-08-01',
	phases: [phase('design', 'completed'), phase('mvp', 'active'), phase('ship', 'planning')],
	tasks: [
		task('Design', 'design', { habiticaId: 'h0', completed: true, completedOn: '2026-10-22' }),
		task('Timer', 'mvp', { habiticaId: 'h1', completed: true, completedOn: '2026-10-22' }),
		task('Time screen', 'mvp', { habiticaId: 'h2' }),
		task('Send gold', 'mvp'),
		task('Release', 'ship', { habiticaId: 'h3' }),
	],
});

describe('campaignCardView: projects', () => {
	const card = campaignCardView(kairos, ctx);

	it('names the campaign and its kind', () => {
		expect(card).toMatchObject({ path: 'P/Kairos/README.md', title: 'Kairos', kindLabel: 'Proyecto' });
	});

	it('chips the current phase with its progress, and the bar follows it', () => {
		expect(card.chip).toBe('Phase mvp 1/3');
		expect(card.progress).toEqual({ ratio: 1 / 3, percent: 33 });
	});

	it('points at the next pending task of the current phase', () => {
		expect(card.next).toBe('Time screen');
	});

	it('rows every task with its state; only a task never sent can be sent', () => {
		expect(card.tasks.map((row) => [row.title, row.state, row.canSend])).toEqual([
			['Design', 'completed', false],
			['Timer', 'completed', false],
			['Time screen', 'pending', false],
			['Send gold', 'unsent', true],
			['Release', 'pending', false],
		]);
	});

	it('is stale from 14 days without a completed task, and says how many days', () => {
		expect(card.stale).toBeNull();
		expect(campaignCardView({ ...kairos, created: '2026-10-01', tasks: [] }, ctx).stale).toEqual({ days: 30 });
		expect(campaignCardView(kairos, { ...ctx, today: '2026-11-05' }).stale).toEqual({ days: 14 });
	});

	it('uses the campaign threshold over the plugin default', () => {
		expect(campaignCardView({ ...kairos, staleAfterDays: 5 }, ctx).stale).toEqual({ days: 9 });
		expect(campaignCardView(kairos, { ...ctx, defaultStaleAfterDays: 7 }).stale).toEqual({ days: 9 });
	});

	it('marks a task whose Habitica task is gone, and warns about it', () => {
		const issues = [{ campaignPath: 'P/Kairos/README.md', taskTitle: 'Time screen', kind: 'habitica-task-missing' as const }];

		const withIssue = campaignCardView(kairos, { ...ctx, issues });

		expect(withIssue.tasks.find((row) => row.title === 'Time screen')?.state).toBe('missing');
		expect(withIssue.warnings).toEqual(['"Time screen" no se encontró en Habitica.']);
	});

	it('ignores issues of other campaigns', () => {
		const issues = [{ campaignPath: 'P/Other/README.md', taskTitle: 'Time screen', kind: 'habitica-task-missing' as const }];

		expect(campaignCardView(kairos, { ...ctx, issues }).warnings).toEqual([]);
	});

	it('falls back to the task total when there is no open phase, never NaN', () => {
		const done = campaignCardView(campaign({ phases: [phase('a', 'completed')], tasks: [task('x', 'a', { completed: true })] }), ctx);
		const bare = campaignCardView(campaign({ created: '2026-10-30' }), ctx);

		expect(done).toMatchObject({ chip: '1/1 tareas', next: null, progress: { ratio: 1, percent: 100 } });
		expect(bare).toMatchObject({ chip: '0/0 tareas', next: null, progress: { ratio: 0, percent: 0 }, stale: null });
	});
});

describe('campaignCardView: research', () => {
	const research = campaign({
		kind: 'research',
		title: 'Apócrifos',
		created: '2026-09-12',
		phases: [phase('s1', 'completed'), phase('s2', 'completed'), phase('s3', 'planning'), phase('s4', 'planning')],
		tasks: [task('Sesión 1', 's1', { completed: true, completedOn: '2026-10-25' }), task('Sesión 2', 's3')],
	});

	it('counts phases, points at the next phase and never offers to send a session', () => {
		const card = campaignCardView(research, ctx);

		expect(card).toMatchObject({ kindLabel: 'Investigación', chip: '2/4 fases', next: 'Phase s3', progress: { ratio: 0.5, percent: 50 } });
		expect(card.tasks.map((row) => [row.title, row.state, row.canSend])).toEqual([
			['Sesión 1', 'completed', false],
			['Sesión 2', 'pending', false],
		]);
		expect(card.stale).toBeNull();
	});
});

describe('campaignListView', () => {
	const snapshot = (overrides: Partial<CampaignSnapshot> = {}): CampaignSnapshot => ({
		campaigns: [kairos],
		issues: [],
		lastSyncedAt: new Date('2026-10-31T15:00:00.000Z'),
		status: { kind: 'synced' },
		...overrides,
	});
	const view = (value: CampaignSnapshot) => campaignListView(value, { today: TODAY, defaultStaleAfterDays: 14 });

	it('has a card per campaign and a footer that counts them', () => {
		expect(view(snapshot()).cards.map((card) => card.title)).toEqual(['Kairos']);
		expect(view(snapshot()).footer).toBe('1 campaña activa');
		expect(view(snapshot({ campaigns: [kairos, kairos] })).footer).toBe('2 campañas activas');
	});

	it('shows no notice when Habitica answered', () => {
		expect(view(snapshot()).notice).toBeNull();
		expect(view(snapshot({ status: { kind: 'syncing' } })).notice).toBeNull();
	});

	it('tells why the progress may be old or missing', () => {
		expect(view(snapshot({ status: { kind: 'not-configured' } })).notice).toBe('Conecta tu cuenta de Habitica para ver el progreso de las tareas enviadas.');
		for (const kind of ['offline', 'unauthorized', 'error'] as const) {
			expect(view(snapshot({ status: { kind } })).notice).toBe('No se pudo actualizar el progreso desde Habitica.');
		}
		expect(view(snapshot({ status: { kind: 'rate-limited', retryAfterSeconds: 5 } })).notice).toBe('No se pudo actualizar el progreso desde Habitica.');
	});

	it('has an empty state before the first sync and when nothing is active', () => {
		expect(view(snapshot({ campaigns: null })).emptyText).toBe('Las campañas aparecerán después de sincronizar.');
		expect(view(snapshot({ campaigns: [] })).emptyText).toBe('No hay campañas activas.');
		expect(view(snapshot()).emptyText).toBeNull();
	});
});
