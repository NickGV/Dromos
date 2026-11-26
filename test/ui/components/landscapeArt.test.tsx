import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NO_SCENE_ART, type LandscapePainting } from '../../../src/domain';
import { Landscape } from '../../../src/ui/atoms/Landscape';
import { HomeScreen } from '../../../src/ui/containers/HomeScreen';
import { Scene } from '../../../src/ui/organisms/Scene';
import { landscapeArtView } from '../../../src/ui/presenters/landscapeArtView';
import { homeDeps, noop } from './homeDeps';

const css = readFileSync(new URL('../../../styles.css', import.meta.url), 'utf8');
const scene = (props: Partial<Parameters<typeof Scene>[0]> = {}): string => renderToStaticMarkup(<Scene screen="home" offline={false} onGo={noop} onSettings={null} {...props} />);
const paintings = (overrides: Partial<LandscapePainting> = {}): LandscapePainting => ({
	light: 'app://v/landscape-light.webp',
	dark: 'app://v/landscape-dark.webp',
	lightVideo: null,
	darkVideo: null,
	dawn: null,
	dusk: null,
	dawnVideo: null,
	duskVideo: null,
	...overrides,
});

/** The body of the rule whose selector list holds `selector` on a line of its own, '' without one. */
const ruleOf = (selector: string): string => {
	const at = css.indexOf(`\n${selector}`);
	if (at < 0) return '';
	const open = css.indexOf('{', at);
	return css.slice(open + 1, css.indexOf('}', open));
};

/** Where the brace opened at `open` in `source` closes. */
const closing = (source: string, open: number): number => {
	let depth = 0;
	for (let at = open; at < source.length; at += 1) {
		if (source[at] === '{') depth += 1;
		else if (source[at] === '}' && (depth -= 1) === 0) return at;
	}
	return source.length;
};

/** The inside of the first block `prelude` opens in the stylesheet, '' without one. */
const blockOf = (prelude: string): string => {
	const at = css.indexOf(prelude);
	if (at < 0) return '';
	const open = css.indexOf('{', at);
	return css.slice(open + 1, closing(css, open));
};

interface StyleRule {
	readonly selector: string;
	readonly body: string;
	/** The `@media` query the rule sits in, `null` for none. */
	readonly media: string | null;
}

