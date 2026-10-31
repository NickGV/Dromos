import type { Campaign, CampaignTask, Phase } from '../../../src/domain/campaign/Campaign';

export function phase(id: string, status: Phase['status'] = 'planning'): Phase {
	return { id, name: `Phase ${id}`, status };
}

export function task(title: string, phaseId: string | null, overrides: Partial<CampaignTask> = {}): CampaignTask {
	return {
		title,
		phase: phaseId,
		habiticaId: null,
		skill: null,
		resources: [],
		completed: false,
		completedOn: null,
		...overrides,
	};
}

export function campaign(overrides: Partial<Campaign> = {}): Campaign {
	return {
		kind: 'project',
		path: '02 - Projects/Kairos/README.md',
		title: 'Kairos',
		status: 'active',
		priority: 'medium',
		area: null,
		skill: null,
		deadline: null,
		staleAfterDays: null,
		created: '2026-08-01',
		phases: [],
		tasks: [],
		...overrides,
	};
}
