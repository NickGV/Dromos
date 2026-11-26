import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NO_SCENE_ART, NO_WALKER_ART, STAGE_IDS, type LandscapePainting, type WalkerArt } from '../../../src/domain';
import { Landscape } from '../../../src/ui/atoms/Landscape';
import { Walker } from '../../../src/ui/atoms/Walker';
import { walkerAnchor } from '../../../src/ui/atoms/avatar/anchors';
import { STAGE_LOOKS } from '../../../src/ui/atoms/avatar/looks';
import { OBJECT_FRAME } from '../../../src/ui/atoms/avatar/SkillObject';
import { WALKER_FRAME } from '../../../src/ui/atoms/avatar/WalkerFigure';
import { HomeScreen } from '../../../src/ui/containers/HomeScreen';
import { Scene } from '../../../src/ui/organisms/Scene';
import type { AvatarView } from '../../../src/ui/presenters/avatar';
import { landscapeArtView } from '../../../src/ui/presenters/landscapeArtView';
import { HOUR_GRADES, gradeMatrix, walkerArtView, type WalkerPaintingView } from '../../../src/ui/presenters/walkerArtView';
import { homeDeps, noop } from './homeDeps';

const css = readFileSync(new URL('../../../styles.css', import.meta.url), 'utf8');

const landscape: LandscapePainting = { light: 'app://v/landscape-light.webp', dark: 'app://v/landscape-dark.webp', lightVideo: null, darkVideo: null, dawn: null, dusk: null, dawnVideo: null, duskVideo: null };
const art: WalkerArt = {
	stages: { runner: 'app://v/walker-runner.webp', sage: 'app://v/walker-sage.webp' },
	objects: { centinela: 'app://v/object-centinela.webp', maestro: 'app://v/object-maestro.webp', atleta: 'app://v/object-atleta.webp' },
};
const RUNNER_WITH_THREE: AvatarView = { stage: 'runner', objects: ['centinela', 'lector', 'maestro'] };

const walker = (avatar: AvatarView, painting?: WalkerPaintingView | null): string =>
	renderToStaticMarkup(
		<svg>
			<Walker fraction={0.4} avatar={avatar} painting={painting} />
		</svg>,
	);
const scene = (props: Partial<Parameters<typeof Scene>[0]> = {}): string => renderToStaticMarkup(<Scene screen="home" offline={false} onGo={noop} onSettings={null} walker={0.4} {...props} />);

const frame = ({ x, y, width, height }: { x: number; y: number; width: number; height: number }): string => `x="${x}" y="${y}" width="${width}" height="${height}"`;

