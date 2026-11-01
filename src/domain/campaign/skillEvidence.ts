import type { Campaign, CampaignTask } from './Campaign';

/** Completed campaigns that count toward the unlock of a skill: those whose skills include it. */
export function completedCampaignCount(campaigns: readonly Campaign[], skillId: string): number {
	return campaigns.filter((campaign) => campaign.status === 'completed' && campaign.skills.includes(skillId)).length;
}

/** The skills a task trains: its own, or those of its campaign when it declares none. */
export function effectiveSkills(campaign: Campaign, task: CampaignTask): readonly string[] {
	return task.skills.length > 0 ? task.skills : campaign.skills;
}
