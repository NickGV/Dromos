import type { Campaign } from '../domain';

/** Campaigns stored in the vault: active `index` and `research` notes (Q023). */
export interface CampaignRepository {
	/**
	 * Active campaigns ordered by `priority`. Project tasks come back not completed:
	 * the completion state is resolved afterwards from Habitica.
	 */
	listActive(): Promise<readonly Campaign[]>;
}
