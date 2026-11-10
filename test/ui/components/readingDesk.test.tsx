import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DeskScroll } from '../../../src/ui/molecules/DeskScroll';
import { ReadingDesk } from '../../../src/ui/organisms/ReadingDesk';
import type { DeskView } from '../../../src/ui/presenters/libraryView';
import { componentsOf } from './elements';
import { noop } from './homeDeps';

const view: DeskView = {
	title: 'Reading now',
	empty: null,
	scrolls: [
		{ path: 'a.md', title: 'Clean Architecture', author: 'Robert C. Martin', since: 'Reading for 9 days', openLabel: 'Open the card of Clean Architecture' },
		{ path: 'b.md', title: 'Mere Christianity', author: null, since: 'Reading', openLabel: 'Open the card of Mere Christianity' },
	],
};

describe('ReadingDesk, the small desk on home (home-header S1)', () => {
	it('is a section of the home screen headed "Reading now", in the desk style of the library, made smaller', () => {
		const html = renderToStaticMarkup(<ReadingDesk view={view} onOpenCard={noop} idPrefix="home-desk" period="night" />);

		expect(html).toMatch(/^<section class="dromos-section dromos-reading-desk" aria-labelledby="home-desk-desk" data-period="night"><h2 class="dromos-card-title" id="home-desk-desk">Reading now<\/h2>/);
		expect(html).toContain('<div class="dromos-library-scene is-desk dromos-panel is-mini" data-scene="desk">');
		expect(html).toContain('class="dromos-library-lamp"');
	});

	it('draws one scroll per book being read, each a button that names its card', () => {
		const html = renderToStaticMarkup(<ReadingDesk view={view} onOpenCard={noop} idPrefix="home-desk" period="day" />);

		expect([...html.matchAll(/<button type="button" class="dromos-desk-scroll" aria-label="([^"]+)" aria-describedby="([^"]+)"/g)].map((match) => [match[1], match[2]])).toEqual([
			['Open the card of Clean Architecture', 'home-desk-since-0'],
			['Open the card of Mere Christianity', 'home-desk-since-1'],
		]);
		expect(html).toContain('<span class="dromos-desk-scroll-since" id="home-desk-since-1">Reading</span>');
	});

	it("opens the book's card, as the library's desk does", () => {
		const opened: string[] = [];
		const scrolls = componentsOf(ReadingDesk({ view, onOpenCard: (path) => opened.push(path), idPrefix: 'home-desk', period: 'day' }), DeskScroll);

		(scrolls[1]?.props.onOpen as (path: string) => void)('b.md');
		expect(scrolls.map((scroll) => (scroll.props.view as { path: string }).path)).toEqual(['a.md', 'b.md']);
		expect(opened).toEqual(['b.md']);
	});
});
