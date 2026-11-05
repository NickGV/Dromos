import { describe, expect, it } from 'vitest';
import { createTranslator } from '../../src/i18n';
import { questListView, questPanelView } from '../../src/ui/presenters/questListView';
import { aQuest } from '../fakes/quests';

const TODAY = '2026-10-30';

const t = createTranslator('es');

describe('questListView', () => {
	it('explains that quests appear after syncing when nothing was fetched yet', () => {
		expect(questListView(null, TODAY, t)).toEqual({
			dailies: [],
			todos: [],
			emptyText: 'Las quests aparecerán después de sincronizar con Habitica.',
		});
	});

	it('says "No hay quests para hoy" when a sync returned nothing', () => {
		expect(questListView([], TODAY, t).emptyText).toBe('No hay quests para hoy');
	});

	it('has no empty text when there are quests', () => {
		expect(questListView([aQuest('d1')], TODAY, t).emptyText).toBeNull();
	});

	it('puts dailies first and to-dos after, each in source order', () => {
		const view = questListView(
			[
				aQuest('t1', { type: 'todo', dueDate: null, dueToday: false }),
				aQuest('d1'),
				aQuest('t2', { type: 'todo', dueDate: null, dueToday: false }),
				aQuest('d2'),
			],
			TODAY,
		t);

		expect(view.dailies.map((row) => row.id)).toEqual(['d1', 'd2']);
		expect(view.todos.map((row) => row.id)).toEqual(['t1', 't2']);
	});

	it('keeps completed dailies, flagged so they can be struck through', () => {
		const view = questListView([aQuest('d1', { title: 'Rutina', completed: true }), aQuest('d2')], TODAY, t);

		expect(view.dailies).toEqual([
			{ id: 'd1', title: 'Rutina', completed: true, due: null, xp: null, skills: [] },
			{ id: 'd2', title: 'Quest d2', completed: false, due: null, xp: null, skills: [] },
		]);
	});

	it('labels to-dos as overdue or due today relative to today, and leaves undated ones without a date', () => {
		const view = questListView(
			[
				aQuest('late', { type: 'todo', dueDate: '2026-10-28', dueToday: true }),
				aQuest('today', { type: 'todo', dueDate: TODAY, dueToday: true }),
				aQuest('undated', { type: 'todo', dueDate: null, dueToday: false }),
			],
			TODAY,
		t);

		expect(view.todos.map((row) => [row.id, row.due])).toEqual([
			['late', { tone: 'overdue', label: 'Vencida' }],
			['today', { tone: 'today', label: 'Hoy' }],
			['undated', null],
		]);
	});

	it('labels against the given day, so a list synced yesterday shows yesterday’s to-dos as overdue', () => {
		const view = questListView([aQuest('t1', { type: 'todo', dueDate: '2026-10-29', dueToday: true })], TODAY, t);

		expect(view.todos[0]?.due).toEqual({ tone: 'overdue', label: 'Vencida' });
	});

	it('gives no label to a future-dated to-do', () => {
		const view = questListView([aQuest('t1', { type: 'todo', dueDate: '2026-11-02', dueToday: false })], TODAY, t);

		expect(view.todos[0]?.due).toBeNull();
	});

	it('gives each row the XP and the skills the game priced for its task, and nothing to a task it did not price (game-ui S6)', () => {
		const prices = new Map([
			['d1', { xp: 5, skills: [] }],
			['t1', { xp: 25, skills: [{ id: 'lector', name: 'Lector' }, { id: 'cuidador', name: 'Cuidador' }] }],
		]);
		const quests = [aQuest('d1'), aQuest('t1', { type: 'todo', dueDate: TODAY }), aQuest('t2', { type: 'todo', dueDate: null })];

		const view = questListView(quests, TODAY, t, prices);

		expect(view).toEqual({
			dailies: [{ id: 'd1', title: 'Quest d1', completed: false, due: null, xp: 5, skills: [] }],
			todos: [
				{ id: 't1', title: 'Quest t1', completed: false, due: { tone: 'today', label: 'Hoy' }, xp: 25, skills: [{ id: 'lector', name: 'Lector' }, { id: 'cuidador', name: 'Cuidador' }] },
				{ id: 't2', title: 'Quest t2', completed: false, due: null, xp: null, skills: [] },
			],
			emptyText: null,
		});
	});

	it('without prices (before the first game sync) keeps every row as before, with no XP and no skill', () => {
		const quests = [aQuest('d1', { title: 'Rutina', completed: true }), aQuest('late', { type: 'todo', dueDate: '2026-10-28', dueToday: true })];

		expect(questListView(quests, TODAY, t)).toEqual({
			dailies: [{ id: 'd1', title: 'Rutina', completed: true, due: null, xp: null, skills: [] }],
			todos: [{ id: 'late', title: 'Quest late', completed: false, due: { tone: 'overdue', label: 'Vencida' }, xp: null, skills: [] }],
			emptyText: null,
		});
		expect(questListView(null, TODAY, t, new Map([['d1', { xp: 5, skills: [] }]]))).toEqual({ dailies: [], todos: [], emptyText: 'Las quests aparecerán después de sincronizar con Habitica.' });
	});
});

