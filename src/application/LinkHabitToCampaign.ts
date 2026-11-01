import type { CampaignRepository, TagCatalog, TaskCreator } from '../ports';
import { sendAndLink, type LinkOutcome } from './sendAndLink';

export interface LinkHabitToCampaignDeps {
	readonly repository: CampaignRepository;
	readonly creator: TaskCreator;
	/** A link that opens the campaign note, put in the daily's notes. Built by the composition root. */
	readonly noteLink: (campaignPath: string) => string;
	/** Where the `skill/<id>` tags of the daily are found or created. */
	readonly tags: TagCatalog;
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
		const { repository, creator, noteLink, tags } = this.deps;
		const campaign = (await repository.listActive()).find((candidate) => candidate.path === campaignPath);
		if (!campaign) return { kind: 'not-found' };
		if (campaign.kind !== 'project') return { kind: 'not-a-project' };

		const habits = campaign.habits.filter((habit) => habit.title === habitTitle);
		if (habits.length === 0) return { kind: 'not-found' };
		// The habit `linkHabitHabiticaId` will link: the first one with that title and no id yet.
		const target = habits.find((habit) => habit.habiticaId === null);
		if (!target) return { kind: 'already-linked' };
		const skills = target.skills.length > 0 ? target.skills : campaign.skills;

		return sendAndLink(
			async () => {
				// Tags first: if they fail nothing is created, so a retry cannot leave a duplicate daily.
				const tagIds = skills.length > 0 ? await tags.ensureSkillTags(skills) : [];
				return creator.createDaily({
					title: habitTitle,
					notes: `Dromos · ${campaign.title}\n${noteLink(campaignPath)}`,
					...(tagIds.length > 0 ? { tags: tagIds } : {}),
				});
			},
			(habiticaId) => repository.linkHabitHabiticaId(campaignPath, habitTitle, habiticaId),
		);
	}
}
