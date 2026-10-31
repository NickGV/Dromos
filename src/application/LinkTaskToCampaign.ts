import { TaskSourceError, type CampaignRepository, type TaskCreator, type TaskSourceErrorKind } from '../ports';

export interface LinkTaskToCampaignDeps {
	readonly repository: CampaignRepository;
	readonly creator: TaskCreator;
	/** A link that opens the campaign note, put in the to-do's notes. Built by the composition root. */
	readonly noteLink: (campaignPath: string) => string;
}

export type LinkOutcome =
	| { readonly kind: 'linked'; readonly habiticaId: string }
	/** The task already has a Habitica id: nothing was created. */
	| { readonly kind: 'already-linked' }
	| { readonly kind: 'not-found' }
	| { readonly kind: 'not-a-project' }
	| { readonly kind: 'habitica-failed'; readonly error: TaskSourceErrorKind }
	/** The to-do exists in Habitica but its id could not be written into the note. */
	| { readonly kind: 'write-failed'; readonly habiticaId: string }
	/** The note was linked meanwhile, so the to-do just created is a duplicate the user has to delete. */
	| { readonly kind: 'duplicate'; readonly habiticaId: string };

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
		const { repository, creator, noteLink } = this.deps;
		const campaign = (await repository.listActive()).find((candidate) => candidate.path === campaignPath);
		if (!campaign) return { kind: 'not-found' };
		if (campaign.kind !== 'project') return { kind: 'not-a-project' };

		const tasks = campaign.tasks.filter((task) => task.title === taskTitle);
		if (tasks.length === 0) return { kind: 'not-found' };
		if (tasks.every((task) => task.habiticaId !== null)) return { kind: 'already-linked' };

		let habiticaId: string;
		try {
			habiticaId = await creator.createTodo({ title: taskTitle, notes: `Dromos · ${campaign.title}\n${noteLink(campaignPath)}` });
		} catch (error) {
			return { kind: 'habitica-failed', error: error instanceof TaskSourceError ? error.kind : 'Unknown' };
		}

		try {
			const result = await repository.linkHabiticaId(campaignPath, taskTitle, habiticaId);
			if (result === 'linked') return { kind: 'linked', habiticaId };
			if (result === 'already-linked') return { kind: 'duplicate', habiticaId };
		} catch {
			// Fall through: the to-do exists, so the id must reach the user.
		}
		return { kind: 'write-failed', habiticaId };
	}
}