/** The style rules of a block, with the media query each sits in; keyframes are left out. */
const rulesOf = (block: string, media: string | null = null): StyleRule[] => {
	const text = block.replace(/\/\*[\s\S]*?\*\//g, '');
	const rules: StyleRule[] = [];
	for (let at = 0, open = text.indexOf('{'); open >= 0; open = text.indexOf('{', at)) {
		const end = closing(text, open);
		const prelude = text.slice(at, open).trim();
		const body = text.slice(open + 1, end);
		if (prelude.startsWith('@media')) rules.push(...rulesOf(body, prelude));
		else if (!prelude.startsWith('@keyframes')) rules.push({ selector: prelude, body, media });
		at = end + 1;
	}
	return rules;
};

/** A selector list split at its top-level commas. */
const selectorsOf = (list: string): string[] => {
	const parts: string[] = [];
	let depth = 0;
	let start = 0;
	for (let at = 0; at < list.length; at += 1) {
		if (list[at] === '(') depth += 1;
		else if (list[at] === ')') depth -= 1;
		else if (list[at] === ',' && depth === 0) {
			parts.push(list.slice(start, at).trim());
			start = at + 1;
		}
	}
	return [...parts, list.slice(start).trim()];
};

/** The selectors a rule stands for: each of its selectors, the `:is()` one starts with spelled out. */
const expandedOf = (selector: string): string[] =>
	selectorsOf(selector).flatMap((part) => {
		if (!part.startsWith(':is(')) return [part];
		let depth = 0;
		let at = 3;
		do {
			if (part[at] === '(') depth += 1;
			else if (part[at] === ')') depth -= 1;
			at += 1;
		} while (depth > 0 && at < part.length);
		return selectorsOf(part.slice(4, at - 1)).map((scope) => `${scope}${part.slice(at)}`);
	});

/** A scene showing its theme's own painting: the light theme's light painting, or the dark theme's dark one. */
const LIGHT_PAINTED = '.theme-light .dromos-root .dromos-scene.has-art-light';
const DARK_PAINTED = 'body:not(.theme-light) .dromos-root .dromos-scene.has-art-dark';
const PAINTED_SCENE = /^(?:\.theme-light \.dromos-root \.dromos-scene\.has-art-light|body:not\(\.theme-light\) \.dromos-root \.dromos-scene\.has-art-dark)(?=[\s[])/;

/** The figures' restyle over a painting (S8), in one block that browsers without `color-mix()` skip. */
const restyle = blockOf('@supports (color: color-mix(in oklab, #000, #fff))');

/** Each gradient the figures are shaded with, and whether it is a soft one, shaded less. */
const MATERIALS = { robe: false, mantle: false, skin: true, satchel: false, felt: false, grey: true, white: true, house: false, gate: false, stone: false, patch: false } as const;
const GLOWS = ['cast', 'glow', 'lamp', 'flame'] as const;

/** The view's gradient id prefix, from the url the landscape's `<svg>` hands the stylesheet for the robe. */
const shadeId = (html: string): string | undefined => /<svg class="dromos-landscape"[^>]* style="[^"]*--dromos-shade-robe:url\(#([\w-]+)-robe\)/.exec(html)?.[1];

/** What the drawn landscape is made of: none of it is drawn over a painting in both themes. */
const DRAWN = ['dromos-sky-', 'dromos-scene-sky', 'dromos-scene-ridge', 'dromos-scene-hill', 'dromos-scene-village', 'dromos-scene-road', 'dromos-scene-mill', 'dromos-scene-shepherd', 'dromos-scene-lion', 'dromos-scene-flowers', 'dromos-scene-fireflies', 'dromos-scene-stars', 'dromos-scene-drift', 'dromos-scene-cypress'];

describe('Scene without the landscape\'s paintings (landscape-art S5)', () => {
	it('draws the landscape exactly as before', () => {
		const plain = scene({ walker: 0.4, gateLabel: 'Level 6', campfire: true, period: 'dusk' });
		expect(scene({ walker: 0.4, gateLabel: 'Level 6', campfire: true, period: 'dusk', painting: null })).toBe(plain);
		expect(scene({ walker: 0.4, gateLabel: 'Level 6', campfire: true, period: 'dusk', painting: landscapeArtView(NO_SCENE_ART.landscape, 'dusk') })).toBe(plain);
		expect(plain).not.toContain('has-art');
		expect(plain).not.toContain('dromos-landscape-art');
		expect(plain).not.toContain('dromos-landscape-drawing');
		expect(renderToStaticMarkup(<Landscape painted="none" />)).toBe(renderToStaticMarkup(<Landscape />));
	});
});

describe('Scene with the landscape\'s paintings (landscape-art S1-S3)', () => {
	const painted = scene({ painting: landscapeArtView(paintings(), 'day'), walker: 0.4, gateLabel: 'Level 6', campfire: true });

	it('marks the scene with its painted themes and passes the paintings to the stylesheet (S1)', () => {
		expect(painted).toMatch(
			/^<div class="dromos-scene has-art-light has-art-dark" data-period="day" style="--dromos-art-light:url\(&quot;app:\/\/v\/landscape-light\.webp&quot;\);--dromos-art-dark:url\(&quot;app:\/\/v\/landscape-dark\.webp&quot;\)">/,
		);
		expect(scene({ offline: true, painting: landscapeArtView(paintings(), 'day') })).toMatch(/^<div class="dromos-scene is-offline has-art-light has-art-dark" data-period="day" style="/);
	});

	it('lays the painting behind the drawing, which keeps only the gate, the campfire and the walker over it (S2, S3)', () => {
		expect(painted).toMatch(/<div class="dromos-landscape-art" aria-hidden="true"><\/div><svg class="dromos-landscape" viewBox="0 0 960 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false" style="[^"]*"><defs><linearGradient [^>]*class="dromos-shade".*<\/defs><g class="dromos-scene-gate" /);
		for (const part of DRAWN) expect(painted, part).not.toContain(part);
		expect(painted).toMatch(/<\/g><g class="dromos-campfire" [^>]*>.*<g class="dromos-walker /);
		expect(painted).toContain('class="dromos-gate-plaque"');
		expect(painted).toContain('class="dromos-signpost"');
	});

	it('keeps the drawing for a theme without its painting, in one group the stylesheet hides in the painted theme (S1)', () => {
		const half = scene({ painting: landscapeArtView(paintings({ light: null }), 'day') });
		expect(half).toMatch(/^<div class="dromos-scene has-art-dark" /);
		expect(half).toMatch(/<svg class="dromos-landscape" [^>]*><defs>.*<\/defs><g class="dromos-landscape-drawing"><rect /);
		expect(half).toMatch(/<\/g><g class="dromos-scene-gate" /);
		for (const part of DRAWN) expect(half, part).toContain(part);
		expect(ruleOf('.dromos-root .dromos-scene.has-art-dark .dromos-landscape-drawing')).toContain('display: none');
		expect(ruleOf('.theme-light .dromos-root .dromos-scene.has-art-dark .dromos-landscape-drawing')).toContain('display: inline');
		expect(ruleOf('.theme-light .dromos-root .dromos-scene.has-art-light .dromos-landscape-drawing')).toContain('display: none');
	});

	it('plays a loop over its painting only, in the painting\'s layer (S3)', () => {
		expect(painted).not.toContain('<video');
		const looped = scene({ painting: landscapeArtView(paintings({ dawn: 'app://v/landscape-dawn.webp', dawnVideo: 'app://v/landscape-dawn.webm', darkVideo: 'app://v/landscape-dark.webm' }), 'dawn') });
		expect(looped).toMatch(
			/<div class="dromos-landscape-art" aria-hidden="true"><video class="dromos-scene-video is-light" src="app:\/\/v\/landscape-dawn\.webm" poster="app:\/\/v\/landscape-dawn\.webp"[^>]*><\/video><video class="dromos-scene-video is-dark" src="app:\/\/v\/landscape-dark\.webm" poster="app:\/\/v\/landscape-dark\.webp"[^>]*><\/video><\/div><svg /,
		);
	});

	it('frames the painting as the drawing is, shows each theme its own, and fades it offline', () => {
		const frame = ruleOf('.dromos-root .dromos-landscape-art {');
		expect(frame).toContain('left: calc(-1 * var(--dromos-scene-shift));');
		expect(frame).toContain('width: calc(100% + var(--dromos-scene-shift));');
		expect(frame).toContain('background-size: cover;');
		expect(frame).toContain('background-position: center bottom;');
		expect(ruleOf('.dromos-root .dromos-scene.has-art-dark > .dromos-landscape-art')).toContain('background-image: var(--dromos-art-dark)');
		expect(ruleOf('.theme-light .dromos-root .dromos-scene > .dromos-landscape-art')).toContain('background-image: none');
		expect(ruleOf('.theme-light .dromos-root .dromos-scene.has-art-light > .dromos-landscape-art')).toContain('background-image: var(--dromos-art-light)');
		expect(ruleOf('.dromos-root .dromos-landscape-art .dromos-scene-video')).toContain('object-position: center bottom');
		expect(ruleOf('.dromos-root .dromos-scene.is-offline .dromos-landscape-art')).toContain('filter: saturate(0.62) sepia(0.14)');
	});
});

describe('The drawn figures over a painting (landscape-art S8)', () => {
	it('shades the walker, the gate and the campfire with gradients of the view\'s own, lit on the left and shaded on the right, in one theme or both', () => {
		for (const painted of ['one', 'both'] as const) {
			const html = renderToStaticMarkup(<Landscape painted={painted} />);
			const id = shadeId(html);

			expect(id, painted).toMatch(/^dromos-shade-\w+$/);
			for (const [material, soft] of Object.entries(MATERIALS)) {
				expect(html, `${painted} ${material}`).toContain(
					`<linearGradient id="${id}-${material}" class="dromos-shade${soft ? ' is-soft' : ''}" x1="0" y1="0.15" x2="1" y2="0.5" style="--dromos-shade-m:var(--dromos-scene-${material})"><stop offset="0" class="is-rim"></stop><stop offset="0.16" class="is-lit"></stop><stop offset="0.42" class="is-base"></stop><stop offset="0.86" class="is-shade"></stop><stop offset="1" class="is-front"></stop></linearGradient>`,
				);
			}
			for (const glow of ['cast', 'glow', 'lamp']) expect(html, `${painted} ${glow}`).toContain(`<radialGradient id="${id}-${glow}" class="dromos-shade-${glow}">`);
			expect(html, painted).toContain(`<linearGradient id="${id}-flame" class="dromos-shade-flame" x1="0" y1="1" x2="0" y2="0">`);
			for (const name of [...Object.keys(MATERIALS), ...GLOWS]) expect(html, `${painted} ${name}`).toContain(`--dromos-shade-${name}:url(#${id}-${name})`);
		}
	});

	it('gives two views their own gradients, as two open tabs need', () => {
		const html = renderToStaticMarkup(
			<>
				<Landscape painted="both" />
				<Landscape painted="both" />
			</>,
		);
		const ids = [...html.matchAll(/<linearGradient id="([\w-]+)-robe"/g)].map(([, id]) => id);

		expect(ids).toHaveLength(2);
		expect(new Set(ids).size).toBe(2);
	});

	it('leaves the drawn landscape and its figures as they were, with no gradient and no style of its own (S5)', () => {
		const drawn = renderToStaticMarkup(<Landscape painted="none" />);
		expect(drawn).toMatch(
			/^<svg class="dromos-landscape" viewBox="0 0 960 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><defs><linearGradient id="(dromos-sky-\w+)" x1="0" y1="0" x2="0" y2="1"><stop class="dromos-scene-sky-top" offset="0"><\/stop><stop class="dromos-scene-sky-bottom" offset="1"><\/stop><\/linearGradient><\/defs><rect width="960" height="300" fill="url\(#\1\)"><\/rect>/,
		);
		expect(drawn).not.toContain('dromos-shade');

		const figures = (html: string): string => html.slice(html.indexOf('<g class="dromos-scene-gate"'), html.indexOf('</svg>'));
		const props = { walker: 0.4, gateLabel: 'Level 6', campfire: true, period: 'night', avatar: { stage: 'sage', objects: ['maestro', 'mnemonista', 'exegeta'] } } as const;
		const plain = figures(scene(props));
		expect(plain).toMatch(/^<g class="dromos-scene-gate" .*<g class="dromos-campfire" .*<g class="dromos-walker is-sage" /);
		expect(figures(scene({ ...props, painting: landscapeArtView(paintings(), 'night') }))).toBe(plain);
	});

	it('restyles them only over a painting, without a filter, and moves them only without a reduced-motion preference (S5, S8)', () => {
		const rules = rulesOf(restyle);

		expect(rules.length).toBeGreaterThan(20);
		for (const { selector, body, media } of rules) {
			for (const scoped of expandedOf(selector)) expect(scoped, selector).toMatch(PAINTED_SCENE);
			expect(body, selector).not.toMatch(/(^|[\s;])(filter|backdrop-filter)\s*:/);
			if (/(^|[\s;])animation(-name)?\s*:/.test(body)) expect(media, selector).toBe('@media (prefers-reduced-motion: no-preference)');
		}
		const outside = css.replace(restyle, '').replace(/\/\*[\s\S]*?\*\//g, '');
		expect(outside).not.toContain('--dromos-fig-');
		expect(outside).not.toContain('--dromos-shade-');

		const drawnGradients = new Set([...Object.keys(MATERIALS), ...GLOWS]);
		for (const [, name = ''] of restyle.matchAll(/var\(--dromos-shade-([a-z]+)\)/g)) if (name !== 'm') expect(drawnGradients, name).toContain(name);
	});

	it('takes the light of the hour by the scene\'s period, the dark theme\'s always night, in a fine line of each part\'s own colour (S8)', () => {
		const rules = rulesOf(restyle);
		const ruleOn = (part: string) => rules.find(({ selector }) => selector.endsWith(part))?.body ?? '';

		// The day's light, then each other hour's over it; the dark theme takes the night's, which comes later.
		expect(rules.filter(({ body }) => body.includes('--dromos-fig-light:')).map(({ selector }) => expandedOf(selector))).toEqual([
			[`${LIGHT_PAINTED} .dromos-landscape`, `${DARK_PAINTED} .dromos-landscape`],
			[`${LIGHT_PAINTED}[data-period='dawn'] .dromos-landscape`],
			[`${LIGHT_PAINTED}[data-period='dusk'] .dromos-landscape`],
			[`${LIGHT_PAINTED}[data-period='night'] .dromos-landscape`, `${DARK_PAINTED} .dromos-landscape`],
		]);
		expect(rules.find(({ selector }) => selector === `${LIGHT_PAINTED}[data-period='night'] :is(.dromos-scene-lamp, .dromos-scene-lamp-glow)`)?.body).toContain('display: inline');

		expect(ruleOn(' .dromos-shade .is-lit')).toContain('var(--dromos-fig-light)');
		expect(ruleOn(' .dromos-shade .is-shade')).toContain('var(--dromos-fig-shade)');
		expect(ruleOn(' .dromos-walker .dromos-scene-robe')).toContain('fill: var(--dromos-shade-robe) var(--dromos-scene-robe); stroke: color-mix(in oklab, var(--dromos-scene-robe), var(--dromos-fig-ink)');
		expect(ruleOn(' .dromos-walker .dromos-scene-figure')).toContain('stroke-width: var(--dromos-fig-line-w)');
		expect(restyle).toContain('--dromos-fig-line-w: 0.55;');
		expect(ruleOn(' .dromos-walker .dromos-scene-shadow')).toContain('cx: 8px');
		expect(ruleOn(' .dromos-walker .dromos-scene-staff')).toContain('stroke: var(--dromos-fig-staff)');
	});
});

describe('HomeScreen: the landscape\'s paintings found in the vault (landscape-art S1)', () => {
	it('lays them on the scene above every screen', () => {
		const deps = homeDeps();
		const art = { ...NO_SCENE_ART, landscape: paintings({ dark: null }) };
		for (const screen of ['home', 'library'] as const) {
			const html = renderToStaticMarkup(<HomeScreen deps={{ ...deps, sceneArt: { execute: () => art } }} initialScreen={screen} />);
			expect(html, screen).toMatch(/<div class="dromos-scene has-art-light" data-period="\w+" style="--dromos-art-light:url\(&quot;app:\/\/v\/landscape-light\.webp&quot;\)"><div class="dromos-landscape-art" aria-hidden="true">/);
		}
	});

	it('draws the landscape as before without them', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps()} />);
		expect(html).toMatch(/<div class="dromos-scene" data-period="\w+"><svg class="dromos-landscape" /);
	});
});
