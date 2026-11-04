import { describe, expect, it } from 'vitest';
import type { CampaignSnapshot } from '../../src/application';
import { createTranslator } from '../../src/i18n';
import { campaignCardView, campaignListView } from '../../src/ui/presenters/campaignView';
import { campaign, habit, phase, task } from '../domain/campaign/campaignFixtures';

const t = createTranslator('es');
const TODAY = '2026-10-31';
const ctx = { today: TODAY, defaultStaleAfterDays: 14, issues: [], canSend: true, habiticaKnown: true, t };

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

describe('campaignCardView: the road of phases', () => {
	it('draws one segment per phase: the done ones, the open one with its progress, and the ones ahead', () => {
		expect(campaignCardView(kairos, ctx).segments).toEqual([
			{ id: 'design', name: 'Phase design', state: 'done', percent: 100 },
			{ id: 'mvp', name: 'Phase mvp', state: 'open', percent: 33 },
			{ id: 'ship', name: 'Phase ship', state: 'ahead', percent: 0 },
		]);
	});

	it('has no segments for a campaign without phases', () => {
		expect(campaignCardView(campaign({ path: 'P/Loose/README.md', title: 'Loose', phases: [], tasks: [task('Only', 'none')] }), ctx).segments).toEqual([]);
	});
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

describe('campaignCardView: before Habitica has answered', () => {
	const old = campaign({ created: '2026-08-01', tasks: [task('Linked', null, { habiticaId: 'h1' })] });

	it('does not stamp a project whose progress lives in Habitica as stale', () => {
		expect(campaignCardView(old, { ...ctx, habiticaKnown: false }).stale).toBeNull();
		expect(campaignCardView(old, ctx).stale).toEqual({ days: 91 });
	});

	it('still stamps a project with nothing sent to Habitica, and a research', () => {
		const unsent = campaign({ created: '2026-08-01', tasks: [task('Idle', null)] });
		const research = campaign({ kind: 'research', created: '2026-08-01', tasks: [task('Session', 's1', { habiticaId: 'h1' })] });

		expect(campaignCardView(unsent, { ...ctx, habiticaKnown: false }).stale).toEqual({ days: 91 });
		expect(campaignCardView(research, { ...ctx, habiticaKnown: false }).stale).toEqual({ days: 91 });
	});
});

describe('campaignCardView: sending', () => {
	it('offers no send button when Habitica is not set up', () => {
		const rows = campaignCardView(kairos, { ...ctx, canSend: false }).tasks;

		expect(rows.find((row) => row.title === 'Send gold')).toMatchObject({ state: 'unsent', canSend: false });
	});
});

describe('campaignCardView: habits (S8)', () => {
	const salto = campaign({
		path: 'P/Salto/README.md',
		title: 'Salto',
		habits: [
			habit('Estiramiento', { habiticaId: 'd1', days: 21, streak: 12 }),
			habit('Dormir', { habiticaId: 'd2', days: 30, streak: 30 }),
			habit('Sin enviar', { days: 14 }),
			habit('Perdido', { habiticaId: 'd3', streak: 4 }),
			habit('Aún sin leer', { habiticaId: 'd4' }),
			habit('Empezando', { habiticaId: 'd5', streak: 0 }),
		],
	});
	const issues = [{ campaignPath: 'P/Salto/README.md', taskTitle: 'Perdido', kind: 'habitica-task-missing' as const }];

	it('rows each habit with its streak over its target days', () => {
		const rows = campaignCardView(salto, { ...ctx, issues }).habits;

		expect(rows[0]).toEqual({ title: 'Estiramiento', state: 'tracking', canSend: false, progress: { done: 12, total: 21, percent: 57 }, text: 'Racha: 12 de 21 días' });
		expect(rows[5]).toEqual({ title: 'Empezando', state: 'tracking', canSend: false, progress: { done: 0, total: 21, percent: 0 }, text: 'Racha: 0 de 21 días' });
	});

	it('says a habit is built once the streak reaches its target', () => {
		expect(campaignCardView(salto, ctx).habits[1]).toEqual({
			title: 'Dormir',
			state: 'built',
			canSend: false,
			progress: { done: 30, total: 30, percent: 100 },
			text: 'Hábito formado: 30 días',
		});
	});

	it('offers to send a habit never sent, and shows its target', () => {
		expect(campaignCardView(salto, ctx).habits[2]).toEqual({
			title: 'Sin enviar',
			state: 'unsent',
			canSend: true,
			progress: { done: 0, total: 14, percent: 0 },
			text: 'Meta: 14 días',
		});
	});

	it('offers no send button when Habitica is not set up', () => {
		expect(campaignCardView(salto, { ...ctx, canSend: false }).habits[2]).toMatchObject({ state: 'unsent', canSend: false });
	});

	it('marks a habit whose daily is gone, and warns about it', () => {
		const card = campaignCardView(salto, { ...ctx, issues });

		expect(card.habits[3]).toMatchObject({ title: 'Perdido', state: 'missing', canSend: false, progress: { done: 0, total: 21, percent: 0 } });
		expect(card.warnings).toEqual(['"Perdido" no se encontró en Habitica.']);
	});

	it('shows only the target of a linked habit whose streak Habitica has not told yet', () => {
		expect(campaignCardView(salto, ctx).habits[4]).toMatchObject({ state: 'tracking', progress: { done: 0, total: 21, percent: 0 }, text: 'Meta: 21 días' });
	});

	it('has no habits for a campaign without them, and says so in English too', () => {
		expect(campaignCardView(kairos, ctx).habits).toEqual([]);
		expect(campaignCardView(salto, { ...ctx, t: createTranslator('en') }).habits[0]?.text).toBe('Streak: 12 of 21 days');
	});
});

describe('campaignCardView: the deadline and the phase of each task (game-ui S8)', () => {
	it('gives the deadline as stored and the whole days left from today, negative once it has passed', () => {
		const left = (deadline: string | null) => {
			const card = campaignCardView({ ...kairos, deadline }, ctx);
			return [card.deadline, card.daysLeft];
		};

		expect(left('2026-11-10')).toEqual(['2026-11-10', 10]);
		expect(left(TODAY)).toEqual([TODAY, 0]);
		expect(left('2026-10-29')).toEqual(['2026-10-29', -2]);
		expect(left(null)).toEqual([null, null]);
	});

	it('gives no days left, never NaN, for a deadline that is not a real day', () => {
		const card = campaignCardView({ ...kairos, deadline: '2026-13-01' }, ctx);

		expect([card.deadline, card.daysLeft]).toEqual(['2026-13-01', null]);
	});

	it('counts the days left from the given day, not the system clock', () => {
		expect(campaignCardView({ ...kairos, deadline: '2026-12-01' }, { ...ctx, today: '2026-11-30' }).daysLeft).toBe(1);
	});

	it('gives each task row the id of its phase, as the segments carry it, and null to a task without phase', () => {
		const loose = { ...kairos, tasks: [...kairos.tasks, task('Loose', null)] };

		const card = campaignCardView(loose, ctx);

		expect(card.tasks.map((row) => [row.title, row.phase])).toEqual([
			['Design', 'design'],
			['Timer', 'mvp'],
			['Time screen', 'mvp'],
			['Send gold', 'mvp'],
			['Release', 'ship'],
			['Loose', null],
		]);
		expect(card.segments.map((segment) => segment.id)).toEqual(['design', 'mvp', 'ship']);
	});

	it('keeps everything else a card showed before', () => {
		const small = campaign({
			path: 'P/Small/README.md',
			title: 'Small',
			created: '2026-10-01',
			phases: [phase('a', 'active')],
			tasks: [task('Uno', 'a', { habiticaId: 'h1', completed: true, completedOn: '2026-10-30' }), task('Dos', 'a')],
		});

		expect(campaignCardView(small, ctx)).toEqual({
			path: 'P/Small/README.md',
			title: 'Small',
			kindLabel: 'Proyecto',
			stale: null,
			chip: 'Phase a 1/2',
			next: 'Dos',
			progress: { ratio: 0.5, percent: 50 },
			segments: [{ id: 'a', name: 'Phase a', state: 'open', percent: 50 }],
			tasks: [
				{ title: 'Uno', state: 'completed', canSend: false, phase: 'a' },
				{ title: 'Dos', state: 'unsent', canSend: true, phase: 'a' },
			],
			habits: [],
			warnings: [],
			deadline: null,
			daysLeft: null,
		});
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
	const view = (value: CampaignSnapshot) => campaignListView(value, { today: TODAY, defaultStaleAfterDays: 14, t });

	it('trusts the stale stamp only once Habitica has answered', () => {
		const old = campaign({ created: '2026-08-01', tasks: [task('Linked', null, { habiticaId: 'h1' })] });
		const stale = (value: CampaignSnapshot) => view(value).cards[0]?.stale;

		expect(stale(snapshot({ campaigns: [old], lastSyncedAt: null, status: { kind: 'offline' } }))).toBeNull();
		expect(stale(snapshot({ campaigns: [old] }))).toEqual({ days: 91 });
	});

	it('hides the send button until Habitica is set up', () => {
		const rows = (status: CampaignSnapshot['status']) => view(snapshot({ status })).cards[0]?.tasks.filter((row) => row.canSend) ?? [];

		expect(rows({ kind: 'synced' })).toHaveLength(1);
		expect(rows({ kind: 'not-configured' })).toHaveLength(0);
	});

	it('has a card per campaign', () => {
		expect(view(snapshot()).cards.map((card) => card.title)).toEqual(['Kairos']);
		expect(view(snapshot({ campaigns: [kairos, kairos] })).cards).toHaveLength(2);
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
