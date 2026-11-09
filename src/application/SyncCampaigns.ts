import { isReadingHabit, type Area, type Campaign } from '../domain';
import type { AreaRepository, CampaignRepository, Clock, TaskStatus, TaskStatusSource } from '../ports';
import type { CampaignLists, CampaignSnapshot, CampaignState } from './CampaignState';
import { mergeAreaStatuses, mergeTaskStatuses } from './mergeTaskStatuses';
import type { PendingOrFailedStatus } from './QuestState';
import { statusForFailure } from './statusForFailure';

export interface SyncCampaignsDeps {
	readonly repository: CampaignRepository;
	/** The areas (ADR-017): their reading habits are synced with the campaigns. */
	readonly areas: Pick<AreaRepository, 'listAreas'>;
	readonly source: TaskStatusSource;
	readonly clock: Clock;
	readonly state: CampaignState;
	/** True when both the Habitica user ID and token are set. */
	readonly hasCredentials: () => boolean;
}

/**
 * Reads the active campaigns and the areas from the vault and asks Habitica, in one request, for
 * the status of the campaigns' linked tasks and habits and of the areas' linked reading habits
 * (ADR-017: a habit whose skills, its own or else its area's, include `lector`). The vault is read on every run, so a hand edit shows up; Habitica's answers are
 * remembered for the session, so a failed sync keeps the last known progress (D3). Never rejects.
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
		const { state } = this.deps;
		try {
			const [campaigns, areas] = await this.readVault();
			state.recordVault(this.merged(campaigns, areas));
		} catch {
			state.setStatus({ kind: 'error' });
		}
		return state.snapshot();
	}

	private async run(): Promise<CampaignSnapshot> {
		const { source, clock, state, hasCredentials } = this.deps;
		state.setStatus({ kind: 'syncing' });

		let campaigns: readonly Campaign[];
		let areas: readonly Area[];
		try {
			[campaigns, areas] = await this.readVault();
		} catch {
			state.setStatus({ kind: 'error' });
			return state.snapshot();
		}

		let failure: PendingOrFailedStatus | null = null;
		const ids = [
			...campaigns.flatMap((campaign) => (campaign.kind === 'project' ? [...campaign.tasks, ...campaign.habits] : [])),
			...areas.flatMap((area) => area.habits.filter((habit) => isReadingHabit(habit, area))),
		].flatMap((item) => (item.habiticaId ? [item.habiticaId] : []));
		if (!hasCredentials()) {
			failure = { kind: 'not-configured' };
		} else if (ids.length > 0) {
			try {
				for (const [id, status] of await source.fetchStatuses(ids)) this.known.set(id, status);
			} catch (error) {
				failure = statusForFailure(error);
			}
		}

		const merged = this.merged(campaigns, areas);
		if (failure) state.recordPartial(merged, failure);
		else state.recordSuccess(merged, clock.now());
		return state.snapshot();
	}

	private readVault(): Promise<[readonly Campaign[], readonly Area[]]> {
		return Promise.all([this.deps.repository.listActive(), this.deps.areas.listAreas()]);
	}

	/** The lists with Habitica's last known answers applied: the campaigns' issues first, then the areas'. */
	private merged(campaigns: readonly Campaign[], areas: readonly Area[]): CampaignLists {
		const fromCampaigns = mergeTaskStatuses(campaigns, this.known);
		const fromAreas = mergeAreaStatuses(areas, this.known);
		return { campaigns: fromCampaigns.campaigns, areas: fromAreas.areas, issues: [...fromCampaigns.issues, ...fromAreas.issues] };
	}
}
