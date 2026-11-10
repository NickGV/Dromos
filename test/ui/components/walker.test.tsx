import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Landscape } from '../../../src/ui/atoms/Landscape';
import { LevelRibbon } from '../../../src/ui/atoms/LevelRibbon';
import { Walker } from '../../../src/ui/atoms/Walker';
import { HomeScreen } from '../../../src/ui/containers/HomeScreen';
import { Scene } from '../../../src/ui/organisms/Scene';
import { GATE, GATE_TOP, walkerPlacement, walkerTransform } from '../../../src/ui/presenters/walkerView';
import { homeDeps, noop } from './homeDeps';

/** The transform of the walker's group. */
const walkerAt = (html: string): string | undefined => /<g class="dromos-walker[^"]*" transform="([^"]+)"/.exec(html)?.[1];

// game-ui S16: the walker on the road and the gate at its end.
describe('Landscape draws the gate at the far end of the road', () => {
	it('as two posts and a lintel in the line style of the scene, before the walker it is given', () => {
		const html = renderToStaticMarkup(
			<Landscape>
				<g className="the-walker" />
			</Landscape>,
		);

		expect(html).toMatch(new RegExp(`<g class="dromos-scene-gate" transform="translate\\(${GATE.x} ${GATE.y}\\) scale\\(0.7\\)"><path class="dromos-scene-gate-post"[^>]*></path><path class="dromos-scene-gate-post"[^>]*></path><path class="dromos-scene-gate-lintel"[^>]*></path></g>`));
		expect(html.indexOf('dromos-scene-gate')).toBeGreaterThan(html.indexOf('dromos-scene-road'));
		expect(html.indexOf('the-walker')).toBeGreaterThan(html.indexOf('dromos-scene-gate'));
		expect(html).toMatch(/<\/g><\/svg>$/);
	});
});

describe('Walker', () => {
	it('stands at its share of the road at once in markup, as under reduced motion, without stepping', () => {
		const html = renderToStaticMarkup(
			<svg>
				<Walker fraction={0.5} />
			</svg>,
		);

		expect(walkerAt(html)).toBe(walkerTransform(walkerPlacement(0.5)));
		expect(html).toContain('<g class="dromos-walker" transform=');
		expect(html).not.toContain('is-walking');
	});

	it('stands at the start without a character, and keeps the figure of the design with its shadow and lamp', () => {
		const html = renderToStaticMarkup(
			<svg>
				<Walker fraction={null} />
			</svg>,
		);

		expect(walkerAt(html)).toBe('translate(539 238) scale(1)');
		for (const part of ['dromos-scene-shadow', 'dromos-scene-staff', 'dromos-scene-robe', 'dromos-scene-belt', 'dromos-scene-head', 'dromos-scene-hair', 'dromos-scene-lamp']) {
			expect(html).toContain(`class="${part}"`);
		}
	});
});

describe('Scene marks the gate with the next level', () => {
	const scene = (props: Partial<Parameters<typeof Scene>[0]> = {}): string => renderToStaticMarkup(<Scene screen="home" offline={false} onGo={noop} onSettings={null} {...props} />);

	it('names the next level on a plaque at the lintel, a drawing screen readers skip', () => {
		const html = scene({ walker: 0.35, gateLabel: 'Level 6' });

		expect(html).toMatch(/<\/svg><div class="dromos-gate-plaque" aria-hidden="true" style="[^"]*">Level 6<\/div><nav/);
		expect(html).toContain(`--dromos-gate-x:${GATE.x}`);
		expect(html).toContain(`--dromos-gate-top:${GATE_TOP}`);
		expect(walkerAt(html)).toBe(walkerTransform(walkerPlacement(0.35)));
	});

	it('leaves the gate unmarked without a level', () => {
		expect(scene({ walker: null, gateLabel: null })).not.toContain('dromos-gate-plaque');
	});

	it('still starts with the landscape and has no ribbon without one, plaque or not', () => {
		const html = scene({ walker: 0.35, gateLabel: 'Level 6' });

		expect(html).toMatch(/^<div class="dromos-scene" data-period="day"><svg[^>]*class="dromos-landscape"/);
		expect(html).not.toContain('dromos-ribbon');
	});

	it('keeps the ribbon right after the signpost when there is one', () => {
		expect(scene({ walker: 1, gateLabel: 'Level 4', ribbon: <LevelRibbon kicker="New level" title="Level 4" /> })).toMatch(/<\/nav><div class="dromos-ribbon"/);
	});
});

describe('HomeScreen', () => {
	it('keeps one polite live region for the line of the visit in the frame, empty until the open sync settles', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps()} />);

		expect(html.match(/<p class="dromos-visually-hidden dromos-since-news" role="status"><\/p>/g)).toHaveLength(1);
		expect(html).toMatch(/<\/main><p class="dromos-visually-hidden dromos-since-news" role="status"><\/p><\/div>$/);
	});

	it('keeps the walker at the start and the gate unmarked while the character loads', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps()} />);

		expect(walkerAt(html)).toBe('translate(539 238) scale(1)');
		expect(html).not.toContain('dromos-gate-plaque');
	});
});
