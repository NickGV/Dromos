import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Resource } from '../../../src/domain';
import { createTranslator } from '../../../src/i18n';
import { MarkdownBlock, type MarkdownRender } from '../../../src/ui/atoms/MarkdownBlock';
import { ResourceLink } from '../../../src/ui/atoms/ResourceLink';
import { ResourceCard } from '../../../src/ui/organisms/ResourceCard';
import { resourceCardView } from '../../../src/ui/presenters/resourceCardView';
import { aResource } from '../../fakes/resources';
import { componentsOf, elementsOf } from './elements';
import { noop, renderNothing } from './homeDeps';

const en = createTranslator('en');
const es = createTranslator('es');
const TODAY = '2026-11-10';
const PATH = '04 - Resources/Cómo pensar en módulos.md';

const modules = (overrides: Partial<Resource> = {}): Resource => aResource({ path: PATH, ...overrides });
const card = (resource: Resource, options: { busy?: boolean; canMark?: boolean; takeaway?: string | null; t?: typeof es; focusNote?: boolean } = {}) =>
	renderToStaticMarkup(
		<ResourceCard
			view={resourceCardView(resource, TODAY, options.t ?? es, options.canMark ?? true, options.takeaway ?? null)}
			busy={options.busy ?? false}
			onMark={noop}
			onOpenNote={noop}
			renderMarkdown={renderNothing}
			focusNote={options.focusNote}
		/>,
	);

/** The visible text of every `<button>` and `<a>`, in order, tags stripped. */
const actionTexts = (html: string): string[] => [...html.matchAll(/<(button|a)\b[^>]*>(.*?)<\/\1>/g)].map((match) => (match[2] ?? '').replace(/<[^>]+>/g, '').trim());
/** The `data-layer` of each layer of the scene `scene`, in document order. */
const layersOf = (html: string, scene: string): string[] => {
	const start = html.indexOf(`data-scene="${scene}"`);
	if (start < 0) return [];
	return [...html.slice(start).matchAll(/data-layer="(\w+)"/g)].slice(0, 3).map((match) => match[1] ?? '');
};

