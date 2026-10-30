import { describe, expect, it } from 'vitest';
import { questListView } from '../../src/ui/presenters/questListView';
import { aQuest } from '../fakes/quests';

const TODAY = '2026-10-30';

describe('questListView', () => {
	it('explains that quests appear after syncing when nothing was fetched yet', () => {
		expect(questListView(null, TODAY)).toEqual({
			dailies: [],
			todos: [],
			emptyText: 'Las quests aparecerán después de sincronizar con Habitica.',
		});
	});

	it('says "No hay quests para hoy" when a sync returned nothing', () => {
		expect(questListView([], TODAY).emptyText).toBe('No hay quests para hoy');
	});

	it('has no empty text when there are quests', () => {
		expect(questListView([aQuest('d1')], TODAY).emptyText).toBeNull();
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
		);

		expect(view.dailies.map((row) => row.id)).toEqual(['d1', 'd2']);
		expect(view.todos.map((row) => row.id)).toEqual(['t1', 't2']);
	});

	it('keeps completed dailies, flagged so they can be struck through', () => {
		const view = questListView([aQuest('d1', { title: 'Rutina', completed: true }), aQuest('d2')], TODAY);

		expect(view.dailies).toEqual([
			{ id: 'd1', title: 'Rutina', completed: true, due: null },
			{ id: 'd2', title: 'Quest d2', completed: false, due: null },
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
		);

		expect(view.todos.map((row) => [row.id, row.due])).toEqual([
			['late', { tone: 'overdue', label: 'Vencida' }],
			['today', { tone: 'today', label: 'Hoy' }],
			['undated', null],
		]);
	});

	it('labels against the given day, so a list synced yesterday shows yesterday’s to-dos as overdue', () => {
		const view = questListView([aQuest('t1', { type: 'todo', dueDate: '2026-10-29', dueToday: true })], TODAY);

		expect(view.todos[0]?.due).toEqual({ tone: 'overdue', label: 'Vencida' });
	});

	it('gives no label to a future-dated to-do', () => {
		const view = questListView([aQuest('t1', { type: 'todo', dueDate: '2026-11-02', dueToday: false })], TODAY);

		expect(view.todos[0]?.due).toBeNull();
	});
});
