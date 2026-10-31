import { describe, expect, it } from 'vitest';
import { campaignProgress, comparePriority, phaseProgress } from '../../../src/domain/campaign/campaignProgress';
import { campaign, phase, task } from './campaignFixtures';

describe('phaseProgress: projects', () => {
	it('counts completed tasks of the phase over the tasks of the phase', () => {
		const kairos = campaign({
			phases: [phase('mvp', 'active')],
			tasks: [task('a', 'mvp', { completed: true }), task('b', 'mvp'), task('c', 'mvp', { completed: true }), task('d', 'mvp')],
		});

		expect(phaseProgress(kairos, 'mvp')).toEqual({ done: 2, total: 4, ratio: 0.5 });
	});

	it('counts tasks without habiticaId as pending', () => {
		const kairos = campaign({
			phases: [phase('mvp', 'active')],
			tasks: [task('sent', 'mvp', { habiticaId: 'h1', completed: true }), task('not sent', 'mvp', { habiticaId: null })],
		});

		expect(phaseProgress(kairos, 'mvp')).toEqual({ done: 1, total: 2, ratio: 0.5 });
	});

	it('ignores tasks of other phases and tasks without a phase', () => {
		const kairos = campaign({
			phases: [phase('design', 'completed'), phase('mvp', 'active')],
			tasks: [task('a', 'design', { completed: true }), task('b', 'mvp'), task('loose', null, { completed: true })],
		});

		expect(phaseProgress(kairos, 'mvp')).toEqual({ done: 0, total: 1, ratio: 0 });
	});

	it('gives an empty phase ratio 0, or 1 when the phase is completed', () => {
		const kairos = campaign({ phases: [phase('design', 'completed'), phase('mvp', 'active')] });

		expect(phaseProgress(kairos, 'design')).toEqual({ done: 0, total: 0, ratio: 1 });
		expect(phaseProgress(kairos, 'mvp')).toEqual({ done: 0, total: 0, ratio: 0 });
	});

	it('gives an unknown phase id ratio 0 and never NaN', () => {
		expect(phaseProgress(campaign(), 'nope')).toEqual({ done: 0, total: 0, ratio: 0 });
	});
});

describe('campaignProgress', () => {
	it('projects: completed tasks over all tasks, tasks without a phase included', () => {
		const kairos = campaign({
			phases: [phase('mvp', 'active')],
			tasks: [task('a', 'mvp', { completed: true }), task('loose', null, { completed: true }), task('b', 'mvp'), task('c', 'mvp')],
		});

		expect(campaignProgress(kairos)).toEqual({ done: 2, total: 4, ratio: 0.5 });
	});

	it('projects without tasks have ratio 0 and never NaN', () => {
		expect(campaignProgress(campaign({ phases: [phase('mvp', 'active')] }))).toEqual({ done: 0, total: 0, ratio: 0 });
	});

	it('research: completed phases over phases, mixed statuses', () => {
		const research = campaign({
			kind: 'research',
			phases: [phase('read', 'completed'), phase('write', 'active'), phase('review', 'planning'), phase('ship', 'completed')],
			tasks: [task('session 1', 'read', { completed: true })],
		});

		expect(campaignProgress(research)).toEqual({ done: 2, total: 4, ratio: 0.5 });
	});

	it('research without phases has ratio 0 and never NaN', () => {
		expect(campaignProgress(campaign({ kind: 'research' }))).toEqual({ done: 0, total: 0, ratio: 0 });
	});
});

describe('comparePriority', () => {
	it('sorts high before medium before low', () => {
		const sorted = [campaign({ title: 'l', priority: 'low' }), campaign({ title: 'h', priority: 'high' }), campaign({ title: 'm', priority: 'medium' })]
			.sort((left, right) => comparePriority(left.priority, right.priority))
			.map((item) => item.title);

		expect(sorted).toEqual(['h', 'm', 'l']);
	});
});
