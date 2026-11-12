import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Landscape } from '../../../src/ui/atoms/Landscape';
import { LevelRibbon } from '../../../src/ui/atoms/LevelRibbon';
import { Walker } from '../../../src/ui/atoms/Walker';
import { HomeScreen } from '../../../src/ui/containers/HomeScreen';
import { Scene } from '../../../src/ui/organisms/Scene';
import type { AvatarView } from '../../../src/ui/presenters/avatar';
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
		expect(html).toContain('<g class="dromos-walker is-runner" transform=');
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

	// home-header S6: "podrias mejorar al corredor, pongamoslo mejorcito".
	it('is a pilgrim runner: a mantle with folds and a hem, a satchel on its strap, sandals, a face, and the lamp in a lantern on the staff', () => {
		const html = renderToStaticMarkup(
			<svg>
				<Walker fraction={0.3} />
			</svg>,
		);

		for (const part of ['dromos-scene-mantle', 'dromos-scene-fold', 'dromos-scene-hem', 'dromos-scene-satchel', 'dromos-scene-strap', 'dromos-scene-sandal', 'dromos-scene-skin', 'dromos-scene-eye', 'dromos-scene-lantern', 'dromos-scene-lamp-glow']) {
			expect(html, part).toContain(`class="${part}"`);
		}
		expect(walkerAt(html)).toBe(walkerTransform(walkerPlacement(0.3)));
	});

	it('wears a sash the wind stirs, inside the body so it steps and breathes with it, and holds still as the life of the scene does', () => {
		const html = renderToStaticMarkup(
			<svg>
				<Walker fraction={null} />
			</svg>,
		);

		expect(html).toMatch(/<g class="dromos-walker-body"><g class="dromos-scene-figure">.*<g class="dromos-walker-sash dromos-scene-life"><path class="dromos-scene-sash"/);
	});
});

// M11 S1: "el que esta en el paisaje tambien cambie conforme a eso".
describe('Walker grows with the character (M11 S1)', () => {
	const walker = (avatar?: AvatarView, fraction: number | null = null): string =>
		renderToStaticMarkup(
			<svg>
				<Walker fraction={fraction} avatar={avatar} />
			</svg>,
		);
	/** The lantern's light: where it hangs on the staff. */
	const lampAt = (html: string): string | undefined => /<circle class="dromos-scene-lamp" cx="([^"]+)" cy="([^"]+)"/.exec(html)?.slice(1).join(' ');

	it('is the young runner by default, carrying nothing', () => {
		const html = walker();

		expect(html).toContain('<g class="dromos-walker is-runner" transform=');
		expect(html).not.toContain('dromos-avatar-thing');
		expect(walker({ stage: 'runner', objects: [] })).toBe(html);
	});

	it('draws the stage it is given, in its clothes: the runner, the traveller in his hat, the sage with his white beard', () => {
		const runner = walker({ stage: 'runner', objects: [] });
		const traveller = walker({ stage: 'traveller', objects: [] });
		const sage = walker({ stage: 'sage', objects: [] });

		expect(traveller).toContain('<g class="dromos-walker is-traveller" transform=');
		expect(sage).toContain('<g class="dromos-walker is-sage" transform=');
		expect(traveller).toContain('class="dromos-scene-felt"');
		expect(runner).not.toContain('dromos-scene-felt');
		expect(sage).toContain('class="dromos-scene-white"');
		expect(runner).not.toContain('dromos-scene-white');
		expect(new Set([runner, traveller, sage]).size).toBe(3);
	});

	it('keeps its place on the road, its shadow, its breath and the lantern at every stage', () => {
		for (const stage of ['runner', 'traveller', 'elder', 'sage'] as const) {
			const html = walker({ stage, objects: [] }, 0.4);

			expect(walkerAt(html), stage).toBe(walkerTransform(walkerPlacement(0.4)));
			expect(html, stage).toMatch(/<ellipse class="dromos-scene-shadow"[^>]*><\/ellipse><g class="dromos-walker-body"><g class="dromos-scene-figure"><circle class="dromos-scene-lamp-glow"/);
			for (const part of ['dromos-scene-staff', 'dromos-scene-lantern', 'dromos-scene-lamp', 'dromos-scene-head', 'dromos-scene-robe']) expect(html, `${stage} ${part}`).toContain(`class="${part}`);
		}
	});

	it('hangs the lantern higher where the staff grows, at the elder and the sage', () => {
		expect(lampAt(walker())).toBe('25.6 -58.4');
		expect(lampAt(walker({ stage: 'counsellor', objects: [] }))).toBe('25.6 -58.4');
		expect(lampAt(walker({ stage: 'elder', objects: [] }))).toBe('25.6 -62.4');
		expect(lampAt(walker({ stage: 'sage', objects: [] }))).toBe('25.6 -62.4');
	});

	it('wears the sash the wind stirs while its mantle hangs open, and loses it under the himation', () => {
		expect(walker({ stage: 'apprentice', objects: [] })).toContain('<g class="dromos-walker-sash dromos-scene-life">');
		expect(walker({ stage: 'student', objects: [] })).not.toContain('dromos-walker-sash');
	});

	it('draws each object at its spot, the same spot for two skills that share it', () => {
		const html = walker({ stage: 'runner', objects: ['atleta', 'centinela', 'lector'] });

		expect(html).toContain('<g transform="translate(0.4 -61.4) rotate(14) scale(0.5)"><g class="dromos-avatar-thing is-atleta">');
		expect(html).toContain('<g transform="translate(-11.4 -40.6) scale(0.32 0.5)"><g class="dromos-avatar-thing is-centinela">');
		expect(html).toContain('<g transform="translate(9 -32.4) rotate(22) scale(0.5)"><g class="dromos-avatar-thing is-lector">');
		expect(walker({ stage: 'runner', objects: ['maestro'] })).toContain('<g transform="translate(6.6 -46.4) scale(0.36)"><g class="dromos-avatar-thing is-maestro">');
		expect(walker({ stage: 'runner', objects: ['reposo'] })).toContain('<g transform="translate(6.6 -46.4) scale(0.36)"><g class="dromos-avatar-thing is-reposo">');
	});

	it('draws nothing for a skill without an object', () => {
		expect(walker({ stage: 'runner', objects: ['juggler'] })).toBe(walker());
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

	it('draws the runner on the road by default, and the character it is given (M11 S1)', () => {
		expect(scene()).toContain('<g class="dromos-walker is-runner" transform=');

		const html = scene({ walker: 0.35, avatar: { stage: 'scholar', objects: ['exegeta'] } });

		expect(html).toContain('<g class="dromos-walker is-scholar" transform=');
		expect(html).toContain('<g class="dromos-avatar-thing is-exegeta">');
		expect(walkerAt(html)).toBe(walkerTransform(walkerPlacement(0.35)));
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
