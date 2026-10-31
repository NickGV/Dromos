import type { Campaign, CampaignTask, Phase } from './Campaign';

export type NextAction =
	| { readonly kind: 'task'; readonly task: CampaignTask }
	| { readonly kind: 'phase'; readonly phase: Phase };

/**
 * What to do next. Project: the first pending task of the first phase that is
 * not completed. Research: the first phase that is not completed. `null` when
 * there is nothing left to point at.
 */
export function nextAction(campaign: Campaign): NextAction | null {
	const phase = campaign.phases.find((candidate) => candidate.status !== 'completed');
	if (!phase) return null;
	if (campaign.kind === 'research') return { kind: 'phase', phase };

	const task = campaign.tasks.find((candidate) => candidate.phase === phase.id && !candidate.completed);
	return task ? { kind: 'task', task } : null;
}
