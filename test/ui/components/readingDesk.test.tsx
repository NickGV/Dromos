import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ReadingLine } from '../../../src/ui/molecules/ReadingLine';
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

describe('ReadingDesk, the small desk on home (home-header S1, one line per book by home-fit S2)', () => {
	it('is a section of the home screen headed "Reading now", one line per book, without the drawing of the desk', () => {
		const html = renderToStaticMarkup(<ReadingDesk view={view} onOpenCard={noop} idPrefix="home-desk" />);

		expect(html).toMatch(/^<section class="dromos-section dromos-reading-desk" aria-labelledby="home-desk-desk"><h2 class="dromos-card-title" id="home-desk-desk">Reading now<\/h2><ul class="dromos-panel dromos-reading-lines">/);
		expect(html.match(/<li>/g)).toHaveLength(2);
		expect(html).not.toContain('dromos-library-scene');
		expect(html).not.toContain('dromos-library-lamp');
	});

	it('draws each book as one button on one line: a small scroll mark, the title, the author and how long it is read', () => {
		const html = renderToStaticMarkup(<ReadingDesk view={view} onOpenCard={noop} idPrefix="home-desk" />);

		expect(html).toMatch(
			/<button type="button" class="dromos-reading-line" aria-label="Open the card of Clean Architecture" aria-describedby="home-desk-since-0"><svg class="dromos-scroll-art is-reading"[^>]*aria-hidden="true"[^>]*>.*?<\/svg><span class="dromos-reading-line-book"><span class="dromos-reading-line-title">Clean Architecture<\/span> <span class="dromos-reading-line-author">Robert C. Martin<\/span><\/span><span class="dromos-reading-line-since" id="home-desk-since-0">Reading for 9 days<\/span><\/button>/,
		);
		expect(html).toContain('<span class="dromos-reading-line-book"><span class="dromos-reading-line-title">Mere Christianity</span></span><span class="dromos-reading-line-since" id="home-desk-since-1">Reading</span>');
	});

	it("opens the book's card, as the library's desk does", () => {
		const opened: string[] = [];
		const lines = componentsOf(ReadingDesk({ view, onOpenCard: (path) => opened.push(path), idPrefix: 'home-desk' }), ReadingLine);

		(lines[1]?.props.onOpen as (path: string) => void)('b.md');
		expect(lines.map((line) => (line.props.view as { path: string }).path)).toEqual(['a.md', 'b.md']);
		expect(opened).toEqual(['b.md']);
	});

	it('opens the card of its own book from the line', () => {
		const opened: string[] = [];
		const [first] = view.scrolls;
		if (!first) throw new Error('no book');
		const button = componentsOf(ReadingLine({ view: first, onOpen: (path) => opened.push(path), sinceId: 'x' }), 'button')[0];

		(button?.props.onClick as () => void)();
		expect(opened).toEqual(['a.md']);
	});
});
