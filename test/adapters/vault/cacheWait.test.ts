import { describe, expect, it, vi } from 'vitest';
import { waitForCache, type Timers } from '../../../src/adapters/vault/cacheWait';

/** A cache whose "changed" event the test fires by hand. */
function fakeCache() {
	const listeners = new Set<(path: string) => void>();
	return {
		listeners,
		subscribe: (onChanged: (path: string) => void) => {
			listeners.add(onChanged);
			return () => listeners.delete(onChanged);
		},
		fire: (path: string) => listeners.forEach((listener) => listener(path)),
	};
}

/** Timers driven by hand: `advance` runs every handler that is due. */
function manualTimers() {
	let now = 0;
	let nextId = 1;
	const pending = new Map<number, { at: number; handler: () => void }>();
	const timers: Timers = {
		set: (handler, ms) => {
			pending.set(nextId, { at: now + ms, handler });
			return nextId++;
		},
		clear: (handle) => void pending.delete(handle as number),
	};
	return {
		timers,
		pending,
		advance: (ms: number) => {
			now += ms;
			for (const [id, timer] of [...pending]) {
				if (timer.at <= now) {
					pending.delete(id);
					timer.handler();
				}
			}
		},
	};
}

const flush = () => Promise.resolve();

describe('waitForCache', () => {
	it('resolves at once, without listening, when the cache is already up to date', async () => {
		const cache = fakeCache();
		const clock = manualTimers();

		await waitForCache(cache.subscribe, 'a.md', () => true, 3000, clock.timers);

		expect(cache.listeners.size).toBe(0);
		expect(clock.pending.size).toBe(0);
	});

	it('resolves when the note changes and the cache has caught up, then stops listening and cancels the timer', async () => {
		const cache = fakeCache();
		const clock = manualTimers();
		let upToDate = false;
		const done = vi.fn();

		void waitForCache(cache.subscribe, 'a.md', () => upToDate, 3000, clock.timers).then(done);
		upToDate = true;
		cache.fire('a.md');
		await flush();

		expect(done).toHaveBeenCalledOnce();
		expect(cache.listeners.size).toBe(0);
		expect(clock.pending.size).toBe(0);
	});

	it('ignores changes of other notes and changes that are not up to date yet', async () => {
		const cache = fakeCache();
		const clock = manualTimers();
		let upToDate = false;
		const done = vi.fn();

		void waitForCache(cache.subscribe, 'a.md', () => upToDate, 3000, clock.timers).then(done);
		upToDate = true;
		cache.fire('other.md');
		await flush();
		expect(done).not.toHaveBeenCalled();

		upToDate = false;
		cache.fire('a.md');
		await flush();
		expect(done).not.toHaveBeenCalled();
	});

	it('gives up after the timeout so a stuck cache never blocks the caller', async () => {
		const cache = fakeCache();
		const clock = manualTimers();
		const done = vi.fn();

		void waitForCache(cache.subscribe, 'a.md', () => false, 3000, clock.timers).then(done);
		clock.advance(2999);
		await flush();
		expect(done).not.toHaveBeenCalled();
		clock.advance(1);
		await flush();

		expect(done).toHaveBeenCalledOnce();
		expect(cache.listeners.size).toBe(0);
	});
});
