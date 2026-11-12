import { newestFirst, type Title } from '../../domain';
import type { DeviceStore } from '../../ports';

/** Where the device keeps the grant day of the newest title it has seen (the store adds its `dromos:` prefix). */
export const TITLES_SEEN_KEY = 'titles-seen';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The grant day of the newest title this device has seen, `YYYY-MM-DD`; `null` before the first read, or when what is kept is not a day. */
export function storedTitlesSeen(store: DeviceStore): string | null {
	const value = store.read(TITLES_SEEN_KEY);
	return typeof value === 'string' && DAY.test(value) ? value : null;
}

/**
 * The title to announce on the plaque (titles S5, ADR-020): the newest one, when it was granted after
 * the day this device kept, or `null`. Its day is kept at once, so the notice shows once per device.
 * On the very first read on this device the titles already there are only marked seen, with no notice,
 * so "Corredor" alone never brings one. Without a readable title nothing is written.
 */
export function newTitleNotice(store: DeviceStore, titles: readonly Title[]): Title | null {
	const [newest] = newestFirst(titles);
	if (!newest) return null;
	const seen = storedTitlesSeen(store);
	if (seen !== null && newest.granted <= seen) return null;
	store.write(TITLES_SEEN_KEY, newest.granted);
	return seen === null ? null : newest;
}

/** Opening the titles card marks them seen on this device too (titles S5); the kept day never moves back. */
export function markTitlesSeen(store: DeviceStore, titles: readonly Title[]): void {
	const [newest] = newestFirst(titles);
	const seen = storedTitlesSeen(store);
	if (newest && (seen === null || newest.granted > seen)) store.write(TITLES_SEEN_KEY, newest.granted);
}
