import { describe, expect, it } from 'vitest';
import { createTranslator } from '../../src/i18n';
import { campaignHomeCardView, roadView } from '../../src/ui/presenters/campaignHomeView';
import { campaignCardView } from '../../src/ui/presenters/campaignView';
import { campaign, phase, task } from '../domain/campaign/campaignFixtures';

const en = createTranslator('en');
const es = createTranslator('es');
const TODAY = '2026-10-31';
const ctx = { today: TODAY, defaultStaleAfterDays: 14, issues: [], canSend: true, habiticaKnown: true, t: en };

const done = (title: string, phaseId: string | null) => task(title, phaseId, { habiticaId: `h-${title}`, completed: true, completedOn: '2026-10-25' });
const pending = (title: string, phaseId: string | null) => task(title, phaseId, { habiticaId: `h-${title}` });

const kairos = campaign({
	path: 'P/Kairos/README.md',
	title: 'Kairos',
	phases: [phase('design', 'completed'), phase('mvp', 'active'), phase('ship', 'planning')],
	tasks: [done('Flows', 'design'), done('Wireframes', 'design'), done('Schema', 'mvp'), pending('Timer', 'mvp'), pending('Report', 'mvp'), pending('Beta', 'ship')],
});
const card = campaignCardView(kairos, ctx);

describe('roadView: one segment per task, grouped by phase (game-ui S7)', () => {
	it('marks the done tasks, the next one and the ones ahead, phase by phase', () => {
		expect(roadView(card).phases.map((stretch) => [stretch.id, stretch.segments])).toEqual([
			['design', ['done', 'done']],
			['mvp', ['done', 'next', 'ahead']],
			['ship', ['ahead']],
		]);
	});

	it('puts the next segment on the task the card names as the next step', () => {
		expect(card.next).toBe('Timer');
		expect(roadView({ ...card, tasks: card.tasks.map((row) => (row.title === 'Timer' ? { ...row, state: 'completed' as const } : row)) }).phases[1]?.segments).toEqual(['done', 'done', 'next']);
	});

	it('names each phase with its count, and weighs it by its tasks', () => {
		expect(roadView(card).phases.map((stretch) => [stretch.name, stretch.countText, stretch.weight])).toEqual([
			['Phase design', '2/2', 2],
			['Phase mvp', '1/3', 3],
			['Phase ship', '0/1', 1],
		]);
	});

	it('opens the gate after a complete phase only', () => {
		expect(roadView(card).phases.map((stretch) => stretch.complete)).toEqual([true, false, false]);
	});

	it('counts a phase whose tasks are all done as complete although its status still says active', () => {
		const allDone = campaignCardView({ ...kairos, phases: [phase('design', 'active'), phase('mvp', 'planning')], tasks: [done('Flows', 'design')] }, ctx);

		expect(roadView(allDone).phases.map((stretch) => stretch.complete)).toEqual([true, false]);
	});

	it('draws a phase without tasks as one segment filled by its percent', () => {
		const research = campaignCardView(campaign({ kind: 'research', phases: [phase('read', 'completed'), phase('sum', 'active'), phase('try')] }), ctx);

		expect(roadView(research).phases.map((stretch) => [stretch.segments, stretch.fill, stretch.countText, stretch.weight])).toEqual([
			[[], { state: 'done', percent: 100 }, null, 1],
			[[], { state: 'open', percent: 0 }, null, 1],
			[[], { state: 'ahead', percent: 0 }, null, 1],
		]);
	});

	it('draws a campaign without phases as one unnamed stretch of its tasks', () => {
		const loose = campaignCardView(campaign({ phases: [], tasks: [done('One', null), pending('Two', null)] }), ctx);

		expect(roadView(loose).phases).toEqual([{ id: '', name: '', segments: ['done', 'ahead'], fill: null, countText: '1/2', complete: false, weight: 2 }]);
	});

	it('draws a campaign with neither phases nor tasks as one stretch filled by its progress', () => {
		const empty = campaignCardView(campaign({ phases: [], tasks: [] }), ctx);

		expect(roadView(empty).phases).toEqual([{ id: '', name: '', segments: [], fill: { state: 'open', percent: 0 }, countText: null, complete: false, weight: 1 }]);
	});
});

