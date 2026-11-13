import type { CampaignRepository } from '../ports';
import type { LinkOutcome } from './sendAndLink';
import { resendHabit, sendHabit, type SendHabitDeps } from './sendHabit';

export interface LinkHabitToCampaignDeps extends SendHabitDeps {
	readonly repository: CampaignRepository;
}

/**
 * "Enviar a Habitica" for a habit (S8): creates the daily a campaign asks to build, tagged
 * with the skills of the habit (or the campaign's), and writes its id back into the note.
 * Idempotent: a habit that already has an id is never created again, but by `resend`, and only
 * once Habitica confirmed it deleted (ADR-021). Never rejects.
 */
export class LinkHabitToCampaign {
	private readonly inFlight = new Map<string, Promise<LinkOutcome>>();

	constructor(private readonly deps: LinkHabitToCampaignDeps) {}

	/** Runs one link per habit; a second call for the same habit joins the one already running. */
	execute(campaignPath: string, habitTitle: string): Promise<LinkOutcome> {
		return this.once(`send\u0000${campaignPath}\u0000${habitTitle}`, () => this.run(campaignPath, habitTitle, false));
	}

	/**
	 * "Enviar de nuevo" (ADR-021): creates again the daily Habitica confirmed deleted and replaces its
	 * id in the note, only while the note still holds that id. A second call joins the one running.
	 */
	resend(campaignPath: string, habitTitle: string): Promise<LinkOutcome> {
		return this.once(`resend\u0000${campaignPath}\u0000${habitTitle}`, () => this.run(campaignPath, habitTitle, true));
	}

	private once(key: string, start: () => Promise<LinkOutcome>): Promise<LinkOutcome> {
		const running = this.inFlight.get(key);
		if (running) return running;

		const started = start().finally(() => this.inFlight.delete(key));
		this.inFlight.set(key, started);
		return started;
	}

	private async run(campaignPath: string, habitTitle: string, again: boolean): Promise<LinkOutcome> {
		const { repository } = this.deps;
		const campaign = (await repository.listActive()).find((candidate) => candidate.path === campaignPath);
		if (!campaign) return { kind: 'not-found' };
		if (campaign.kind !== 'project') return { kind: 'not-a-project' };

		if (again) return resendHabit(this.deps, campaign, habitTitle, (oldId, newId) => repository.relinkHabitHabiticaId(campaignPath, habitTitle, oldId, newId));
		return sendHabit(this.deps, campaign, habitTitle, (habiticaId) => repository.linkHabitHabiticaId(campaignPath, habitTitle, habiticaId));
	}
}
