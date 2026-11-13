import type { Area, Campaign, CampaignHabit } from '../domain';
import type { TaskStatus } from '../ports';

/**
 * A linked task or habit whose Habitica task is gone; shown as a warning, never as a failure (S4).
 * `habitica-task-deleted` when Habitica confirmed it no longer has it, so it can be sent again
 * (ADR-021); `habitica-task-missing` when its id is not a Habitica id at all.
 */
export interface CampaignIssue {
	/** The note it is declared in: a campaign, or an area for an area habit (ADR-017). */
	readonly campaignPath: string;
	readonly taskTitle: string;
	readonly kind: 'habitica-task-missing' | 'habitica-task-deleted';
}

export interface MergedCampaigns {
	readonly campaigns: Campaign[];
	readonly issues: CampaignIssue[];
}

export interface MergedAreas {
	readonly areas: Area[];
	readonly issues: CampaignIssue[];
}

/**
 * Applies Habitica's answer to the tasks and habits of projects that carry a `habiticaId`.
 * A deleted or missing task stays pending and raises an issue, and a deleted or missing habit loses
 * its streak and raises one too; an id with no answer is left as it was. Research sessions and unsent tasks are never touched. Pure.
 */
export function mergeTaskStatuses(campaigns: readonly Campaign[], statuses: ReadonlyMap<string, TaskStatus>): MergedCampaigns {
	const issues: CampaignIssue[] = [];
	const merged = campaigns.map((campaign): Campaign => {
		if (campaign.kind !== 'project') return campaign;
		const habits = mergeHabits(campaign.path, campaign.habits, statuses, issues);
		const tasks = campaign.tasks.map((task) => {
			const status = task.habiticaId === null ? undefined : statuses.get(task.habiticaId);
			if (!status) return task;
			// Its subtasks only change how the task is shown (missions S2), never whether it is done.
			const subtasks = (status.kind === 'open' || status.kind === 'completed') && status.checklist ? { checklist: status.checklist } : {};
			if (status.kind === 'completed') return { ...task, completed: true, completedOn: status.completedOn, ...subtasks };
			const gone = issueKindOf(status);
			if (gone) issues.push({ campaignPath: campaign.path, taskTitle: task.title, kind: gone });
			return { ...task, completed: false, completedOn: null, ...subtasks };
		});
		return { ...campaign, tasks, habits };
	});
	return { campaigns: merged, issues };
}

/** The same answer applied to the habits of areas (ADR-017), exactly as to a campaign's. Pure. */
export function mergeAreaStatuses(areas: readonly Area[], statuses: ReadonlyMap<string, TaskStatus>): MergedAreas {
	const issues: CampaignIssue[] = [];
	const merged = areas.map((area): Area => ({ ...area, habits: mergeHabits(area.path, area.habits, statuses, issues) }));
	return { areas: merged, issues };
}

/** The streak of each habit's daily; a daily that is gone, deleted or missing, clears it and raises an issue on `path`. */
function mergeHabits(path: string, habits: readonly CampaignHabit[], statuses: ReadonlyMap<string, TaskStatus>, issues: CampaignIssue[]): CampaignHabit[] {
	return habits.map((habit) => {
		const status = habit.habiticaId === null ? undefined : statuses.get(habit.habiticaId);
		if (status?.kind === 'daily') return { ...habit, streak: status.streak };
		const gone = status ? issueKindOf(status) : null;
		if (gone) {
			issues.push({ campaignPath: path, taskTitle: habit.title, kind: gone });
			return { ...habit, streak: null };
		}
		return habit;
	});
}

/** The issue a status raises: Habitica confirmed it deleted, or its id is no Habitica id; `null` for a task Habitica has. */
function issueKindOf(status: TaskStatus): CampaignIssue['kind'] | null {
	if (status.kind === 'deleted') return 'habitica-task-deleted';
	if (status.kind === 'missing') return 'habitica-task-missing';
	return null;
}
