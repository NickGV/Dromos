import type { Campaign } from '../domain';
import type { TaskStatus } from '../ports';

/** A project task whose Habitica task is gone; shown as a warning, never as a failure (S4). */
export interface CampaignIssue {
	readonly campaignPath: string;
	readonly taskTitle: string;
	readonly kind: 'habitica-task-missing';
}

export interface MergedCampaigns {
	readonly campaigns: Campaign[];
	readonly issues: CampaignIssue[];
}

/**
 * Applies Habitica's answer to the tasks of projects that carry a `habiticaId`.
 * A missing task stays pending and raises an issue; an id with no answer is left
 * as it was. Research sessions and unsent tasks are never touched. Pure.
 */
export function mergeTaskStatuses(campaigns: readonly Campaign[], statuses: ReadonlyMap<string, TaskStatus>): MergedCampaigns {
	const issues: CampaignIssue[] = [];
	const merged = campaigns.map((campaign): Campaign => {
		if (campaign.kind !== 'project') return campaign;
		const tasks = campaign.tasks.map((task) => {
			const status = task.habiticaId === null ? undefined : statuses.get(task.habiticaId);
			if (!status) return task;
			if (status.kind === 'completed') return { ...task, completed: true, completedOn: status.completedOn };
			if (status.kind === 'missing') issues.push({ campaignPath: campaign.path, taskTitle: task.title, kind: 'habitica-task-missing' });
			return { ...task, completed: false, completedOn: null };
		});
		return { ...campaign, tasks };
	});
	return { campaigns: merged, issues };
}
