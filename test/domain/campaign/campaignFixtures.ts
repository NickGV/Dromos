import type { Area } from '../../../src/domain/area/Area';
import { WEEKDAYS, type Campaign, type CampaignHabit, type CampaignTask, type Phase } from '../../../src/domain/campaign/Campaign';

export function phase(id: string, status: Phase['status'] = 'planning'): Phase {
	return { id, name: `Phase ${id}`, status };
}

export function task(title: string, phaseId: string | null, overrides: Partial<CampaignTask> = {}): CampaignTask {
	return {
		title,
		phase: phaseId,
		habiticaId: null,
		skills: [],
		resources: [],
		completed: false,
		completedOn: null,
		...overrides,
	};
}

export function habit(title: string, overrides: Partial<CampaignHabit> = {}): CampaignHabit {
	return { title, days: 21, repeat: WEEKDAYS, checklist: [], skills: [], habiticaId: null, streak: null, ...overrides };
}

export function campaign(overrides: Partial<Campaign> = {}): Campaign {
	return {
		kind: 'project',
		path: '02 - Projects/Kairos/README.md',
		title: 'Kairos',
		status: 'active',
		priority: 'medium',
		area: null,
		skills: [],
		deadline: null,
		staleAfterDays: null,
		created: '2026-08-01',
		phases: [],
		tasks: [],
		habits: [],
		...overrides,
	};
}

/** The Library's Archeion (ADR-017): an area with the reading skill and no habits yet. */
export function area(overrides: Partial<Area> = {}): Area {
	return {
		path: '03 - Areas/Bibliotheke/Archeion - Bibliotheke.md',
		title: 'Archeion - Bibliotheke',
		skills: ['lector'],
		habits: [],
		...overrides,
	};
}
