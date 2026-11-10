import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CAMPFIRE } from '../../../src/ui/atoms/Campfire';
import { Landscape } from '../../../src/ui/atoms/Landscape';
import { watchSight, type SightObserver } from '../../../src/ui/atoms/landscape/sight';
import { BUTTERFLIES, FIREFLIES, FLOWERS, SHEEP, TUFTS, WINDMILL } from '../../../src/ui/atoms/landscape/spots';

const css = readFileSync(new URL('../../../styles.css', import.meta.url), 'utf8');
const drawing = (): string =>
	renderToStaticMarkup(
		<Landscape>
			<g className="the-walker" />
		</Landscape>,
	);

/** The body of the first rule whose selector list contains `selector`. */
const ruleOf = (source: string, selector: string): string => {
	const at = source.indexOf(selector);
	if (at < 0) return '';
	const open = source.indexOf('{', at);
	return source.slice(open + 1, source.indexOf('}', open));
};

/** Every rule whose whole selector is `selector`, at the start of a line, joined. */
const rulesOf = (source: string, selector: string): string =>
	source
		.split(`\n${selector} {`)
		.slice(1)
		.map((rest) => rest.slice(0, rest.indexOf('}')))
		.join('\n');

/** The reduced-motion blocks of the stylesheet, joined. */
const reducedMotion = (): string =>
	[...css.matchAll(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/g)].map((match) => match[1] ?? '').join('\n');

// home-header S4: "que en el paisaje agregaramos mas cositas … ponerle depronto mas animaciones".
describe('Landscape: more life in the scene (home-header S4)', () => {
	it('draws a far ridge, a windmill, sheep, chimney smoke, flowers, grass, butterflies and fireflies, each at its depth', () => {
		const html = drawing();
		const at = (name: string): number => html.indexOf(`class="${name}`);

		for (const part of ['dromos-scene-ridge', 'dromos-scene-windmill', 'dromos-scene-sails', 'dromos-scene-sheep', 'dromos-scene-chimneys', 'dromos-scene-smoke', 'dromos-scene-flowers', 'dromos-scene-tufts', 'dromos-scene-butterflies', 'dromos-scene-fireflies']) {
			expect(at(part), part).toBeGreaterThan(0);
		}
		expect(at('dromos-scene-ridge')).toBeLessThan(at('dromos-scene-hill is-far'));
		expect(at('dromos-scene-windmill')).toBeGreaterThan(at('dromos-scene-hill is-far'));
		expect(at('dromos-scene-sheep')).toBeLessThan(at('dromos-scene-hill"'));
		expect(at('dromos-scene-smoke')).toBeGreaterThan(at('dromos-scene-village'));
		expect(at('dromos-scene-flowers')).toBeGreaterThan(at('dromos-scene-road'));
		expect(at('dromos-scene-fireflies')).toBeLessThan(at('dromos-scene-gate'));
		expect(html.match(/class="dromos-scene-ewe/g)).toHaveLength(SHEEP.length);
		expect(html.indexOf('the-walker')).toBeGreaterThan(at('dromos-scene-fireflies'));
	});

	it('marks every part that moves as life, so one rule holds it still', () => {
		const html = drawing();

		for (const part of ['stars', 'flock', 'windmill', 'sheep', 'smoke', 'cypresses', 'tufts', 'butterflies', 'fireflies']) {
			expect(html).toContain(`class="dromos-scene-${part} dromos-scene-life"`);
		}
	});

	it('keeps its life clear of the walker, the gate and its plaque, and the campfire', () => {
		const keepClear = [
			{ name: 'the walker', left: 520, right: 620, top: 140, bottom: 245 },
			{ name: 'the gate', left: 570, right: 640, top: 135, bottom: 215 },
			{ name: 'the campfire', left: CAMPFIRE.x - 24, right: CAMPFIRE.x + 24, top: CAMPFIRE.y - 29, bottom: CAMPFIRE.y + 3 },
		];
		const reach = [
			...[WINDMILL].map((spot) => ({ spot, width: 15, height: 35 })),
			...SHEEP.map((spot) => ({ spot, width: 7, height: 8 })),
			...FLOWERS.map((spot) => ({ spot, width: 2, height: 2 })),
			...TUFTS.map((spot) => ({ spot, width: 7, height: 10 })),
			...BUTTERFLIES.map((spot) => ({ spot, width: 5, height: 5 })),
			...FIREFLIES.map((spot) => ({ spot, width: 11, height: 11 })),
		];

		for (const { spot, width, height } of reach) {
			for (const zone of keepClear) {
				const apart = spot.x + width < zone.left || spot.x - width > zone.right || spot.y < zone.top || spot.y - height > zone.bottom;
				expect(apart, `${spot.x},${spot.y} in ${zone.name}`).toBe(true);
			}
		}
	});

	it('holds every loop still under reduced motion, out of sight and offline', () => {
		expect(reducedMotion()).toMatch(/\.dromos-root \.dromos-landscape \.dromos-scene-life,\s*\.dromos-root \.dromos-landscape \.dromos-scene-life \*[^{]*\{\s*animation: none;/);
		expect(ruleOf(css, '.dromos-root .dromos-landscape.is-still *')).toContain('animation-play-state: paused');
		expect(ruleOf(css, '.dromos-root .dromos-scene.is-offline .dromos-scene-life *')).toContain('animation-play-state: paused');
	});

	it('gives every new part a color of its own in both themes', () => {
		const dark = rulesOf(css, '.dromos-root');
		const light = rulesOf(css, '.theme-light .dromos-root');

		for (const token of ['ridge', 'wool', 'flower', 'bloom', 'wing', 'firefly', 'mantle', 'satchel']) {
			expect(dark, token).toMatch(new RegExp(`--dromos-scene-${token}: #[0-9a-f]{6};`));
			expect(light, token).toMatch(new RegExp(`--dromos-scene-${token}: #[0-9a-f]{6};`));
			expect(css, token).toContain(`var(--dromos-scene-${token})`);
		}
	});
});

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
