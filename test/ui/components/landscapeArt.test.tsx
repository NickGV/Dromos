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

/** What the drawn landscape is made of: none of it is drawn over a painting in both themes. */
const DRAWN = ['<defs>', 'dromos-scene-sky', 'dromos-scene-ridge', 'dromos-scene-hill', 'dromos-scene-village', 'dromos-scene-road', 'dromos-scene-mill', 'dromos-scene-shepherd', 'dromos-scene-lion', 'dromos-scene-flowers', 'dromos-scene-fireflies', 'dromos-scene-stars', 'dromos-scene-drift', 'dromos-scene-cypress'];

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
		expect(painted).toMatch(/<div class="dromos-landscape-art" aria-hidden="true"><\/div><svg class="dromos-landscape" viewBox="0 0 960 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><g class="dromos-scene-gate" /);
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