describe('questPanelView: the header line counts dailies only (game-ui S6)', () => {
	const en = createTranslator('en');
	const prices = new Map([
		['d1', { xp: 10, skills: [] }],
		['d2', { xp: 15, skills: [] }],
		['d3', { xp: 20, skills: [] }],
		['t1', { xp: 40, skills: [] }],
	]);
	const panel = (quests: ReturnType<typeof aQuest>[], withPrices = true) => questPanelView(questListView(quests, TODAY, en, withPrices ? prices : undefined), en);

	it('counts the dailies done over the dailies, leaving to-dos out', () => {
		const view = panel([aQuest('d1', { completed: true }), aQuest('d2'), aQuest('d3'), aQuest('t1', { type: 'todo', dueDate: null })]);

		expect(view.doneText).toBe('1 of 3 dailies done');
	});

	it('adds up the XP the pending dailies still pay', () => {
		const view = panel([aQuest('d1', { completed: true }), aQuest('d2'), aQuest('d3'), aQuest('t1', { type: 'todo', dueDate: null })]);

		expect(view.gainText).toBe('+35 XP to earn');
	});

	it('says the day is complete once every daily is done', () => {
		const view = panel([aQuest('d1', { completed: true }), aQuest('d2', { completed: true }), aQuest('t1', { type: 'todo', dueDate: null })]);

		expect([view.doneText, view.gainText]).toEqual(['2 of 2 dailies done', 'Day complete']);
	});

	it('flags the day complete, for the campfire of the scene, only when every daily is done (game-ui S17)', () => {
		expect(panel([aQuest('d1', { completed: true }), aQuest('d2', { completed: true })]).dayComplete).toBe(true);
		expect(panel([aQuest('d1', { completed: true }), aQuest('d2', { completed: true })], false).dayComplete).toBe(true);
		expect(panel([aQuest('d1', { completed: true }), aQuest('d2')]).dayComplete).toBe(false);
		expect(panel([aQuest('t1', { type: 'todo', dueDate: null, completed: true })]).dayComplete).toBe(false);
		expect(questPanelView(questListView([], TODAY, en), en).dayComplete).toBe(false);
		expect(questPanelView(questListView(null, TODAY, en), en).dayComplete).toBe(false);
	});

	it('promises no XP while the game has not priced the pending dailies', () => {
		expect(panel([aQuest('d1'), aQuest('d2')], false).gainText).toBeNull();
	});

	it('has no header line without dailies, and none while the list is empty', () => {
		expect(panel([aQuest('t1', { type: 'todo', dueDate: null })])).toMatchObject({ doneText: null, gainText: null });
		expect(questPanelView(questListView(null, TODAY, en), en)).toEqual({ doneText: null, gainText: null, dayComplete: false, rows: [], emptyText: 'Quests will appear after syncing with Habitica.' });
	});

	it('says it in Spanish', () => {
		const view = questPanelView(questListView([aQuest('d1', { completed: true }), aQuest('d2')], TODAY, t, prices), t);

		expect([view.doneText, view.gainText]).toEqual(['1 de 2 diarias cumplidas', '+15 XP por ganar']);
	});
});

