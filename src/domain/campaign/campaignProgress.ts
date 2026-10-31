import type { Campaign, Priority, Progress } from './Campaign';

function progress(done: number, total: number, emptyRatio = 0): Progress {
	return { done, total, ratio: total === 0 ? emptyRatio : done / total };
}

/**
 * Progress of one phase of a project: its completed tasks over its tasks. Tasks
 * without a `habiticaId` are pending. An empty phase counts as full only when
 * its own status is `completed`.
 */
export function phaseProgress(campaign: Campaign, phaseId: string): Progress {
	const tasks = campaign.tasks.filter((task) => task.phase === phaseId);
	const done = tasks.filter((task) => task.completed).length;
	const phase = campaign.phases.find((candidate) => candidate.id === phaseId);

	return progress(done, tasks.length, phase?.status === 'completed' ? 1 : 0);
}

/**
 * Total progress. Research: completed phases over phases. Project: completed
 * tasks over all tasks, tasks without a phase included.
 */
export function campaignProgress(campaign: Campaign): Progress {
	if (campaign.kind === 'research') {
		const done = campaign.phases.filter((phase) => phase.status === 'completed').length;
		return progress(done, campaign.phases.length);
	}

	return progress(campaign.tasks.filter((task) => task.completed).length, campaign.tasks.length);
}

const PRIORITY_RANK: Readonly<Record<Priority, number>> = { high: 0, medium: 1, low: 2 };

/** Sort comparator: `high` first. */
export function comparePriority(left: Priority, right: Priority): number {
	return PRIORITY_RANK[left] - PRIORITY_RANK[right];
}