describe('The painted walker (landscape-art S9)', () => {
	it('draws a painted stage as its painting in the frame every stage shares, inside the body that walks and breathes, beside the drawn figure', () => {
		const html = walker({ stage: 'runner', objects: [] }, walkerArtView(art, { stage: 'runner', objects: [] }));

		expect(WALKER_FRAME).toEqual({ x: -20, y: -74, width: 52, height: 78 });
		expect(html).toContain('<g class="dromos-walker is-runner is-painted" transform=');
		expect(html).toMatch(
			new RegExp(
				`<ellipse class="dromos-scene-shadow"[^>]*></ellipse><g class="dromos-walker-body"><g class="dromos-scene-figure">.*</g><g class="dromos-walker-painted"><image class="dromos-walker-painting" href="app://v/walker-runner.webp" ${frame(WALKER_FRAME)}></image><circle class="dromos-scene-lamp-glow" cx="25.6" cy="-58.4" r="10"></circle></g></g></g></svg>$`,
			),
		);
	});

	it('keeps the lantern\'s warm glow over the painted lantern, higher where the staff grows', () => {
		expect(walker({ stage: 'sage', objects: [] }, walkerArtView(art, { stage: 'sage', objects: [] }))).toContain(
			'<circle class="dromos-scene-lamp-glow" cx="25.6" cy="-62.4" r="10"></circle></g></g></g></svg>',
		);
	});

	it('draws a stage without its painting only as the drawn figure', () => {
		const mentor: AvatarView = { stage: 'mentor', objects: ['centinela'] };
		const html = scene({ avatar: mentor, painting: landscapeArtView(landscape, 'day'), walkerPainting: walkerArtView(art, mentor) });

		expect(html).not.toContain('dromos-walker-painted');
		expect(html).not.toContain('is-painted');
		expect(html).toBe(scene({ avatar: mentor, painting: landscapeArtView(landscape, 'day') }));
	});

	it('paints each object in the frame all objects share, at the spot the drawn object takes, and draws an object without its painting', () => {
		const html = walker(RUNNER_WITH_THREE, walkerArtView(art, RUNNER_WITH_THREE));
		const painted = html.slice(html.indexOf('<g class="dromos-walker-painted">'));
		const look = STAGE_LOOKS.runner;

		expect(OBJECT_FRAME).toEqual({ x: -18, y: -18, width: 36, height: 36 });
		expect(painted).toContain(`<g transform="${walkerAnchor(look, 'back')}"><image class="dromos-avatar-painted is-centinela" href="app://v/object-centinela.webp" ${frame(OBJECT_FRAME)}></image></g>`);
		expect(painted).toContain(`<g transform="${walkerAnchor(look, 'neck')}"><image class="dromos-avatar-painted is-maestro" href="app://v/object-maestro.webp" ${frame(OBJECT_FRAME)}></image></g>`);
		expect(painted).toContain(`<g transform="${walkerAnchor(look, 'satchel')}"><g class="dromos-avatar-thing is-lector">`);
		// The drawn figure keeps its drawn objects for the themes without a painting.
		const drawn = html.slice(0, html.indexOf('<g class="dromos-walker-painted">'));
		for (const id of ['centinela', 'lector', 'maestro']) expect(drawn, id).toContain(`<g class="dromos-avatar-thing is-${id}">`);
		expect(drawn).not.toContain('dromos-avatar-painted');
	});

	it('puts an object worn behind him, the shield on his back, before the painting, and the others over it', () => {
		const painted = walker(RUNNER_WITH_THREE, walkerArtView(art, RUNNER_WITH_THREE)).split('<g class="dromos-walker-painted">')[1] ?? '';
		const at = (part: string): number => painted.indexOf(part);

		expect(at('is-centinela')).toBeGreaterThan(-1);
		expect(at('is-centinela')).toBeLessThan(at('dromos-walker-painting'));
		expect(at('dromos-walker-painting')).toBeLessThan(at('is-lector'));
		expect(at('dromos-walker-painting')).toBeLessThan(at('is-maestro'));
		expect(at('is-maestro')).toBeLessThan(at('dromos-scene-lamp-glow'));
	});

	it('lifts the objects on the head with the bowed head of the elder and the sage, as the drawn figure does', () => {
		const sage: AvatarView = { stage: 'sage', objects: ['atleta'] };
		const html = walker(sage, walkerArtView(art, sage));

		expect(html.slice(html.indexOf('<g class="dromos-walker-painted">'))).toContain(
			`<g transform="translate(1.2 1.4)"><g transform="${walkerAnchor(STAGE_LOOKS.sage, 'head')}"><image class="dromos-avatar-painted is-atleta"`,
		);
	});

	it('leaves the walker\'s markup unchanged without the walker\'s paintings, at every stage', () => {
		for (const stage of STAGE_IDS) {
			const avatar: AvatarView = { stage, objects: ['centinela', 'lector', 'maestro'] };
			const drawn = walker(avatar);

			expect(walkerArtView(NO_WALKER_ART, avatar), stage).toBeNull();
			expect(walker(avatar, null), stage).toBe(drawn);
			expect(drawn, stage).not.toContain('dromos-walker-painted');
			expect(drawn, stage).not.toContain('is-painted');
		}
		const painted = landscapeArtView(landscape, 'night');
		expect(scene({ painting: painted, walkerPainting: null })).toBe(scene({ painting: painted }));
	});

	it('paints the walker only over the painted landscape, which it belongs to', () => {
		const runner: AvatarView = { stage: 'runner', objects: [] };
		const walkerPainting = walkerArtView(art, runner);

		expect(scene({ avatar: runner, walkerPainting })).toBe(scene({ avatar: runner }));
		expect(scene({ avatar: runner, walkerPainting, painting: landscapeArtView(landscape, 'day') })).toContain('<image class="dromos-walker-painting" href="app://v/walker-runner.webp"');
	});
});

