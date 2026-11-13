import { isReadingHabit, standingCompletionDate, type Area, type Campaign, type LedgerRow } from '../domain';
import type { AreaRepository, CampaignRepository, Clock, LedgerRepository, TaskStatus, TaskStatusSource } from '../ports';
import type { CampaignLists, CampaignSnapshot, CampaignState } from './CampaignState';
import { mergeAreaStatuses, mergeTaskStatuses } from './mergeTaskStatuses';
import type { PendingOrFailedStatus } from './QuestState';
import { statusForFailure } from './statusForFailure';

export interface SyncCampaignsDeps {
	readonly repository: CampaignRepository;
	/** The areas (ADR-017): their reading habits are synced with the campaigns. */
	readonly areas: Pick<AreaRepository, 'listAreas'>;
	readonly source: TaskStatusSource;
	/**
	 * The ledger, read only when Habitica no longer has a linked to-do: a to-do whose completion
	 * stands there was completed, never deleted (ADR-021).
	 */
	readonly ledger: Pick<LedgerRepository, 'readAll'>;
	readonly clock: Clock;
	readonly state: CampaignState;
	/** True when both the Habitica user ID and token are set. */
	readonly hasCredentials: () => boolean;
}

/**
 * Reads the active campaigns and the areas from the vault and asks Habitica, in one request, for
 * the status of the campaigns' linked tasks and habits and of the areas' linked reading habits
 * (ADR-017: a habit whose skills, its own or else its area's, include `lector`). The vault is read on every run, so a hand edit shows up; Habitica's answers are
 * remembered for the session, so a failed sync keeps the last known progress (D3). A to-do Habitica
 * no longer has is deleted only when the ledger shows no standing completion; an id with no answer
 * keeps its last known state and is never taken for deleted (ADR-021). Never rejects.
 */
export class SyncCampaigns {
	private inFlight: Promise<CampaignSnapshot> | null = null;
	private readonly known = new Map<string, TaskStatus>();

	constructor(private readonly deps: SyncCampaignsDeps) {}

	/**
	 * True when Habitica's last answer about `habiticaId` was that it no longer has it, and, for a
	 * to-do, the ledger showed no completion: the only id "Enviar de nuevo" may replace (ADR-021).
	 */
	isDeleted(habiticaId: string): boolean {
		return this.known.get(habiticaId)?.kind === 'deleted';
	}

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
		const projects = campaigns.filter((campaign) => campaign.kind === 'project');
		const todos = linkedIds(projects.flatMap((campaign) => campaign.tasks));
		const dailies = linkedIds([...projects.flatMap((campaign) => campaign.habits), ...areas.flatMap((area) => area.habits.filter((habit) => isReadingHabit(habit, area)))]);
		if (!hasCredentials()) {
			failure = { kind: 'not-configured' };
		} else if (todos.length + dailies.length > 0) {
			try {
				for (const [id, status] of await this.settled(await source.fetchStatuses({ todos, dailies }), todos)) this.known.set(id, status);
			} catch (error) {
				failure = statusForFailure(error);
			}
		}

		const merged = this.merged(campaigns, areas);
		if (failure) state.recordPartial(merged, failure);
		else state.recordSuccess(merged, clock.now());
		return state.snapshot();
	}

	/**
	 * Habitica's answers with each to-do it no longer has checked against the ledger (ADR-021): one
	 * whose completion stands there is completed on that day, since Habitica forgets completed to-dos
	 * too; one with none is deleted. While the ledger cannot be read, those to-dos stay unanswered,
	 * so they keep their last known state. The ledger is read only when some to-do needs it.
	 */
	private async settled(answers: ReadonlyMap<string, TaskStatus>, todos: readonly string[]): Promise<ReadonlyMap<string, TaskStatus>> {
		const gone = todos.filter((id) => answers.get(id)?.kind === 'deleted');
		if (gone.length === 0) return answers;
		const settled = new Map(answers);
		let rows: readonly LedgerRow[];
		try {
			rows = (await this.deps.ledger.readAll()).rows;
		} catch {
			for (const id of gone) settled.delete(id);
			return settled;
		}
		for (const id of gone) {
			const completedOn = standingCompletionDate(rows, id);
			if (completedOn !== null) settled.set(id, { kind: 'completed', completedOn });
		}
		return settled;
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

/** The Habitica ids of the linked items, in order. */
function linkedIds(items: readonly { readonly habiticaId: string | null }[]): string[] {
	return items.flatMap((item) => (item.habiticaId ? [item.habiticaId] : []));
}
