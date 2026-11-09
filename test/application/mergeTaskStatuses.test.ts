import { describe, expect, it } from 'vitest';
import { mergeAreaStatuses, mergeTaskStatuses } from '../../src/application/mergeTaskStatuses';
import type { TaskStatus } from '../../src/ports/TaskStatusSource';
import { area, campaign, habit, phase, task } from '../domain/campaign/campaignFixtures';

const statuses = (entries: Record<string, TaskStatus>): Map<string, TaskStatus> => new Map(Object.entries(entries));

describe('mergeTaskStatuses', () => {
	it('marks project tasks completed or open from their Habitica status', () => {
		const kairos = campaign({
			phases: [phase('mvp', 'active')],
			tasks: [task('done', 'mvp', { habiticaId: 'h1' }), task('open', 'mvp', { habiticaId: 'h2', completed: true, completedOn: '2026-01-01' })],
		});

		const merged = mergeTaskStatuses([kairos], statuses({ h1: { kind: 'completed', completedOn: '2026-10-20' }, h2: { kind: 'open' } }));

		expect(merged.campaigns[0]?.tasks).toMatchObject([
			{ title: 'done', completed: true, completedOn: '2026-10-20' },
			{ title: 'open', completed: false, completedOn: null },
		]);
		expect(merged.issues).toEqual([]);
	});

	it('flags a task whose Habitica task is missing and keeps it pending', () => {
		const kairos = campaign({ path: 'P/Kairos/README.md', tasks: [task('gone', null, { habiticaId: 'h1' })] });

		const merged = mergeTaskStatuses([kairos], statuses({ h1: { kind: 'missing' } }));

		expect(merged.campaigns[0]?.tasks[0]?.completed).toBe(false);
		expect(merged.issues).toEqual([{ campaignPath: 'P/Kairos/README.md', taskTitle: 'gone', kind: 'habitica-task-missing' }]);
	});

	it('leaves a task as it was when its id has no answer', () => {
		const kairos = campaign({ tasks: [task('a', null, { habiticaId: 'h1', completed: true, completedOn: '2026-10-01' })] });

		const merged = mergeTaskStatuses([kairos], statuses({}));

		expect(merged.campaigns[0]?.tasks[0]).toMatchObject({ completed: true, completedOn: '2026-10-01' });
	});

	it('leaves tasks without a habiticaId and research sessions untouched', () => {
		const unsent = campaign({ tasks: [task('unsent', null)] });
		const research = campaign({
			kind: 'research',
			tasks: [task('session', 's1', { habiticaId: 'h9', completed: true, completedOn: '2026-09-14' })],
		});

		const merged = mergeTaskStatuses([unsent, research], statuses({ h9: { kind: 'open' } }));

		expect(merged.campaigns[0]?.tasks[0]?.completed).toBe(false);
		expect(merged.campaigns[1]?.tasks[0]).toMatchObject({ completed: true, completedOn: '2026-09-14' });
	});

	it('does not mutate its input', () => {
		const kairos = campaign({ tasks: [task('a', null, { habiticaId: 'h1' })] });

		mergeTaskStatuses([kairos], statuses({ h1: { kind: 'completed', completedOn: '2026-10-20' } }));

		expect(kairos.tasks[0]?.completed).toBe(false);
	});
});

