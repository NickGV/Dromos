import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NO_SCENE_ART } from '../../../src/domain';
import { createTranslator } from '../../../src/i18n';
import { BookCard } from '../../../src/ui/organisms/BookCard';
import { ResourceCard } from '../../../src/ui/organisms/ResourceCard';
import { bookCardView } from '../../../src/ui/presenters/bookCardView';
import { resourceCardView } from '../../../src/ui/presenters/resourceCardView';
import { sceneArtView } from '../../../src/ui/presenters/sceneArtView';
import { aBook } from '../../fakes/books';
import { aResource } from '../../fakes/resources';
import { noop, renderNothing } from './homeDeps';

const css = readFileSync(new URL('../../../styles.css', import.meta.url), 'utf8');

/** The declarations of the rule whose selector starts a line of the stylesheet exactly as given. */
const ruleOf = (selector: string, source = css): string => {
	const at = source.indexOf(`\n${selector} {`);
	if (at < 0) return '';
	const open = source.indexOf('{', at + selector.length);
	return source.slice(open + 1, source.indexOf('}', open));
};

/** The bodies of every `@media` block with this condition, one after another. */
const mediaBlock = (condition: string): string => {
	const bodies: string[] = [];
	for (let at = css.indexOf(`@media ${condition} {`); at >= 0; at = css.indexOf(`@media ${condition} {`, at + 1)) {
		const open = css.indexOf('{', at);
		let depth = 0;
		for (let index = open; index < css.length; index += 1) {
			if (css[index] === '{') depth += 1;
			if (css[index] === '}') depth -= 1;
			if (depth === 0) {
				bodies.push(css.slice(open + 1, index));
				break;
			}
		}
	}
	return bodies.join('\n');
};

// A painted scene at night in the light theme: inside the Library's room, or carrying the hour itself
// (the Shop's stall, a card in its modal).
const NIGHT = ".theme-light .dromos-root :is(.dromos-library[data-period='night'] .dromos-library-scene, .dromos-library-scene[data-period='night'])";

describe('the paintings follow the night in the light theme (night-illustrations S1-S3)', () => {
	it('shows the dark painting of a scene that has one', () => {
		expect(ruleOf(`${NIGHT}.has-art-dark > .is-background`)).toContain('background-image: var(--dromos-art-dark)');
	});

	it('hides the drawing under the dark painting, but keeps the rods of a card', () => {
		expect(ruleOf(`${NIGHT}.has-art-dark:not(.is-card) > .is-drawing`)).toContain('display: none');
	});

	it('hides the light loop wherever the dark painting shows', () => {
		expect(ruleOf(`${NIGHT}.has-art-dark .dromos-scene-video.is-light`)).toContain('display: none');
	});

	it('plays the dark loop at night only when motion is allowed (S4)', () => {
		const allowed = mediaBlock('(prefers-reduced-motion: no-preference)');
		expect(ruleOf(`\t${NIGHT}.has-art-dark .dromos-scene-video.is-dark`, allowed)).toContain('display: block');
		expect(ruleOf(`${NIGHT}.has-art-dark .dromos-scene-video.is-dark`)).toBe('');
	});

	it('draws the focus ring that falls on a dark painting in the dark theme\'s focus color (V1 advisory)', () => {
		const rings = ':is(button.dromos-alcove, button.dromos-desk-scroll, button.dromos-shelf-scroll, button.dromos-archive-door, button.dromos-pigeonhole):focus-visible';
		expect(ruleOf(`${NIGHT}.has-art-dark ${rings}`)).toContain('outline-color: #e8c98a');
	});

	it('leaves a scene with only a light painting, and every rule of the day, as they were', () => {
		expect(css).not.toContain(`${NIGHT}.has-art-light`);
		expect(ruleOf('.theme-light .dromos-root .dromos-library-scene.has-art-light > .is-background')).toContain('background-image: var(--dromos-art-light)');
	});
});

describe('the cards take the hour to their modal (night-illustrations S2)', () => {
	const es = createTranslator('es');
	const desk = sceneArtView({ ...NO_SCENE_ART, desk: { light: 'app://v/desk-light.webp', dark: 'app://v/desk-dark.webp', lightVideo: null, darkVideo: null } }).desk;

	it('marks a book card with the time of day it opened at', () => {
		const html = renderToStaticMarkup(
			<BookCard view={bookCardView(aBook({ path: 'B/x.md', title: 'X' }), '2026-11-09', es, { start: true, finish: true }, null)} busy={null} onStart={noop} onFinish={noop} onOpenNote={noop} renderMarkdown={renderNothing} painting={desk} period="night" />,
		);
		expect(html).toContain('data-scene="card" data-period="night"');
	});

	it('marks a resource card the same way', () => {
		const html = renderToStaticMarkup(
			<ResourceCard view={resourceCardView(aResource({ path: 'R/x.md' }), '2026-11-10', es, true, null)} busy={false} onMark={noop} onOpenNote={noop} renderMarkdown={renderNothing} painting={desk} period="night" />,
		);
		expect(html).toContain('data-scene="card" data-period="night"');
	});
});
