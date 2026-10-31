import type { CampaignRepository, Clock, TaskStatus, TaskStatusSource } from '../ports';
import type { CampaignSnapshot, CampaignState } from './CampaignState';
import { mergeTaskStatuses } from './mergeTaskStatuses';
import type { PendingOrFailedStatus } from './QuestState';
import { statusForFailure } from './statusForFailure';

export interface SyncCampaignsDeps {
	readonly repository: CampaignRepository;
	readonly source: TaskStatusSource;
	readonly clock: Clock;
	readonly state: CampaignState;
	/** True when both the Habitica user ID and token are set. */
	readonly hasCredentials: () => boolean;
}

/**
 * Reads the active campaigns from the vault and asks Habitica for the status of their
 * linked tasks. The vault is read on every run, so a hand edit shows up; Habitica's
 * answers are remembered for the session, so a failed sync keeps the last known
 * progress (D3). Never rejects.
 */
export class SyncCampaigns {
	private inFlight: Promise<CampaignSnapshot> | null = null;
	private readonly known = new Map<string, TaskStatus>();

	constructor(private readonly deps: SyncCampaignsDeps) {}

	/** Runs one sync, or returns the one already running. The state reads `syncing` as soon as this returns. */
	execute(): Promise<CampaignSnapshot> {
		this.inFlight ??= this.run().finally(() => {
			this.inFlight = null;
		});
		return this.inFlight;
	}

	/**
	 * Re-reads the vault only, with no Habitica request: the progress already known is kept
	 * and the status stays as it was. For after a change Dromos itself made to a note. Joins
	 * a sync that is already running. Never rejects.
	 */
	async reload(): Promise<CampaignSnapshot> {
		if (this.inFlight) return this.inFlight;
		const { repository, state } = this.deps;
		try {
			const merged = mergeTaskStatuses(await repository.listActive(), this.known);
			state.recordVault(merged.campaigns, merged.issues);
		} catch {
			state.setStatus({ kind: 'error' });
		}
		return state.snapshot();
	}

	private async run(): Promise<CampaignSnapshot> {
		const { repository, source, clock, state, hasCredentials } = this.deps;
		state.setStatus({ kind: 'syncing' });

		let campaigns;
		try {
			campaigns = await repository.listActive();
		} catch {
			state.setStatus({ kind: 'error' });
			return state.snapshot();
		}

		let failure: PendingOrFailedStatus | null = null;
		const ids = campaigns.flatMap((campaign) => (campaign.kind === 'project' ? campaign.tasks.flatMap((task) => (task.habiticaId ? [task.habiticaId] : [])) : []));
		if (!hasCredentials()) {
			failure = { kind: 'not-configured' };
		} else if (ids.length > 0) {
			try {
				for (const [id, status] of await source.fetchStatuses(ids)) this.known.set(id, status);
			} catch (error) {
				failure = statusForFailure(error);
			}
		}

		const merged = mergeTaskStatuses(campaigns, this.known);
		if (failure) state.recordPartial(merged.campaigns, merged.issues, failure);
		else state.recordSuccess(merged.campaigns, merged.issues, clock.now());
		return state.snapshot();
	}
}
