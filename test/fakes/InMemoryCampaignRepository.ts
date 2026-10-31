import type { Campaign } from '../../src/domain';
import type { CampaignRepository } from '../../src/ports';

/** Campaign repository backed by a list, for use-case and container tests. */
export class InMemoryCampaignRepository implements CampaignRepository {
	constructor(private campaigns: readonly Campaign[] = []) {}

	listActive(): Promise<readonly Campaign[]> {
		return Promise.resolve(this.campaigns);
	}
}
