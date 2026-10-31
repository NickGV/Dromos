import type { Campaign } from '../domain';

/** Outcome of writing a Habitica id into a project task. */
export type LinkResult = 'linked' | 'already-linked' | 'not-found';

/** Campaigns stored in the vault: active `index` and `research` notes (Q023). */
export interface CampaignRepository {
	/**
	 * Active campaigns ordered by `priority`. Project tasks come back not completed:
	 * the completion state is resolved afterwards from Habitica.
	 */
	listActive(): Promise<readonly Campaign[]>;

	/**
	 * Writes `habiticaId` into the first task of a project that has `taskTitle` and no
	 * id yet. It is a check-and-set and the only write Dromos makes in a note: it never
	 * overwrites an id (`already-linked`) and never touches `research` notes.
	 */
	linkHabiticaId(campaignPath: string, taskTitle: string, habiticaId: string): Promise<LinkResult>;
}
