import { describe, expect, it } from 'vitest';
import { nextAction } from '../../../src/domain/campaign/nextAction';
import { campaign, phase, task } from './campaignFixtures';

describe('nextAction: projects', () => {
	it('is the first pending task of the first phase that is not completed', () => {
		const kairos = campaign({
			phases: [phase('design', 'completed'), phase('mvp', 'active'), phase('launch', 'planning')],
			tasks: [
				task('design done', 'design', { completed: true }),
				task('mvp done', 'mvp', { completed: true }),
				task('mvp next', 'mvp'),
				task('mvp later', 'mvp'),
				task('launch first', 'launch'),
			],
		});

		expect(nextAction(kairos)).toEqual({ kind: 'task', task: kairos.tasks[2] });
	});

	it('moves to the second phase when the first one is completed', () => {
		const kairos = campaign({
			phases: [phase('design', 'completed'), phase('mvp', 'active')],
			tasks: [task('design leftover', 'design'), task('mvp first', 'mvp')],
		});

		expect(nextAction(kairos)).toEqual({ kind: 'task', task: kairos.tasks[1] });
	});

	it('is none when every phase is completed', () => {
		const kairos = campaign({
			phases: [phase('design', 'completed'), phase('mvp', 'completed')],
			tasks: [task('a', 'design', { completed: true }), task('b', 'mvp', { completed: true })],
		});

		expect(nextAction(kairos)).toBeNull();
	});

	it('is none when the current phase has no pending task, and without phases', () => {
		const stuck = campaign({ phases: [phase('mvp', 'active')], tasks: [task('a', 'mvp', { completed: true })] });

		expect(nextAction(stuck)).toBeNull();
		expect(nextAction(campaign())).toBeNull();
	});

	it('ignores tasks without a phase', () => {
		const kairos = campaign({ phases: [phase('mvp', 'active')], tasks: [task('loose', null)] });

		expect(nextAction(kairos)).toBeNull();
	});
});

describe('nextAction: research', () => {
	it('is the first phase that is not completed', () => {
		const research = campaign({
			kind: 'research',
			phases: [phase('read', 'completed'), phase('write', 'active'), phase('review', 'planning')],
		});

		expect(nextAction(research)).toEqual({ kind: 'phase', phase: research.phases[1] });
	});

	it('is none when every phase is completed', () => {
		const research = campaign({ kind: 'research', phases: [phase('read', 'completed')] });

		expect(nextAction(research)).toBeNull();
	});
});
