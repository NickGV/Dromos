import type { DeviceStore } from '../../ports';

/** Where the device keeps whether the week card of home was left open (the store adds its `dromos:` prefix). */
export const WEEK_OPEN_KEY = 'home-week-open';

/**
 * Whether this device left the week card of home open (app-reports S7), as the campaign cards
 * (home-fit S1): folded until opened, and any stored value but `true` counts as folded.
 */
export function storedWeekOpen(store: DeviceStore): boolean {
	return store.read(WEEK_OPEN_KEY) === true;
}

/** Opens the week card, or folds it when it is open, and keeps the choice on this device. */
export function toggleWeek(store: DeviceStore, open: boolean): boolean {
	const next = !open;
	store.write(WEEK_OPEN_KEY, next);
	return next;
}
