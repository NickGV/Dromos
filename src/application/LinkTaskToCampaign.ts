import { effectiveSkills, type Campaign, type CampaignTask } from '../domain';
import type { CampaignRepository, TagCatalog, TaskCreator } from '../ports';
import { sendAndLink, sendAndRelink, type LinkOutcome } from './sendAndLink';

export interface LinkTaskToCampaignDeps {
	readonly repository: CampaignRepository;
	readonly creator: TaskCreator;
	/** A link that opens the campaign note, put in the to-do's notes. Built by the composition root. */
	readonly noteLink: (campaignPath: string) => string;
	/** Where the `skill/<id>` tags of the to-do are found or created. */
	readonly tags: TagCatalog;
	/**
	 * True when Habitica confirmed in the last sync that it no longer has this id, and the ledger
	 * shows no completion of it (ADR-021): the only id "Enviar de nuevo" may replace.
	 */
	readonly deleted: (habiticaId: string) => boolean;
}

/**
 * "Enviar a Habitica" (S6): creates the to-do of a project task and writes its id back
 * into the note. Idempotent: a task that already has an id is never created again, but by
 * `resend`, and only once Habitica confirmed it deleted (ADR-021). Never rejects.
 */
export class LinkTaskToCampaign {
	private readonly inFlight = new Map<string, Promise<LinkOutcome>>();

	constructor(private readonly deps: LinkTaskToCampaignDeps) {}

	/** Runs one link per task; a second call for the same task joins the one already running. */
	execute(campaignPath: string, taskTitle: string): Promise<LinkOutcome> {
		return this.once(`send\u0000${campaignPath}\u0000${taskTitle}`, () => this.run(campaignPath, taskTitle, false));
	}

	/**
	 * "Enviar de nuevo" (ADR-021): creates again, as a first send does, the to-do Habitica confirmed
	 * deleted, and replaces its id in the note only while the note still holds that id. A task whose
	 * id Habitica did not confirm deleted, or that the note no longer holds, is `changed` and nothing
	 * is created. A second call joins the one running.
	 */
	resend(campaignPath: string, taskTitle: string): Promise<LinkOutcome> {
		return this.once(`resend\u0000${campaignPath}\u0000${taskTitle}`, () => this.run(campaignPath, taskTitle, true));
	}

	private once(key: string, start: () => Promise<LinkOutcome>): Promise<LinkOutcome> {
		const running = this.inFlight.get(key);
		if (running) return running;

		const started = start().finally(() => this.inFlight.delete(key));
		this.inFlight.set(key, started);
		return started;
	}

	private async run(campaignPath: string, taskTitle: string, again: boolean): Promise<LinkOutcome> {
		const { repository, deleted } = this.deps;
		const campaign = (await repository.listActive()).find((candidate) => candidate.path === campaignPath);
		if (!campaign) return { kind: 'not-found' };
		if (campaign.kind !== 'project') return { kind: 'not-a-project' };

		const tasks = campaign.tasks.filter((task) => task.title === taskTitle);
		if (tasks.length === 0) return { kind: 'not-found' };

		if (again) {
			const target = tasks.find((task) => task.habiticaId !== null && deleted(task.habiticaId));
			const oldId = target?.habiticaId;
			if (!target || !oldId) return { kind: 'changed', habiticaId: null };
			return sendAndRelink(
				() => this.createTodo(campaign, target),
				(newId) => repository.relinkHabiticaId(campaignPath, taskTitle, oldId, newId),
			);
		}

		// The task `linkHabiticaId` will link: the first one with that title and no id yet.
		const target = tasks.find((task) => task.habiticaId === null);
		if (!target) return { kind: 'already-linked' };
		return sendAndLink(
			() => this.createTodo(campaign, target),
			(habiticaId) => repository.linkHabiticaId(campaignPath, taskTitle, habiticaId),
		);
	}

	/** Creates the to-do of `task` in Habitica, tagged with its skills (or the campaign's), and resolves with its id. */
	private async createTodo(campaign: Campaign, task: CampaignTask): Promise<string> {
		const { creator, noteLink, tags } = this.deps;
		const skills = effectiveSkills(campaign, task);
		// Tags first: if they fail nothing is created, so a retry cannot leave a duplicate to-do.
		const tagIds = skills.length > 0 ? await tags.ensureSkillTags(skills) : [];
		return creator.createTodo({
			title: task.title,
			notes: `Dromos · ${campaign.title}\n${noteLink(campaign.path)}`,
			...(tagIds.length > 0 ? { tags: tagIds } : {}),
		});
	}
}