describe('The painted walker\'s light of the hour (landscape-art S9)', () => {
	it('defines one colour-matrix filter per graded hour in the landscape\'s own defs, its url handed to the stylesheet', () => {
		for (const painted of ['one', 'both'] as const) {
			const html = renderToStaticMarkup(<Landscape painted={painted} />);
			const id = /--dromos-hour-night:url\(#([\w-]+)-night\)/.exec(html)?.[1];

			expect(id, painted).toMatch(/^dromos-shade-\w+$/);
			for (const [hour, grade] of Object.entries(HOUR_GRADES)) {
				expect(html, `${painted} ${hour}`).toContain(`--dromos-hour-${hour}:url(#${id}-${hour})`);
				expect(html, `${painted} ${hour}`).toContain(
					`<filter id="${id}-${hour}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${gradeMatrix(grade)}"></feColorMatrix></filter>`,
				);
			}
		}
		expect(renderToStaticMarkup(<Landscape painted="none" />)).not.toContain('<filter');
	});
});

/** A scene showing its theme's own painting, as variant C's rules are scoped. */
const PAINTED = ':is(.theme-light .dromos-root .dromos-scene.has-art-light, body:not(.theme-light) .dromos-root .dromos-scene.has-art-dark)';

/** Every style rule of the stylesheet as selector and body, comments dropped, at-rule wrappers flattened. */
const rules = (): { selector: string; body: string }[] => {
	const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
	const found: { selector: string; body: string }[] = [];
	const walk = (block: string): void => {
		let at = 0;
		for (let open = block.indexOf('{'); open >= 0; open = block.indexOf('{', at)) {
			let depth = 0;
			let end = open;
			for (; end < block.length; end += 1) {
				if (block[end] === '{') depth += 1;
				else if (block[end] === '}' && (depth -= 1) === 0) break;
			}
			const prelude = block.slice(at, open).trim();
			const body = block.slice(open + 1, end);
			if (prelude.startsWith('@media') || prelude.startsWith('@supports')) walk(body);
			else if (!prelude.startsWith('@')) found.push({ selector: prelude, body });
			at = end + 1;
		}
	};
	walk(text);
	return found;
};

describe('The painted walker in the stylesheet (landscape-art S9)', () => {
	const all = rules();
	const bodyOf = (selector: string): string => all.find((rule) => rule.selector === selector)?.body ?? '';

	it('shows the painting only where the scene shows its theme\'s painting, and the drawn figure everywhere else', () => {
		expect(bodyOf('.dromos-root .dromos-walker-painted')).toContain('display: none');
		expect(bodyOf(`${PAINTED} .dromos-walker-painted`)).toContain('display: inline');
		expect(bodyOf(`${PAINTED} .dromos-walker.is-painted .dromos-scene-figure`)).toContain('display: none');
		for (const { selector, body } of all.filter((rule) => rule.selector.includes('walker-painted') || rule.selector.includes('is-painted'))) {
			if (selector === '.dromos-root .dromos-walker-painted') continue;
			expect(selector.startsWith(':is(.theme-light .dromos-root .dromos-scene.has-art-light') || selector.startsWith('.theme-light .dromos-root .dromos-scene.has-art-light['), selector).toBe(true);
			expect(body, selector).not.toMatch(/(^|[\s;])animation(-name)?\s*:/);
		}
	});

	it('grades the painted images by the scene\'s period, the dark theme\'s always night, and filters nothing else that moves', () => {
		const filtered = all.filter(({ body }) => /(^|[\s;])filter\s*:/.test(body));
		const moving = filtered.filter(({ selector }) => /walker|campfire|scene-life|scene-figure/.test(selector));

		expect(moving.map(({ selector, body }) => [selector, /(?:^|[\s;])filter\s*:\s*([^;]+)/.exec(body)?.[1]?.trim()])).toEqual([
			[".theme-light .dromos-root .dromos-scene.has-art-light[data-period='dawn'] .dromos-walker-painted image", 'var(--dromos-hour-dawn)'],
			[".theme-light .dromos-root .dromos-scene.has-art-light[data-period='dusk'] .dromos-walker-painted image", 'var(--dromos-hour-dusk)'],
			[":is(.theme-light .dromos-root .dromos-scene.has-art-light[data-period='night'], body:not(.theme-light) .dromos-root .dromos-scene.has-art-dark) .dromos-walker-painted image", 'var(--dromos-hour-night)'],
		]);
	});
});

describe('HomeScreen: the painted walker found in the vault (landscape-art S9)', () => {
	it('reads the walker\'s paintings and paints the walker of the character\'s stage over the painted landscape', () => {
		const deps = homeDeps();
		const asked: (readonly string[])[] = [];
		const html = renderToStaticMarkup(
			<HomeScreen
				deps={{
					...deps,
					sceneArt: { execute: () => ({ ...NO_SCENE_ART, landscape }) },
					walkerArt: {
						walker: (ids) => {
							asked.push(ids);
							return art;
						},
					},
				}}
			/>,
		);

		expect(html).toContain('<g class="dromos-walker is-runner is-painted"');
		expect(html).toContain(`<image class="dromos-walker-painting" href="app://v/walker-runner.webp" ${frame(WALKER_FRAME)}></image>`);
		expect(asked[0]).toHaveLength(14);
	});

	it('draws the walker as before without them', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={{ ...homeDeps(), sceneArt: { execute: () => ({ ...NO_SCENE_ART, landscape }) } }} />);

		expect(html).toContain('<g class="dromos-walker is-runner"');
		expect(html).not.toContain('dromos-walker-painted');
	});
});
