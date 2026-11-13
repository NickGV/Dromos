import type { Campaign } from '../domain';

/** Outcome of writing a Habitica id into a project task. */
export type LinkResult = 'linked' | 'already-linked' | 'not-found';

/**
 * Outcome of replacing the Habitica id of a task or habit Habitica confirmed deleted (ADR-021):
 * `relinked`, or `changed` when the note no longer holds the old id there (or the note is gone),
 * so nothing was written.
 */
export type RelinkResult = 'relinked' | 'changed';

/** Campaigns stored in the vault: active `index` and `research` notes (Q023). */
export interface CampaignRepository {
	/**
	 * Active campaigns ordered by `priority`. Project tasks come back not completed:
	 * the completion state is resolved afterwards from Habitica.
	 */
	listActive(): Promise<readonly Campaign[]>;

	/** Completed campaigns, ordered by title: the ones that count toward the `campaigns` requirement of a skill. */
	listCompleted(): Promise<readonly Campaign[]>;

	/**
	 * Writes `habiticaId` into the first task of a project that has `taskTitle` and no
	 * id yet. It is a check-and-set and, with the compare-and-swap below, the only write Dromos makes
	 * in a note: it never overwrites an id (`already-linked`) and never touches `research` notes.
	 */
	linkHabiticaId(campaignPath: string, taskTitle: string, habiticaId: string): Promise<LinkResult>;

	/** The same check-and-set for a habit of a project: writes the id of its daily into `habits[]`. */
	linkHabitHabiticaId(campaignPath: string, habitTitle: string, habiticaId: string): Promise<LinkResult>;

	/**
	 * "Enviar de nuevo" (ADR-021): a compare-and-swap that writes `newId` into the first task with
	 * `taskTitle` whose id is still exactly `oldId`, the one Habitica confirmed deleted, and touches
	 * nothing else. When the note no longer holds `oldId` there it writes nothing (`changed`).
	 */
	relinkHabiticaId(campaignPath: string, taskTitle: string, oldId: string, newId: string): Promise<RelinkResult>;

	/** The same compare-and-swap for a habit of a project. */
	relinkHabitHabiticaId(campaignPath: string, habitTitle: string, oldId: string, newId: string): Promise<RelinkResult>;
}
