import { effectiveSkills } from '../domain';
import type { CampaignRepository, TagCatalog, TaskCreator } from '../ports';
import { sendAndLink, type LinkOutcome } from './sendAndLink';

export interface LinkTaskToCampaignDeps {
	readonly repository: CampaignRepository;
	readonly creator: TaskCreator;
	/** A link that opens the campaign note, put in the to-do's notes. Built by the composition root. */
	readonly noteLink: (campaignPath: string) => string;
	/** Where the `skill/<id>` tags of the to-do are found or created. */
	readonly tags: TagCatalog;
}

/**
 * "Enviar a Habitica" (S6): creates the to-do of a project task and writes its id back
 * into the note. Idempotent: a task that already has an id is never created again.
 * Never rejects.
 */
export class LinkTaskToCampaign {
	private readonly inFlight = new Map<string, Promise<LinkOutcome>>();

	constructor(private readonly deps: LinkTaskToCampaignDeps) {}

	/** Runs one link per task; a second call for the same task joins the one already running. */
	execute(campaignPath: string, taskTitle: string): Promise<LinkOutcome> {
		const key = `${campaignPath}\u0000${taskTitle}`;
		const running = this.inFlight.get(key);
		if (running) return running;

		const started = this.run(campaignPath, taskTitle).finally(() => this.inFlight.delete(key));
		this.inFlight.set(key, started);
		return started;
	}

	private async run(campaignPath: string, taskTitle: string): Promise<LinkOutcome> {
		const { repository, creator, noteLink, tags } = this.deps;
		const campaign = (await repository.listActive()).find((candidate) => candidate.path === campaignPath);
		if (!campaign) return { kind: 'not-found' };
		if (campaign.kind !== 'project') return { kind: 'not-a-project' };

		const tasks = campaign.tasks.filter((task) => task.title === taskTitle);
		if (tasks.length === 0) return { kind: 'not-found' };
		if (tasks.every((task) => task.habiticaId !== null)) return { kind: 'already-linked' };

		// The task `linkHabiticaId` will link: the first one with that title and no id yet.
		const target = tasks.find((task) => task.habiticaId === null);
		const skills = target ? effectiveSkills(campaign, target) : [];

		return sendAndLink(
			async () => {
				// Tags first: if they fail nothing is created, so a retry cannot leave a duplicate to-do.
				const tagIds = skills.length > 0 ? await tags.ensureSkillTags(skills) : [];
				return creator.createTodo({
					title: taskTitle,
					notes: `Dromos · ${campaign.title}\n${noteLink(campaignPath)}`,
					...(tagIds.length > 0 ? { tags: tagIds } : {}),
				});
			},
			(habiticaId) => repository.linkHabiticaId(campaignPath, taskTitle, habiticaId),
		);
	}
}
