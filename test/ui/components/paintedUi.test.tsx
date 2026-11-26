import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Character } from '../../../src/domain';
import { createTranslator } from '../../../src/i18n';
import { StatRadar } from '../../../src/ui/atoms/StatRadar';
import { characterCardView } from '../../../src/ui/presenters/characterCardView';

const css = readFileSync(new URL('../../../styles.css', import.meta.url), 'utf8');

interface StyleRule {
	readonly selector: string;
	readonly body: string;
	/** The at-rule the style rule sits in (`@container …`, `@media …`), `null` at the top level. */
	readonly at: string | null;
}

/** Every style rule of the stylesheet, comments left out, with the at-rule each sits in; keyframes are skipped. */
const rulesOf = (source: string): StyleRule[] => {
	const text = source.replace(/\/\*[\s\S]*?\*\//g, '');
	const rules: StyleRule[] = [];
	const walk = (from: number, to: number, at: string | null): void => {
		let start = from;
		for (let i = from; i < to; i += 1) {
			if (text[i] === ';' && text.slice(start, i).trim().startsWith('@')) {
				start = i + 1;
				continue;
			}
			if (text[i] !== '{') continue;
			const prelude = text.slice(start, i).trim();
			let depth = 1;
			let j = i + 1;
			for (; j < to && depth > 0; j += 1) {
				if (text[j] === '{') depth += 1;
				else if (text[j] === '}') depth -= 1;
			}
			const inner = text.slice(i + 1, j - 1);
			if (prelude.startsWith('@')) {
				if (!prelude.startsWith('@keyframes') && !prelude.startsWith('@font-face')) walk(i + 1, j - 1, prelude);
			} else rules.push({ selector: prelude.replace(/\s+/g, ' '), body: inner, at });
			start = j;
			i = j - 1;
		}
	};
	walk(0, text.length, null);
	return rules;
};

const RULES = rulesOf(css);

/** The bodies of the top-level rules whose whole selector is `selector`, joined. */
const bodyOf = (selector: string): string =>
	RULES.filter((rule) => rule.at === null && rule.selector === selector)
		.map((rule) => rule.body)
		.join('\n');

/** A token's last hex value in a theme's root rules: night `.dromos-root`, day `.theme-light .dromos-root`. */
const tokenOf = (theme: 'night' | 'day', name: string): string => {
	const block = theme === 'night' ? bodyOf('.dromos-root') : `${bodyOf('.dromos-root')}\n${bodyOf('.theme-light .dromos-root')}`;
	const values = [...block.matchAll(new RegExp(`--dromos-${name}:\\s*(#[0-9a-f]{6}|rgba\\([^)]*\\));`, 'g'))].map((match) => match[1] ?? '');
	const value = values.at(-1);
	if (!value) throw new Error(`no --dromos-${name} for ${theme}`);
	return value;
};

type Rgba = readonly [number, number, number, number];
const rgbaOf = (value: string): Rgba => {
	if (value.startsWith('#')) return [Number.parseInt(value.slice(1, 3), 16), Number.parseInt(value.slice(3, 5), 16), Number.parseInt(value.slice(5, 7), 16), 1];
	const [r = 0, g = 0, b = 0, a = 1] = value.replace(/rgba\(|\)/g, '').split(',').map(Number);
	return [r, g, b, a];
};
/** `top` laid over the opaque `under`. */
const over = (top: Rgba, under: Rgba): Rgba => [0, 1, 2].map((i) => top[3] * (top[i] ?? 0) + (1 - top[3]) * (under[i] ?? 0)).concat(1) as unknown as Rgba;
const luminance = ([r, g, b]: Rgba): number => {
	const [lr = 0, lg = 0, lb = 0] = [r, g, b].map((c) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
};
const contrast = (a: Rgba, b: Rgba): number => {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
};
const tone = (theme: 'night' | 'day', name: string): Rgba => rgbaOf(tokenOf(theme, name));

// painted-ui S3: "ponerle algun otro fondo como tal de la aplicacion, no el de arriba sino el de abajo"; the user chose A, "Camino".
describe('The app\'s ground below the scene (painted-ui S3, S7)', () => {
	it('lays the view on the road\'s earth, its texture attached to the scroller so scrolling stays composited', () => {
		const ground = bodyOf('.dromos-root.view-content');

		expect(ground).toContain('background-color: var(--dromos-ground);');
		expect(ground).toContain('background-image: var(--dromos-ground-image);');
		expect(ground).toMatch(/background-attachment:\s*local;/);
		for (const theme of ['night', 'day'] as const) {
			expect(tokenOf(theme, 'ground')).toMatch(/^#[0-9a-f]{6}$/);
			expect(theme === 'night' ? bodyOf('.dromos-root') : bodyOf('.theme-light .dromos-root')).toMatch(/--dromos-ground-image:\s*var\(--dromos-ground-speck-/);
		}
	});

	it('tears the scene\'s foot into the ground instead of ending it on a hard line', () => {
		const seam = bodyOf('.dromos-root .dromos-scene::after');

		expect(seam).toContain('background-color: var(--dromos-ground);');
		expect(seam).toContain('clip-path: var(--dromos-seam-edge);');
		expect(bodyOf('.dromos-root .dromos-scene')).not.toMatch(/border-bottom\s*:/);
	});
});

// painted-ui S5: "Un solo lenguaje de card".
describe('One card language (painted-ui S5)', () => {
	it('shapes sheets, tags, bars and seals from three radii and four lifts, each one used', () => {
		const tokens = ['radius-sheet', 'radius-tag', 'radius-bar', 'radius-round', 'lift-sheet', 'lift-hung', 'lift-tag', 'lift-roll'];
		const root = bodyOf('.dromos-root');

		for (const token of tokens) {
			expect(root, token).toMatch(new RegExp(`--dromos-${token}:`));
			expect(RULES.filter((rule) => rule.body.includes(`var(--dromos-${token})`) && !rule.body.includes(`--dromos-${token}:`)).length, token).toBeGreaterThan(0);
		}
		expect(bodyOf('.dromos-root .dromos-btn, .dromos-root .dromos-sync-button, .dromos-root .dromos-send-button, .dromos-root .dromos-link-button, .dromos-root .dromos-briefing-request')).toMatch(
			/border-radius: var\(--dromos-radius-tag\);[\s\S]*box-shadow: var\(--dromos-lift-tag\);/,
		);
	});

	it('draws every card as a sheet of papyrus with a deckled, frayed edge and a lift, and no hairline box', () => {
		const sheet = bodyOf('.dromos-root .dromos-panel:not(.dromos-library-scene), .dromos-root .dromos-card:not(.dromos-briefing)');
		const papyrus = bodyOf('.dromos-root .dromos-panel:not(.dromos-library-scene)::after, .dromos-root .dromos-card:not(.dromos-briefing)::after');

		expect(sheet).toMatch(/border: 0;/);
		expect(sheet).toContain('border-radius: var(--dromos-radius-sheet);');
		expect(sheet).toContain('box-shadow: var(--dromos-lift-sheet);');
		expect(papyrus).toContain('background-color: var(--dromos-sheet);');
		expect(papyrus).toContain('var(--dromos-sheet-edges)');
		expect(papyrus).toContain('clip-path: var(--dromos-deckle);');
	});

	it('keeps a sheet apart from the ground in both themes, by its tone and by its frayed edge', () => {
		for (const theme of ['night', 'day'] as const) {
			const sheet = tone(theme, 'sheet');
			const ground = tone(theme, 'ground');
			const edge = over(tone(theme, 'sheet-edge'), sheet);

			expect(contrast(sheet, ground), `${theme} sheet on ground`).toBeGreaterThanOrEqual(1.4);
			expect(Math.max(contrast(edge, ground), contrast(edge, sheet)), `${theme} edge`).toBeGreaterThanOrEqual(2);
		}
	});

	it('keeps text at 4.5:1 or more on the surface it sits on, in both themes (S6)', () => {
		const pairs: readonly (readonly [string, string])[] = [
			['ink', 'sheet'],
			['ink-muted', 'sheet'],
			['ink', 'ground'],
			['ink-muted', 'ground'],
			['ochre-ink', 'sheet'],
			['olive-ink', 'sheet'],
			['clay-ink', 'sheet'],
			['ink-warning', 'sheet'],
			['ink', 'tag'],
			['on-ochre', 'ochre'],
			['wood-ink', 'wood-face'],
			['wood-ink', 'wood-face-alt'],
			['wood-ink', 'wood-hover'],
			['wood-burnt-ink', 'wood-burnt'],
			['ink', 'wood'],
			['ink-muted', 'wood'],
		];
		for (const theme of ['night', 'day'] as const) {
			for (const [text, surface] of pairs) expect(contrast(tone(theme, text), tone(theme, surface)), `${theme} ${text} on ${surface}`).toBeGreaterThanOrEqual(4.5);
			for (const surface of ['ground', 'wood']) expect(contrast(tone(theme, 'tab-selected'), tone(theme, surface)), `${theme} chosen tab's underline on ${surface}`).toBeGreaterThanOrEqual(3);
		}
	});

	it('keeps the Shop\'s detail in view while the wares scroll: its sticky rule outranks the sheet\'s position (S6)', () => {
		const sticky = RULES.find((rule) => rule.selector === '.dromos-root .dromos-panel.dromos-ware-detail');

		expect(sticky?.body).toMatch(/position: sticky;/);
		expect(bodyOf('.dromos-root .dromos-panel:not(.dromos-library-scene), .dromos-root .dromos-card:not(.dromos-briefing)')).toContain('position: relative;');
	});

	it('hangs the screen\'s name as a wooden sign, with a visible focus ring on its title (S4, S6)', () => {
		const sign = bodyOf('.dromos-root .dromos-screen-header');

		expect(sign).toContain('border: 1.5px solid var(--dromos-wood-rim);');
		expect(sign).toContain('var(--dromos-wood-face)');
		expect(bodyOf('.dromos-root .dromos-screen-title')).toContain('color: var(--dromos-wood-ink);');
		expect(bodyOf('.dromos-root [data-screen-heading]:focus-visible')).toContain('outline: 2px solid var(--dromos-focus);');
	});

	it('draws the radar\'s labels large enough to read on a phone: their small caps about 10 px tall at 360 px', () => {
		const character: Character = { name: 'Nick', title: 'Corredor', level: 6, totalXp: 1840, xpIntoLevel: 210, xpToNext: 420, stats: { fuerza: 3, vitalidad: 5, inteligencia: 9, sabiduria: 7, espiritu: 6, disciplina: 8 }, gameStart: null };
		const html = renderToStaticMarkup(<StatRadar view={characterCardView(character, createTranslator('en')).radar} />);
		const viewBoxWidth = Number(/viewBox="0 0 (\d+)/.exec(html)?.[1]);
		const fontSize = Number(/font-size: (\d+(?:\.\d+)?)px;/.exec(bodyOf('.dromos-root .dromos-radar-text'))?.[1]);
		const phone = RULES.find((rule) => rule.at === '@container dromos-view (max-width: 373px)' && rule.selector === '.dromos-root .dromos-radar');
		const phoneWidth = Number(/width: (\d+)px;/.exec(phone?.body ?? '')?.[1]);

		// EB Garamond's small caps stand about 0.476 em tall, measured on the rendered labels.
		expect(0.476 * fontSize * (phoneWidth / viewBoxWidth)).toBeGreaterThanOrEqual(10);
	});
});

// painted-ui S7: the restyle adds no measurable cost.
describe('The painted surfaces cost nothing that moves (painted-ui S7)', () => {
	const PAINTED = /\.view-content|dromos-scene::after|dromos-panel|dromos-card|dromos-screen-header|dromos-plank|dromos-signpost|dromos-campaign-cards|dromos-task-groups|dromos-stage-modal/;
	const MOVES = /(^|[\s;])(animation|animation-name)\s*:\s*(?!none)/;
	const FILTERS = /(^|[\s;])(filter|backdrop-filter|mask|mask-image|-webkit-mask-image)\s*:\s*(?!none)/;
	/** The last compound of each selector in a list, its pseudo-classes and pseudo-elements left out. */
	const targetsOf = (selector: string): string[] => selector.split(',').map((one) => (one.trim().split(/\s|>|\+|~/).filter(Boolean).at(-1) ?? '').replace(/::?[a-z-]+(\([^)]*\))?/g, ''));

	it('neither animates nor filters nor masks the ground, the sheets, the sign or the signpost', () => {
		const painted = RULES.filter((rule) => PAINTED.test(rule.selector));

		expect(painted.length).toBeGreaterThan(20);
		for (const { selector, body } of painted) {
			expect(body, selector).not.toMatch(FILTERS);
			if (!/dromos-ceremony|dromos-spinner/.test(selector)) expect(body, selector).not.toMatch(MOVES);
		}
	});

	it('puts no filter on anything that is animated', () => {
		const animated = new Set(RULES.filter((rule) => MOVES.test(rule.body)).flatMap((rule) => targetsOf(rule.selector)));
		const filtered = RULES.filter((rule) => FILTERS.test(rule.body)).flatMap((rule) => targetsOf(rule.selector));

		expect(animated.size).toBeGreaterThan(10);
		for (const target of filtered) expect(animated.has(target), target).toBe(false);
	});
});