describe('mergeTaskStatuses: habits (S8)', () => {
	it('puts the streak of the daily on the habit', () => {
		const salto = campaign({ habits: [habit('Stretch', { habiticaId: 'd1' }), habit('Sleep', { habiticaId: 'd2', streak: 9 })] });

		const merged = mergeTaskStatuses([salto], statuses({ d1: { kind: 'daily', streak: 12 }, d2: { kind: 'daily', streak: 0 } }));

		expect(merged.campaigns[0]?.habits.map((item) => item.streak)).toEqual([12, 0]);
		expect(merged.issues).toEqual([]);
	});

	it('flags a habit whose daily is gone and clears its streak', () => {
		const salto = campaign({ path: 'P/Salto/README.md', habits: [habit('Stretch', { habiticaId: 'd1', streak: 5 })] });

		const merged = mergeTaskStatuses([salto], statuses({ d1: { kind: 'missing' } }));

		expect(merged.campaigns[0]?.habits[0]?.streak).toBeNull();
		expect(merged.issues).toEqual([{ campaignPath: 'P/Salto/README.md', taskTitle: 'Stretch', kind: 'habitica-task-missing' }]);
	});

	it('leaves a habit as it was when its id has no answer, and an unsent habit untouched', () => {
		const salto = campaign({ habits: [habit('Stretch', { habiticaId: 'd1', streak: 5 }), habit('Unsent')] });

		const merged = mergeTaskStatuses([salto], statuses({}));

		expect(merged.campaigns[0]?.habits.map((item) => item.streak)).toEqual([5, null]);
	});

	it('ignores an answer that is not a daily', () => {
		const salto = campaign({ habits: [habit('Stretch', { habiticaId: 'd1', streak: 5 })] });

		expect(mergeTaskStatuses([salto], statuses({ d1: { kind: 'open' } })).campaigns[0]?.habits[0]?.streak).toBe(5);
	});
});

describe('mergeTaskStatuses: subtasks (missions S2)', () => {
	it('puts the subtasks Habitica answered on the task, open or completed, and leaves the others without', () => {
		const kairos = campaign({
			phases: [phase('mvp', 'active')],
			tasks: [task('plan', 'mvp', { habiticaId: 'h1' }), task('ship', 'mvp', { habiticaId: 'h2' }), task('plain', 'mvp', { habiticaId: 'h3' })],
		});

		const [merged] = mergeTaskStatuses(
			[kairos],
			statuses({ h1: { kind: 'open', checklist: { done: 2, total: 5 } }, h2: { kind: 'completed', completedOn: '2026-11-01', checklist: { done: 3, total: 3 } }, h3: { kind: 'open' } }),
		).campaigns;

		expect(merged?.tasks[0]).toMatchObject({ completed: false, checklist: { done: 2, total: 5 } });
		expect(merged?.tasks[1]).toMatchObject({ completed: true, completedOn: '2026-11-01', checklist: { done: 3, total: 3 } });
		expect(merged?.tasks[2]).not.toHaveProperty('checklist');
	});
});

describe('mergeAreaStatuses: the habits of an area (ADR-017)', () => {
	const PATH = '03 - Areas/Bibliotheke/Archeion - Bibliotheke.md';

	it('puts the streak of the daily on the habit, like a campaign habit', () => {
		const bibliotheke = area({ path: PATH, habits: [habit('Leer', { habiticaId: 'd1' }), habit('Unsent'), habit('Unknown', { habiticaId: 'd9', streak: 4 })] });

		const merged = mergeAreaStatuses([bibliotheke], statuses({ d1: { kind: 'daily', streak: 6 } }));

		expect(merged.areas[0]?.habits.map((item) => item.streak)).toEqual([6, null, 4]);
		expect(merged.areas[0]).toMatchObject({ path: PATH, title: 'Archeion - Bibliotheke', skills: ['lector'] });
		expect(merged.issues).toEqual([]);
	});

	it('flags a habit whose daily is gone with the area path, and clears its streak', () => {
		const bibliotheke = area({ path: PATH, habits: [habit('Leer', { habiticaId: 'd1', streak: 5 })] });

		const merged = mergeAreaStatuses([bibliotheke], statuses({ d1: { kind: 'missing' } }));

		expect(merged.areas[0]?.habits[0]?.streak).toBeNull();
		expect(merged.issues).toEqual([{ campaignPath: PATH, taskTitle: 'Leer', kind: 'habitica-task-missing' }]);
	});
});
