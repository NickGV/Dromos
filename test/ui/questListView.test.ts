import { describe, expect, it } from 'vitest';
import { createTranslator } from '../../src/i18n';
import { questListView } from '../../src/ui/presenters/questListView';
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
