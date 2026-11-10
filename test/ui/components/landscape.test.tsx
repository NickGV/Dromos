import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Landscape } from '../../../src/ui/atoms/Landscape';
import { watchSight, type SightObserver } from '../../../src/ui/atoms/landscape/sight';

describe('Landscape: still out of sight (home-header S4)', () => {
	it('moves from the start, before anything says it is out of sight', () => {
		expect(renderToStaticMarkup(<Landscape />)).toMatch(/^<svg class="dromos-landscape" /);
	});
});

describe('watchSight: the scene holds still out of sight (home-header S4)', () => {
	/** An IntersectionObserver that records what it watches and reports when told. */
	const fakeObserver = () => {
		const watched: Element[] = [];
		const disconnect = vi.fn();
		let report: (inSight: boolean) => void = () => undefined;
		const Observer: SightObserver = class {
			constructor(callback: IntersectionObserverCallback) {
				report = (inSight) => callback([{ isIntersecting: inSight } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
			}
			observe(target: Element) {
				watched.push(target);
			}
			disconnect() {
				disconnect();
			}
		};
		return { Observer, watched, disconnect, report: (inSight: boolean) => report(inSight) };
	};
	const target = {} as Element;

	it('reports when the scene leaves sight and when it comes back', () => {
		const fake = fakeObserver();
		const onSight = vi.fn();

		watchSight(target, onSight, fake.Observer);
		fake.report(false);
		fake.report(true);

		expect(fake.watched).toEqual([target]);
		expect(onSight.mock.calls).toEqual([[false], [true]]);
	});

	it('stops watching when the scene goes away', () => {
		const fake = fakeObserver();

		watchSight(target, vi.fn(), fake.Observer)();

		expect(fake.disconnect).toHaveBeenCalledOnce();
	});

	it('leaves the scene moving where there is no IntersectionObserver', () => {
		const onSight = vi.fn();

		expect(() => watchSight(target, onSight, undefined)()).not.toThrow();
		expect(onSight).not.toHaveBeenCalled();
	});
});
