import type { CampaignRepository } from '../ports';
import type { OpenTodo } from './CampaignState';

/**
 * Outcome of linking a campaign task to a to-do that already exists in Habitica (link-existing-todo S2).
 * `taken` when another campaign task holds that to-do since the sync; `write-failed` when the note could
 * not be written. Nothing is ever sent to Habitica, so no outcome carries a Habitica failure.
 */
export type LinkExistingOutcome =
	| { readonly kind: 'linked'; readonly habiticaId: string }
	| { readonly kind: 'already-linked' }
	| { readonly kind: 'taken' }
	| { readonly kind: 'not-found' }
	| { readonly kind: 'not-a-project' }
	| { readonly kind: 'write-failed' };

export interface LinkExistingTaskDeps {
	readonly repository: Pick<CampaignRepository, 'listActive' | 'linkHabiticaId' | 'linkedTaskIds'>;
	/** The open to-dos the last campaign sync listed (`SyncCampaigns.openTodos`), or `null` before any. */
	readonly openTodos: () => readonly OpenTodo[] | null;
}

/**
 * Links a project task with no `habitica_id` to one of the open to-dos already in Habitica, picked from
 * the list the campaign sync loaded (issue #11). It writes the id through the same check-and-set as
 * "Enviar a Habitica" and has no way to reach Habitica, so it never creates a to-do. One to-do is
 * linked to one task only: a to-do already in some campaign's `tasks[]` is neither offered nor written.
 * Never rejects.
 */
export class LinkExistingTask {
	private readonly inFlight = new Map<string, Promise<LinkExistingOutcome>>();

	constructor(private readonly deps: LinkExistingTaskDeps) {}

	/** The open to-dos no campaign task holds, in the sync's order; `null` while the sync has listed none (S3, S4). */
	async choices(): Promise<readonly OpenTodo[] | null> {
		const listed = this.deps.openTodos();
		if (listed === null) return null;
		const linked = await this.deps.repository.linkedTaskIds();
		return listed.filter((todo) => !linked.has(todo.habiticaId));
	}

	/** Runs one link per task; a second pick for the same task joins the one already running. */
	execute(campaignPath: string, taskTitle: string, habiticaId: string): Promise<LinkExistingOutcome> {
		const key = `${campaignPath}\u0000${taskTitle}`;
		const running = this.inFlight.get(key);
		if (running) return running;

		const started = this.run(campaignPath, taskTitle, habiticaId).finally(() => this.inFlight.delete(key));
		this.inFlight.set(key, started);
		return started;
	}

	private async run(campaignPath: string, taskTitle: string, habiticaId: string): Promise<LinkExistingOutcome> {
		const { repository } = this.deps;
		try {
			const campaign = (await repository.listActive()).find((candidate) => candidate.path === campaignPath);
			if (!campaign) return { kind: 'not-found' };
			if (campaign.kind !== 'project') return { kind: 'not-a-project' };

			const tasks = campaign.tasks.filter((task) => task.title === taskTitle);
			if (tasks.length === 0) return { kind: 'not-found' };
			if (!tasks.some((task) => task.habiticaId === null)) return { kind: 'already-linked' };
			// Checked again at write time: another device may have linked this to-do since the sync (S4).
			if ((await repository.linkedTaskIds()).has(habiticaId)) return { kind: 'taken' };

			const result = await repository.linkHabiticaId(campaignPath, taskTitle, habiticaId);
			if (result === 'linked') return { kind: 'linked', habiticaId };
			return { kind: result };
		} catch {
			return { kind: 'write-failed' };
		}
	}
}