describe('questPanelView: one list, dailies first, each row with its chips (game-ui S6)', () => {
	const en = createTranslator('en');

	it('chips the kind, each skill, the XP when priced and the due label, in that order', () => {
		const prices = new Map([['t1', { xp: 25, skills: [{ id: 'lector', name: 'Reader' }, { id: 'cuidador', name: 'Caregiver' }] }]]);
		const view = questPanelView(questListView([aQuest('t1', { type: 'todo', dueDate: '2026-10-28' }), aQuest('d1')], TODAY, en, prices), en);

		expect(view.rows).toEqual([
			{ id: 'd1', title: 'Quest d1', completed: false, chips: [{ kind: 'type', label: 'Daily' }] },
			{
				id: 't1',
				title: 'Quest t1',
				completed: false,
				chips: [
					{ kind: 'type', label: 'To-do' },
					{ kind: 'skill', label: 'Reader' },
					{ kind: 'skill', label: 'Caregiver' },
					{ kind: 'xp', label: '+25 XP' },
					{ kind: 'due', label: 'Overdue', tone: 'overdue' },
				],
			},
		]);
	});

	it('names the kinds in Spanish', () => {
		const view = questPanelView(questListView([aQuest('d1', { completed: true }), aQuest('t1', { type: 'todo', dueDate: TODAY })], TODAY, t), t);

		expect(view.rows.map((row) => [row.completed, row.chips])).toEqual([
			[true, [{ kind: 'type', label: 'Diaria' }]],
			[false, [{ kind: 'type', label: 'Tarea' }, { kind: 'due', label: 'Hoy', tone: 'today' }]],
		]);
	});

	it('keeps the empty state of a sync that returned nothing', () => {
		expect(questPanelView(questListView([], TODAY, en), en)).toEqual({ doneText: null, gainText: null, dayComplete: false, rows: [], emptyText: 'No quests for today' });
	});
});

describe('questListView: missions (missions S1)', () => {
	it('gives a quest with 3 or more subtasks its mission progress, and none to the others', () => {
		const view = questListView(
			[aQuest('d1', { checklist: { done: 1, total: 3 } }), aQuest('t1', { type: 'todo', checklist: { done: 0, total: 2 } }), aQuest('t2', { type: 'todo' })],
			TODAY,
			t,
		);

		expect(view.dailies[0]?.mission).toEqual({ done: 1, total: 3 });
		expect(view.todos.map((row) => row.mission)).toEqual([undefined, undefined]);
	});

	it('chips a mission right after its kind, with its subtasks done out of the total', () => {
		const panel = questPanelView(questListView([aQuest('t1', { type: 'todo', checklist: { done: 2, total: 5 } }), aQuest('t2', { type: 'todo', checklist: { done: 1, total: 2 } })], TODAY, t), t);

		expect(panel.rows[0]?.chips.slice(0, 2)).toEqual([
			{ kind: 'type', label: 'Tarea' },
			{ kind: 'mission', label: 'Misión · 2/5' },
		]);
		expect(panel.rows[1]?.chips.some((chip) => chip.kind === 'mission')).toBe(false);
	});
});

describe('questPanelView: "View more" (missions S3)', () => {
	const many = Array.from({ length: 8 }, (_, index) => aQuest(`t${index}`, { type: 'todo' }));

	it('folds a list of more than 6 quests to 6, and shows them all once expanded', () => {
		const folded = questPanelView(questListView(many, TODAY, t), t);
		const expanded = questPanelView(questListView(many, TODAY, t), t, { expanded: true });

		expect(folded.rows).toHaveLength(6);
		expect(folded.more).toEqual({ label: 'Ver más (2)', expanded: false });
		expect(expanded.rows).toHaveLength(8);
		expect(expanded.more).toEqual({ label: 'Ver menos', expanded: true });
	});

	it('gives a list of 6 or fewer no toggle', () => {
		expect(questPanelView(questListView(many.slice(0, 6), TODAY, t), t)).not.toHaveProperty('more');
	});
});

describe('questPanelView: open a mission (missions S5)', () => {
	const items = [
		{ title: 'Uno', completed: true },
		{ title: 'Dos', completed: false },
		{ title: 'Tres', completed: false },
	];
	const list = questListView([aQuest('m1', { title: 'Viaje', type: 'todo', checklist: { done: 1, total: 3, items } }), aQuest('t1', { type: 'todo' })], TODAY, t);

	it('gives a mission its folded toggle, and a plain quest none', () => {
		const panel = questPanelView(list, t);

		expect(panel.rows[0]?.subtasks).toEqual({ open: false, toggleLabel: 'Ver las subtareas de Viaje', items: [] });
		expect(panel.rows[1]).not.toHaveProperty('subtasks');
	});

	it('lists the subtasks of the missions the reader opened', () => {
		expect(questPanelView(list, t, { openMissions: new Set(['m1']) }).rows[0]?.subtasks).toEqual({ open: true, toggleLabel: 'Ocultar las subtareas de Viaje', items });
	});
});