describe('ResourceCard: the card in the modal (M8 S6)', () => {
	it('unrolls the same scroll as the book card: kind and its drawing, title, source, state, dates, why and what it left', () => {
		const html = card(modules());

		expect(layersOf(html, 'card')).toEqual(['background', 'drawing', 'panels']);
		expect(html.match(/class="dromos-umbilicus/g)).toHaveLength(2);
		expect(html).toMatch(/<p class="dromos-resource-card-kind"><svg class="dromos-resource-art is-post"[^>]*>.*?<\/svg><span>Artículo<\/span><\/p>/);
		expect(html).toContain('<h2 class="dromos-book-card-title">Cómo pensar en módulos</h2>');
		expect(html).toContain('<p class="dromos-book-card-byline">Martin Fowler · martinfowler.com</p>');
		expect(html).toContain('<p class="dromos-book-card-state is-pending">Pendiente</p>');
		expect(html).toContain('<p class="dromos-book-card-dates">Guardado el 7 de noviembre</p>');
		expect([...html.matchAll(/<h3 class="dromos-book-section-heading">(.*?)<\/h3><p class="([^"]+)">(.*?)<\/p>/g)].map((match) => [match[1], match[2], match[3]])).toEqual([
			['Para qué me sirve', 'dromos-resource-card-why', 'entender los módulos'],
			['Lo que me dejó', 'dromos-book-section-status', 'Sin escribir todavía'],
		]);
	});

	it('offers the link, "Marcar como leído" as the primary button, and the note', () => {
		const html = card(modules());

		expect(actionTexts(html)).toEqual(['Abrir el enlace ↗', 'Marcar como leído', 'Abrir la nota']);
		expect(html).toContain('<a class="dromos-btn dromos-resource-link" href="https://martinfowler.com/articles/modules.html" target="_blank" rel="noopener noreferrer">Abrir el enlace<span aria-hidden="true"> ↗</span></a>');
		expect(html).toContain('<button type="button" class="dromos-btn is-primary">Marcar como leído</button>');
		expect(html).toContain('<button type="button" class="dromos-btn">Abrir la nota</button>');
	});

	it('names the mark by the verb of the kind', () => {
		expect(actionTexts(card(modules({ kind: 'video' })))).toContain('Marcar como visto');
		expect(actionTexts(card(modules({ kind: 'podcast' })))).toContain('Marcar como escuchado');
	});

	it('keeps a busy mark focusable, says what it is doing, and lets it start nothing more', () => {
		const html = card(modules(), { busy: true });
		const tree = ResourceCard({ view: resourceCardView(modules(), TODAY, es, true), busy: true, onMark: () => undefined, onOpenNote: noop, renderMarkdown: renderNothing });
		const mark = elementsOf(tree).find((element) => element.type === 'button' && element.props.children === 'Marcando…');

		expect(html).toContain('<button type="button" class="dromos-btn is-primary" aria-disabled="true">Marcando…</button>');
		expect(html).not.toMatch(/<button[^>]*disabled=""/);
		expect(mark?.props.onClick).toBeUndefined();
	});

	it('calls back to mark the resource and to open its note', () => {
		const calls: string[] = [];
		const tree = ResourceCard({ view: resourceCardView(modules(), TODAY, es, true), busy: false, onMark: () => calls.push('mark'), onOpenNote: () => calls.push('note'), renderMarkdown: renderNothing });
		const buttons = elementsOf(tree).filter((element) => element.type === 'button');

		for (const button of buttons) (button.props.onClick as () => void)();
		expect(calls).toEqual(['mark', 'note']);
	});

	it('leaves only the note once the resource is finished, the primary button while what it left is missing, with the empty seal', () => {
		const html = card(modules({ kind: 'podcast', url: null, saved: '2026-11-01', finished: '2026-11-09' }));

		expect(actionTexts(html)).toEqual(['Abrir la nota']);
		expect(html).toContain('<button type="button" class="dromos-btn is-primary">Abrir la nota</button>');
		expect(html).toContain('<p class="dromos-book-card-dates">Guardado el 1 de noviembre · Escuchado el 9 de noviembre</p>');
		expect(html).toMatch(/<span class="dromos-book-seal is-empty" aria-hidden="true"><\/span><p class="dromos-book-seal-text">Falta lo que te dejó<\/p>/);
		expect(html).toContain('<div class="dromos-book-card dromos-resource-card is-takeaway-missing">');
	});

	it('shows no mark when the action is not wired', () => {
		expect(actionTexts(card(modules(), { canMark: false }))).toEqual(['Abrir el enlace ↗', 'Abrir la nota']);
	});

	it('seals a processed resource in clay and renders what it left as the note, with its path for the links', () => {
		const resource = modules({ finished: '2026-11-08', takeawayWritten: true });
		const html = card(resource, { takeaway: 'Un módulo esconde *una decisión*.' });
		const render: MarkdownRender = () => noop;
		const tree = ResourceCard({ view: resourceCardView(resource, TODAY, es, true, 'Un módulo esconde *una decisión*.'), busy: false, onMark: noop, onOpenNote: noop, renderMarkdown: render });
		const blocks = componentsOf(tree, MarkdownBlock).map((element) => element.props);

		expect(html).toMatch(/<span class="dromos-seal dromos-book-seal is-sealed" aria-hidden="true">/);
		expect(html).toContain('<p class="dromos-book-seal-text">Sellado con lo que te dejó</p>');
		expect(html).toContain('<h3 class="dromos-book-section-heading">Lo que me dejó</h3><div class="dromos-book-section-text markdown-rendered"></div>');
		expect(blocks.map((props) => [props.markdown, props.sourcePath, props.render])).toEqual([['Un módulo esconde *una decisión*.', PATH, render]]);
	});

	it('draws no text block while the text is on its way', () => {
		const tree = ResourceCard({ view: resourceCardView(modules({ finished: '2026-11-08', takeawayWritten: true }), TODAY, es, true), busy: false, onMark: noop, onOpenNote: noop, renderMarkdown: renderNothing });

		expect(componentsOf(tree, MarkdownBlock)).toEqual([]);
		expect(card(modules({ finished: '2026-11-08', takeawayWritten: true }))).toContain('<p class="dromos-book-section-status is-written">Escrito</p>');
	});

	it('closes the card when a link in the text is followed', () => {
		let closed = 0;
		const tree = ResourceCard({
			view: resourceCardView(modules({ finished: '2026-11-08', takeawayWritten: true }), TODAY, es, true, '[[Otra nota]]'),
			busy: false,
			onMark: noop,
			onOpenNote: noop,
			renderMarkdown: renderNothing,
			onFollowLink: () => (closed += 1),
		});
		const parts = elementsOf(tree).find((element) => element.props.className === 'dromos-resource-card-parts');
		const click = parts?.props.onClick as ((event: { target: unknown }) => void) | undefined;
		const target = (link: boolean) => ({ closest: (selector: string) => (link && selector === 'a.internal-link' ? {} : null) });

		click?.({ target: target(false) });
		expect(closed).toBe(0);
		click?.({ target: target(true) });
		expect(closed).toBe(1);
	});

	it('plays a YouTube video between the dates and what it was saved for, drawn by the note renderer (M8 S8)', () => {
		const talk = modules({ kind: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
		const render: MarkdownRender = () => noop;
		const tree = ResourceCard({ view: resourceCardView(talk, TODAY, es, true), busy: false, onMark: noop, onOpenNote: noop, renderMarkdown: render });
		const blocks = componentsOf(tree, MarkdownBlock).map((element) => element.props);
		const html = card(talk);

		expect(blocks.map((props) => [props.markdown, props.sourcePath, props.render, props.className])).toEqual([['![](https://www.youtube.com/watch?v=dQw4w9WgXcQ)', PATH, render, 'dromos-resource-card-video-frame']]);
		expect(html).toMatch(/<p class="dromos-book-card-dates">[^<]*<\/p><section class="dromos-resource-card-video" aria-label="Video"><div class="dromos-resource-card-video-frame markdown-rendered"><\/div><\/section><div class="dromos-resource-card-parts">/);
	});

	it('draws no video box for a link that is not a YouTube video (M8 S8)', () => {
		const tree = ResourceCard({ view: resourceCardView(modules(), TODAY, es, true), busy: false, onMark: noop, onOpenNote: noop, renderMarkdown: renderNothing });

		expect(componentsOf(tree, MarkdownBlock)).toEqual([]);
		expect(card(modules())).not.toContain('dromos-resource-card-video');
	});

	it('tells the card when its link is followed, and leaves the link to open the page (M8 S9)', () => {
		let followed = 0;
		const tree = ResourceCard({ view: resourceCardView(modules(), TODAY, es, true), busy: false, onMark: noop, onOpenNote: noop, renderMarkdown: renderNothing, onOpenLink: () => (followed += 1) });
		const links = componentsOf(tree, ResourceLink);

		expect(links.map((element) => element.props.href)).toEqual(['https://martinfowler.com/articles/modules.html']);
		(links[0]?.props.onClick as (() => void) | undefined)?.();
		expect(followed).toBe(1);
	});

	it('hands the click of the link to whoever asked, and keeps it a link to a new window (M8 S9)', () => {
		const follow = () => undefined;
		const [withCallback] = elementsOf(ResourceLink({ href: 'https://youtu.be/dQw4w9WgXcQ', label: 'Abrir el enlace', onClick: follow }));
		const [plain] = elementsOf(ResourceLink({ href: 'https://youtu.be/dQw4w9WgXcQ', label: 'Abrir', small: true }));

		expect(withCallback?.props).toMatchObject({ href: 'https://youtu.be/dQw4w9WgXcQ', target: '_blank', rel: 'noopener noreferrer', onClick: follow });
		expect(plain?.props.onClick).toBeUndefined();
	});

	it('leaves out the link and why when the note has none, and adds no close button of its own', () => {
		const html = card(modules({ url: null, why: null }));

		expect(actionTexts(html)).toEqual(['Marcar como leído', 'Abrir la nota']);
		expect(html).not.toContain('Para qué me sirve');
		expect(html).not.toContain('×');
	});

	it('speaks English', () => {
		expect(actionTexts(card(modules(), { t: en }))).toEqual(['Open the link ↗', 'Mark as read', 'Open the note']);
	});
});
