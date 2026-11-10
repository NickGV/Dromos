/** What `watchSight` needs of an IntersectionObserver: the browser's, or a fake in the tests. */
export type SightObserver = new (callback: IntersectionObserverCallback) => Pick<IntersectionObserver, 'observe' | 'disconnect'>;

/**
 * Tells `onSight` whenever `target` leaves sight or comes back (home-header S4), so the scene's
 * ambient loops hold still while nobody can see them: scrolled away, or in a hidden tab. It uses
 * the observer of the target's own window, so a scene in a pop-out window is watched there. Where
 * there is none, as in server rendering and the tests, it watches nothing, reports nothing and the
 * scene keeps moving. Returns the function that stops watching.
 */
export function watchSight(target: Element, onSight: (inSight: boolean) => void, Observer: SightObserver | undefined = target.ownerDocument?.defaultView?.IntersectionObserver): () => void {
	if (typeof Observer !== 'function') return () => undefined;
	const observer = new Observer((entries) => {
		const latest = entries[entries.length - 1];
		if (latest) onSight(latest.isIntersecting);
	});
	observer.observe(target);
	return () => observer.disconnect();
}
