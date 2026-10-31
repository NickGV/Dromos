import { describe, expect, it } from 'vitest';
import { mergeTaskStatuses } from '../../src/application/mergeTaskStatuses';
import type { TaskStatus } from '../../src/ports/TaskStatusSource';
import { campaign, phase, task } from '../domain/campaign/campaignFixtures';

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
