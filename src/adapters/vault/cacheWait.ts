/** The timer functions `waitForCache` uses; injectable so tests need no real clock. */
export interface Timers {
	set(handler: () => void, ms: number): unknown;
	clear(handle: unknown): void;
}

// `window` timers keep working when the view lives in a popout window.
const windowTimers: Timers = {
	set: (handler, ms) => window.setTimeout(handler, ms),
	clear: (handle) => window.clearTimeout(handle as number),
};

/**
 * Resolves once the metadata cache reflects a write to `path`, or after `timeoutMs`,
 * whichever comes first. Obsidian re-reads a note's frontmatter asynchronously after it is
 * saved, so a read right after a write can still see the old values. `subscribe` listens to
 * the cache's "changed" event and returns the function that stops listening. Never rejects:
 * a stuck cache must not block the caller.
 */
export function waitForCache(
	subscribe: (onChanged: (path: string) => void) => () => void,
	path: string,
	isUpToDate: () => boolean,
	timeoutMs: number,
	timers: Timers = windowTimers,
): Promise<void> {
	if (isUpToDate()) return Promise.resolve();

	return new Promise((resolve) => {
		const finish = (): void => {
			timers.clear(timer);
			unsubscribe();
			resolve();
		};
		const unsubscribe = subscribe((changedPath) => {
			if (changedPath === path && isUpToDate()) finish();
		});
		const timer = timers.set(finish, timeoutMs);
	});
}