describe('campaignHomeCardView: the compact card of the home screen (game-ui S7)', () => {
	it('shows the count of tasks done when the campaign moves', () => {
		expect(campaignHomeCardView(card, en)).toMatchObject({ seal: null, countText: '3 of 6 tasks', staleText: null });
	});

	it('shows the stalled seal instead of the count, and how long it has been', () => {
		const stalled = campaignCardView(kairos, { ...ctx, today: '2026-11-20' });

		expect(campaignHomeCardView(stalled, en)).toMatchObject({ seal: 'stalled', countText: null, staleText: 'No progress for 26 days' });
		expect(campaignHomeCardView(stalled, es)).toMatchObject({ seal: 'detenida', countText: null, staleText: 'Sin avance hace 26 días' });
	});

	it('counts phases for a campaign without tasks', () => {
		const research = campaignCardView(campaign({ kind: 'research', created: '2026-10-28', phases: [phase('read', 'completed'), phase('sum', 'active')] }), ctx);

		expect(campaignHomeCardView(research, es).countText).toBe('1 de 2 fases');
	});

	it('carries what opening the campaign needs: its path and a name that says so', () => {
		expect(campaignHomeCardView(card, en)).toMatchObject({ path: 'P/Kairos/README.md', title: 'Kairos', openLabel: 'Open campaign Kairos' });
		expect(campaignHomeCardView(card, es).openLabel).toBe('Abrir campaña Kairos');
	});

	it('gives the next step after its label, and the progress a screen reader hears', () => {
		expect(campaignHomeCardView(card, en)).toMatchObject({
			nextLabel: 'Next step',
			next: 'Timer',
			progress: { label: 'Progress of Kairos', percent: 33, valueText: 'Phase mvp 1/3' },
		});
		expect(campaignHomeCardView({ ...card, next: null }, es)).toMatchObject({ nextLabel: 'Siguiente paso', next: 'Nada pendiente' });
	});

	it('keeps one short line for the tasks Habitica no longer has, so nothing is hidden', () => {
		const issues = [
			{ campaignPath: kairos.path, taskTitle: 'Timer', kind: 'habitica-task-missing' as const },
			{ campaignPath: kairos.path, taskTitle: 'Report', kind: 'habitica-task-missing' as const },
		];

		expect(campaignHomeCardView(card, en).problem).toBeNull();
		expect(campaignHomeCardView(campaignCardView(kairos, { ...ctx, issues: issues.slice(0, 1) }), en).problem).toBe('1 task or habit not found in Habitica');
		expect(campaignHomeCardView(campaignCardView(kairos, { ...ctx, issues }), es).problem).toBe('2 tareas o hábitos no encontrados en Habitica');
	});
});

describe('campaignHomeCardView: the folded card (home-fit S1)', () => {
	it('carries the overall progress the thin bar draws: tasks done over tasks, and its count in words', () => {
		expect(campaignHomeCardView(card, en).overall).toEqual({ percent: 50, text: '3 of 6 tasks' });
		expect(campaignHomeCardView(card, es).overall).toEqual({ percent: 50, text: '3 de 6 tareas' });
	});

	it('keeps the count in words for the bar of a stalled campaign, whose seal hides the count', () => {
		const stalled = campaignCardView(kairos, { ...ctx, today: '2026-11-20' });

		expect(campaignHomeCardView(stalled, en)).toMatchObject({ countText: null, overall: { percent: 50, text: '3 of 6 tasks' } });
	});

	it('measures a campaign without tasks by its phases', () => {
		const research = campaignCardView(campaign({ kind: 'research', created: '2026-10-28', phases: [phase('read', 'completed'), phase('sum', 'active')] }), ctx);

		expect(campaignHomeCardView(research, en).overall).toEqual({ percent: 50, text: '1 of 2 phases' });
	});

	it('names the way to the campaigns screen in the open card', () => {
		expect(campaignHomeCardView(card, en).openText).toBe('Open campaign');
		expect(campaignHomeCardView(card, es).openText).toBe('Abrir campaña');
	});
});
