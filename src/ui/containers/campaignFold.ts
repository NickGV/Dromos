import type { DeviceStore } from '../../ports';
import { toggled } from '../presenters/toggled';

/** Where the device keeps the campaign cards of home left open (the store adds its `dromos:` prefix). */
export const OPEN_CAMPAIGNS_KEY = 'home-campaigns-open';

/**
 * The campaign cards of home this device left open (home-fit S1), by the path of their campaign.
 * Every card is folded until opened; a stored value that is not a list of paths counts as none,
 * and an entry that is not a path is skipped.
 */
export function storedOpenCampaigns(store: DeviceStore): ReadonlySet<string> {
	const stored = store.read(OPEN_CAMPAIGNS_KEY);
	if (!Array.isArray(stored)) return new Set();
	return new Set(stored.filter((entry): entry is string => typeof entry === 'string' && entry !== ''));
}

/** Opens the card of `path`, or folds it when it is open, and keeps the open ones on this device. */
export function toggleCampaign(store: DeviceStore, open: ReadonlySet<string>, path: string): ReadonlySet<string> {
	const next = toggled(open, path);
	store.write(OPEN_CAMPAIGNS_KEY, [...next]);
	return next;
}
