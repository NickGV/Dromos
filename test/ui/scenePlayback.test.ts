import { describe, expect, it } from 'vitest';
import { playWhileSeen, type LoopVideo, type PageVisibility } from '../../src/ui/atoms/scenePlayback';

/** A video that counts what it was asked to do; `refuse` makes `play()` reject, as a browser may. */
function aVideo(refuse = false) {
	const calls: string[] = [];
	const video: LoopVideo = {
		muted: false,
		play: () => {
			calls.push('play');
			return refuse ? Promise.reject(new Error('NotAllowedError')) : Promise.resolve();
		},
		pause: () => {
			calls.push('pause');
		},
	};
	return { video, calls };
}

/** A page whose visibility the test flips, telling its listeners as the browser does. */
function aPage() {
	const listeners = new Set<() => void>();
	const page: PageVisibility & { hidden: boolean } = {
		hidden: false,
		addEventListener: (_type, listener) => listeners.add(listener),
		removeEventListener: (_type, listener) => listeners.delete(listener),
	};
	return { page, listeners, setHidden: (hidden: boolean) => ((page.hidden = hidden), listeners.forEach((listener) => listener())) };
}

/** A sight watcher the test drives: `seen(true)` as the IntersectionObserver would report. */
function aWatch() {
	let report: ((inSight: boolean) => void) | null = null;
	let stopped = false;
	const watch = (onSight: (inSight: boolean) => void) => {
		report = onSight;
		return () => {
			stopped = true;
		};
	};
	return { watch, seen: (inSight: boolean) => report?.(inSight), isStopped: () => stopped };
}

describe('playWhileSeen: a scene video plays only while someone can see it (scene-video S3)', () => {
	it('is muted, and waits until it is seen', () => {
		const { video, calls } = aVideo();
		playWhileSeen(video, aPage().page, aWatch().watch);
		expect(video.muted).toBe(true);
		expect(calls).toEqual([]);
	});

	it('plays when it comes into sight and pauses when it leaves', () => {
		const { video, calls } = aVideo();
		const sight = aWatch();
		playWhileSeen(video, aPage().page, sight.watch);
		sight.seen(true);
		sight.seen(false);
		expect(calls).toEqual(['play', 'pause']);
	});

	it('pauses while the page is hidden and plays again when it shows, if still in sight', () => {
		const { video, calls } = aVideo();
		const sight = aWatch();
		const { page, setHidden } = aPage();
		playWhileSeen(video, page, sight.watch);
		sight.seen(true);
		setHidden(true);
		setHidden(false);
		sight.seen(false);
		setHidden(true);
		setHidden(false);
		expect(calls).toEqual(['play', 'pause', 'play', 'pause', 'pause', 'pause']);
	});

	it('never plays while the page is hidden, even in sight', () => {
		const { video, calls } = aVideo();
		const sight = aWatch();
		const { page, setHidden } = aPage();
		playWhileSeen(video, page, sight.watch);
		setHidden(true);
		sight.seen(true);
		expect(calls).toEqual(['pause', 'pause']);
	});

	it('stops watching, pauses and forgets the page when stopped', () => {
		const { video, calls } = aVideo();
		const sight = aWatch();
		const { page, listeners } = aPage();
		const stop = playWhileSeen(video, page, sight.watch);
		sight.seen(true);
		stop();
		expect(sight.isStopped()).toBe(true);
		expect(listeners.size).toBe(0);
		expect(calls).toEqual(['play', 'pause']);
	});

	it('keeps quiet when the browser refuses to play: the painting stays', async () => {
		const { video, calls } = aVideo(true);
		const sight = aWatch();
		playWhileSeen(video, null, sight.watch);
		expect(() => sight.seen(true)).not.toThrow();
		await Promise.resolve();
		expect(calls).toEqual(['play']);
	});
});
