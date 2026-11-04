import type { GameSnapshot } from '../../application';
import type { Clock, DeviceStore } from '../../ports';
import { lastSeenOf, readLastSeen, visitDelta, type LastSeen, type VisitDelta } from '../presenters/sinceVisitView';

/** Where the device keeps what it last saw of the game (the store adds its `dromos:` prefix). */
export const LAST_SEEN_KEY = 'last-seen';

/** What this device kept of the game it last showed, or `null` on its first visit. */
export function storedLastSeen(store: DeviceStore): LastSeen | null {
	return readLastSeen(store.read(LAST_SEEN_KEY));
}

/**
 * Once the open sync settles (game-ui S15): tells what changed since `previous`, the record read
 * when the view opened, and keeps the game of `snapshot` as the new record. Without a character
 * there is nothing to compare nor to keep, so the older record still counts on the next open.
 */
export function settleVisit(store: DeviceStore, previous: LastSeen | null, snapshot: GameSnapshot, clock: Clock): VisitDelta | null {
	const current = lastSeenOf(snapshot, clock.now(), clock.today());
	if (current === null) return null;
	store.write(LAST_SEEN_KEY, current);
	return visitDelta(previous, current, skillNames(snapshot));
}

/** A later sync while the view stays open: what it shows is what this device saw last. */
export function noteSeen(store: DeviceStore, snapshot: GameSnapshot, clock: Clock): void {
	const current = lastSeenOf(snapshot, clock.now(), clock.today());
	if (current !== null) store.write(LAST_SEEN_KEY, current);
}

function skillNames(snapshot: GameSnapshot): Map<string, string> {
	return new Map((snapshot.skills ?? []).map((entry) => [entry.skill.id, entry.skill.name]));
}
