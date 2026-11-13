import type { Campaign } from '../../src/domain';
import type { CampaignRepository, LinkResult, RelinkResult } from '../../src/ports';

/** Campaign repository backed by a list, for use-case and container tests. */
export class InMemoryCampaignRepository implements CampaignRepository {
	constructor(
		private campaigns: readonly Campaign[] = [],
		private completed: readonly Campaign[] = [],
	) {}

	listActive(): Promise<readonly Campaign[]> {
		return Promise.resolve(this.campaigns);
	}

	/** Same check-and-set as the vault, on `habits`. */
	linkHabitHabiticaId(campaignPath: string, habitTitle: string, habiticaId: string): Promise<LinkResult> {
		const campaign = this.campaigns.find((candidate) => candidate.path === campaignPath);
		if (campaign?.kind !== 'project') return Promise.resolve('not-found');
		const index = campaign.habits.findIndex((habit) => habit.title === habitTitle && habit.habiticaId === null);
		if (index === -1) return Promise.resolve(campaign.habits.some((habit) => habit.title === habitTitle) ? 'already-linked' : 'not-found');
		const habits = campaign.habits.map((habit, position) => (position === index ? { ...habit, habiticaId } : habit));
		this.campaigns = this.campaigns.map((candidate) => (candidate === campaign ? { ...campaign, habits } : candidate));
		return Promise.resolve('linked');
	}

	/** Same compare-and-swap as the vault: the first habit with that title whose id is still `oldId` gets `newId`. */
	relinkHabitHabiticaId(campaignPath: string, habitTitle: string, oldId: string, newId: string): Promise<RelinkResult> {
		const campaign = this.campaigns.find((candidate) => candidate.path === campaignPath);
		if (campaign?.kind !== 'project') return Promise.resolve('changed');
		const index = campaign.habits.findIndex((habit) => habit.title === habitTitle && habit.habiticaId === oldId);
		if (index === -1) return Promise.resolve('changed');
		const habits = campaign.habits.map((habit, position) => (position === index ? { ...habit, habiticaId: newId } : habit));
		this.campaigns = this.campaigns.map((candidate) => (candidate === campaign ? { ...campaign, habits } : candidate));
		return Promise.resolve('relinked');
	}

	/** Same compare-and-swap as the vault, on `tasks`. */
	relinkHabiticaId(campaignPath: string, taskTitle: string, oldId: string, newId: string): Promise<RelinkResult> {
		const campaign = this.campaigns.find((candidate) => candidate.path === campaignPath);
		if (campaign?.kind !== 'project') return Promise.resolve('changed');
		const index = campaign.tasks.findIndex((task) => task.title === taskTitle && task.habiticaId === oldId);
		if (index === -1) return Promise.resolve('changed');
		const tasks = campaign.tasks.map((task, position) => (position === index ? { ...task, habiticaId: newId } : task));
		this.campaigns = this.campaigns.map((candidate) => (candidate === campaign ? { ...campaign, tasks } : candidate));
		return Promise.resolve('relinked');
	}

	listCompleted(): Promise<readonly Campaign[]> {
		return Promise.resolve(this.completed);
	}

	/** Same check-and-set as the vault: the first task with that title and no id gets it. */
	linkHabiticaId(campaignPath: string, taskTitle: string, habiticaId: string): Promise<LinkResult> {
		const campaign = this.campaigns.find((candidate) => candidate.path === campaignPath);
		if (campaign?.kind !== 'project') return Promise.resolve('not-found');
		const index = campaign.tasks.findIndex((task) => task.title === taskTitle && task.habiticaId === null);
		if (index === -1) return Promise.resolve(campaign.tasks.some((task) => task.title === taskTitle) ? 'already-linked' : 'not-found');
		const tasks = campaign.tasks.map((task, position) => (position === index ? { ...task, habiticaId } : task));
		this.campaigns = this.campaigns.map((candidate) => (candidate === campaign ? { ...campaign, tasks } : candidate));
		return Promise.resolve('linked');
	}
}
