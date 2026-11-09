import type { CampaignRepository } from '../ports';
import type { LinkOutcome } from './sendAndLink';
import { sendHabit, type SendHabitDeps } from './sendHabit';

export interface LinkHabitToCampaignDeps extends SendHabitDeps {
	readonly repository: CampaignRepository;
}

/**
 * "Enviar a Habitica" for a habit (S8): creates the daily a campaign asks to build, tagged
 * with the skills of the habit (or the campaign's), and writes its id back into the note.
 * Idempotent: a habit that already has an id is never created again. Never rejects.
 */
export class LinkHabitToCampaign {
	private readonly inFlight = new Map<string, Promise<LinkOutcome>>();

	constructor(private readonly deps: LinkHabitToCampaignDeps) {}

	/** Runs one link per habit; a second call for the same habit joins the one already running. */
	execute(campaignPath: string, habitTitle: string): Promise<LinkOutcome> {
		const key = `${campaignPath}\u0000${habitTitle}`;
		const running = this.inFlight.get(key);
		if (running) return running;

		const started = this.run(campaignPath, habitTitle).finally(() => this.inFlight.delete(key));
		this.inFlight.set(key, started);
		return started;
	}

	private async run(campaignPath: string, habitTitle: string): Promise<LinkOutcome> {
		const { repository } = this.deps;
		const campaign = (await repository.listActive()).find((candidate) => candidate.path === campaignPath);
		if (!campaign) return { kind: 'not-found' };
		if (campaign.kind !== 'project') return { kind: 'not-a-project' };

		return sendHabit(this.deps, campaign, habitTitle, (habiticaId) => repository.linkHabitHabiticaId(campaignPath, habitTitle, habiticaId));
	}
}
