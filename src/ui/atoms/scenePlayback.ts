/** What `playWhileSeen` needs of a `<video>`: the browser's, or a fake in the tests. */
export interface LoopVideo {
	muted: boolean;
	play(): Promise<void> | undefined;
	pause(): void;
}

/** What it needs of the page: whether it is hidden, and word when that changes. */
export interface PageVisibility {
	readonly hidden: boolean;
	addEventListener(type: 'visibilitychange', listener: () => void): void;
	removeEventListener(type: 'visibilitychange', listener: () => void): void;
}

/**
 * Plays a scene's video only while someone can see it (scene-video S3): muted, it plays while `watch`
 * reports it in sight and the page is shown, and pauses otherwise. A video the stylesheet hides, the
 * other theme's or any under reduced motion, is never in sight, so it never plays; one scrolled away,
 * in a hidden tab or in a hidden window pauses. A play the browser refuses leaves the painting, which
 * is the video's still frame. Returns the function that stops it.
 */
export function playWhileSeen(video: LoopVideo, page: PageVisibility | null, watch: (onSight: (inSight: boolean) => void) => () => void): () => void {
	video.muted = true;
	let inSight = false;
	const update = (): void => {
		if (inSight && !(page?.hidden ?? false)) {
			video.play()?.catch(() => undefined);
			return;
		}
		video.pause();
	};
	const stopWatching = watch((seen) => {
		inSight = seen;
		update();
	});
	page?.addEventListener('visibilitychange', update);
	return () => {
		stopWatching();
		page?.removeEventListener('visibilitychange', update);
		video.pause();
	};
}
