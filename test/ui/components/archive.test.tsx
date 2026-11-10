import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Resource } from '../../../src/domain';
import { createTranslator } from '../../../src/i18n';
import { ListToggle } from '../../../src/ui/atoms/ListToggle';
import { ResourceArt } from '../../../src/ui/atoms/ResourceArt';
import { ArchiveDoor } from '../../../src/ui/molecules/ArchiveDoor';
import { ArchivePigeonhole } from '../../../src/ui/molecules/ArchivePigeonhole';
import { ResourceRow } from '../../../src/ui/molecules/ResourceRow';
import { ArchiveRoom } from '../../../src/ui/organisms/ArchiveRoom';
import { LibraryRoom } from '../../../src/ui/organisms/LibraryRoom';
import { archiveDoorView, archiveView, type ArchiveFilter } from '../../../src/ui/presenters/archiveView';
import { libraryRoomView } from '../../../src/ui/presenters/libraryView';
import { aBook } from '../../fakes/books';
import { aResource } from '../../fakes/resources';
import { clickOf, componentsOf, elementsOf } from './elements';
import { noop } from './homeDeps';

const en = createTranslator('en');
const es = createTranslator('es');
const TODAY = '2026-11-10';

const res = (title: string, overrides: Partial<Resource> = {}): Resource => aResource({ path: `04 - Resources/${title}.md`, title, why: null, ...overrides });
const processed = (title: string, finished: string, overrides: Partial<Resource> = {}): Resource => res(title, { saved: '2026-10-01', finished, takeawayWritten: true, ...overrides });

const ARCHIVE: readonly Resource[] = [
	res('Los CRDT, explicados', { kind: 'video', author: 'Martin Kleppmann', url: 'https://www.youtube.com/watch?v=x7cQ3mrcKaY', why: 'entender la sincronización', saved: '2026-11-08' }),
	res('Cómo pensar en módulos', { kind: 'post', author: 'Martin Fowler', saved: '2026-11-07' }),
	res('Una nota sin enlace', { kind: null, author: null, url: null, saved: '2026-11-06' }),
	res('Cómo se decide qué leer', { kind: 'podcast', url: null, saved: '2026-11-01', finished: '2026-11-09' }),
	...['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((title, index) => processed(title, `2026-11-0${9 - index}`, { kind: index % 2 === 0 ? 'paper' : 'tool', url: null })),
];

const view = (filter: ArchiveFilter = 'all', expanded = false, resources: readonly Resource[] = ARCHIVE, t = es) => archiveView(resources, TODAY, { filter, expanded }, t);
const archive = (filter: ArchiveFilter = 'all', expanded = false, resources: readonly Resource[] = ARCHIVE, t = es) =>
	renderToStaticMarkup(<ArchiveRoom view={view(filter, expanded, resources, t)} onSelect={noop} onOpenCard={noop} onToggleMore={noop} />);

/** The visible text of every `<button>`, tags stripped. */
const buttonTexts = (html: string): string[] => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((match) => (match[1] ?? '').replace(/<[^>]+>/g, '').trim());
/** Every `<a>` with its attributes and visible text. */
const links = (html: string): string[] => [...html.matchAll(/<a ([^>]*)>(.*?)<\/a>/g)].map((match) => `${match[1] ?? ''} | ${(match[2] ?? '').replace(/<[^>]+>/g, '')}`);
/** The `data-layer` of each layer of the scene `scene`, in document order. */
const layersOf = (html: string, scene: string): string[] => {
	const start = html.indexOf(`data-scene="${scene}"`);
	if (start < 0) return [];
	return [...html.slice(start).matchAll(/data-layer="(\w+)"/g)].slice(0, 3).map((match) => match[1] ?? '');
};

describe('ArchiveRoom: the archive (M8 S5)', () => {
	it('draws the room in layers, the pigeonholes as pressed-or-not filter buttons in one labeled group', () => {
		const html = archive();

		expect(layersOf(html, 'archive')).toEqual(['background', 'drawing', 'panels']);
		expect(html).toMatch(/<div class="dromos-pigeonholes" role="group" aria-label="Casilleros, con lo que falta procesar">/);
		expect(buttonTexts(html).slice(0, 5)).toEqual(['Todos 4', 'Artículos 1', 'Papers 0', 'Videos 1', 'Podcasts 1']);
		expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
		expect(html).toMatch(/<button type="button" class="dromos-pigeonhole is-selected" aria-pressed="true">/);
	});

	it('marks the selected pigeonhole and filters the list', () => {
		const html = archive('video');

		expect(html).toMatch(/<button type="button" class="dromos-pigeonhole is-selected" aria-pressed="true">(?:(?!<\/button>).)*Videos/);
		expect(html).toContain('Los CRDT, explicados');
		expect(html).not.toContain('Cómo pensar en módulos');
	});

	it('puts the room first, then the summary, then the sections in order', () => {
		const html = archive();
		const headings = [...html.matchAll(/<h3[^>]*>(.*?)<\/h3>/g)].map((match) => match[1]);

		expect(html.indexOf('dromos-pigeonholes')).toBeLessThan(html.indexOf('dromos-archive-summary'));
		expect(html).toContain('<p class="dromos-archive-summary">2 por leer · 1 por ver · 1 falta procesar · 7 procesados</p>');
		expect(html.indexOf('dromos-archive-summary')).toBeLessThan(html.indexOf('<h3'));
		expect(headings).toEqual(['Por leer y ver', 'Falta lo que te dejó', 'Procesados']);
	});

	it('words each row: kind and state in text beside the drawing, title as the button that opens the card, source, saved and why', () => {
		const html = archive();

		expect(html).toMatch(/<p class="dromos-resource-meta" id="([^"]+)"><span class="dromos-resource-kind">Video<\/span> <span class="dromos-resource-state">Pendiente<\/span><\/p><button type="button" class="dromos-resource-title" aria-label="Abrir la ficha de Los CRDT, explicados" aria-describedby="\1">Los CRDT, explicados<\/button>/);
		expect(html).toContain('<p class="dromos-resource-source">Martin Kleppmann · youtube.com</p>');
		expect(html).toContain('<p class="dromos-resource-saved">Guardado hace 2 días</p>');
		expect(html).toContain('<p class="dromos-resource-why">Me sirve para: entender la sincronización</p>');
		expect(html).toContain('<span class="dromos-resource-state">Escuchado · falta lo que te dejó</span>');
		expect(html).toContain('<span class="dromos-resource-kind">Sin tipo</span>');
	});

	it('offers "Abrir ↗" only on a row with a link, as a link that opens the browser', () => {
		const html = archive();

		expect(links(html)).toEqual([
			'class="dromos-btn is-small dromos-resource-link" href="https://www.youtube.com/watch?v=x7cQ3mrcKaY" target="_blank" rel="noopener noreferrer" aria-label="Abrir el enlace de Los CRDT, explicados en el navegador" | Abrir ↗',
			'class="dromos-btn is-small dromos-resource-link" href="https://martinfowler.com/articles/modules.html" target="_blank" rel="noopener noreferrer" aria-label="Abrir el enlace de Cómo pensar en módulos en el navegador" | Abrir ↗',
		]);
	});

	it('draws each kind, the empty seal for a missing takeaway and the clay seal for a processed one', () => {
		const html = archive('all', true);

		for (const kind of ['video', 'post', 'none', 'podcast', 'paper', 'tool']) expect(html).toContain(`dromos-resource-art is-${kind}`);
		expect(html).toMatch(/dromos-resource-art is-podcast has-empty-seal/);
		expect(html.match(/has-sealed-seal/g)).toHaveLength(7);
		expect(html).not.toMatch(/(fill|stroke|stop-color)="#/);
	});

	it('draws every kind with a drawing of its own', () => {
		const drawings = (['post', 'paper', 'video', 'podcast', 'tool', 'course', null] as const).map((kind) => renderToStaticMarkup(<ResourceArt kind={kind} />).replace(/class="dromos-resource-art[^"]*"/, ''));

		expect(new Set(drawings).size).toBe(7);
	});

	it('folds the processed under "Ver más (N)" and calls back to unfold them', () => {
		expect(buttonTexts(archive())).toContain('Ver más (1)');
		expect(archive()).not.toContain('>G<');
		expect(archive('all', true)).toContain('>G<');
		expect(buttonTexts(archive('all', true))).toContain('Ver menos');

		let toggled = 0;
		const tree = ArchiveRoom({ view: view(), onSelect: noop, onOpenCard: noop, onToggleMore: () => (toggled += 1) });
		const toggle = componentsOf(tree, ListToggle)[0];
		(toggle?.props.onToggle as () => void)();
		expect(toggled).toBe(1);
	});

	it('says nothing is pending in an empty archive, with no pigeonholes and no section', () => {
		const html = archive('all', false, []);

		expect(html).toContain('<p class="dromos-archive-empty">No hay nada pendiente. Pásale un enlace a Esdras para guardarlo.</p>');
		expect(html).not.toContain('dromos-pigeonholes');
		expect(html).not.toContain('<h3');
		expect(layersOf(html, 'archive')).toEqual(['background', 'drawing', 'panels']);
	});

	it('speaks English', () => {
		const html = archive('all', false, ARCHIVE, en);

		expect(buttonTexts(html).slice(0, 2)).toEqual(['All 4', 'Articles 1']);
		expect(links(html)[0]).toMatch(/\| Open ↗$/);
		expect(html).toContain('To read and watch');
	});
});

describe('ArchivePigeonhole and ResourceRow', () => {
	it('select their pigeonhole and open their card', () => {
		const calls: string[] = [];
		const archiveView = view();
		const [, post] = archiveView.pigeonholes;
		const row = archiveView.sections[0]?.rows[0];
		if (!post || !row) throw new Error('missing view');

		clickOf(ArchivePigeonhole({ view: post, onSelect: (id) => calls.push(`select:${id}`) }))();
		clickOf(ResourceRow({ view: row, onOpen: (path) => calls.push(`card:${path}`) }))();

		expect(calls).toEqual(['select:post', 'card:04 - Resources/Los CRDT, explicados.md']);
	});

	it('hand the archive their callbacks', () => {
		const selected: ArchiveFilter[] = [];
		const tree = ArchiveRoom({ view: view(), onSelect: (id) => selected.push(id), onOpenCard: noop, onToggleMore: noop });

		(componentsOf(tree, ArchivePigeonhole)[3]?.props.onSelect as (id: ArchiveFilter) => void)('video');
		expect(selected).toEqual(['video']);
		expect(componentsOf(tree, ResourceRow)).toHaveLength(10);
		expect(elementsOf(tree).filter((element) => element.type === 'section')).toHaveLength(3);
	});
});

describe('LibraryRoom: the doorway to the archive (M8 S2)', () => {
	const books = [aBook({ path: 'Bibliotheke/A.md', title: 'A', shelf: 'Teología' })];

	it('opens a doorway "El archivo" in the wall, after the alcoves, with what is not processed', () => {
		const html = renderToStaticMarkup(<LibraryRoom view={libraryRoomView(books, TODAY, es)} archive={archiveDoorView(ARCHIVE, es)} onOpenArchive={noop} onOpenShelf={noop} onOpenCard={noop} />);

		expect(html).toMatch(/<button type="button" class="dromos-archive-door" aria-label="Abrir el archivo, 4 pendientes">/);
		expect(html).toContain('<span class="dromos-archive-door-name">El archivo</span><span class="dromos-archive-door-count">4 pendientes</span>');
		expect(html.indexOf('dromos-archive-door')).toBeGreaterThan(html.indexOf('dromos-alcoves'));
		expect(html.indexOf('dromos-archive-door')).toBeLessThan(html.indexOf('dromos-library-desk'));
	});

	it('keeps the doorway in an empty library too', () => {
		const html = renderToStaticMarkup(<LibraryRoom view={libraryRoomView([], TODAY, es)} archive={archiveDoorView([], es)} onOpenArchive={noop} onOpenShelf={noop} onOpenCard={noop} />);

		expect(buttonTexts(html)).toEqual(['El archivoNada pendiente']);
	});

	it('draws no doorway when none is given', () => {
		expect(renderToStaticMarkup(<LibraryRoom view={libraryRoomView(books, TODAY, es)} onOpenShelf={noop} onOpenCard={noop} />)).not.toContain('dromos-archive-door');
	});

	it('opens the archive from the doorway', () => {
		let opened = 0;
		clickOf(ArchiveDoor({ view: archiveDoorView(ARCHIVE, es), onOpen: () => (opened += 1) }))();
		const tree = LibraryRoom({ view: libraryRoomView(books, TODAY, es), archive: archiveDoorView(ARCHIVE, es), onOpenArchive: () => (opened += 1), onOpenShelf: noop, onOpenCard: noop });
		(componentsOf(tree, ArchiveDoor)[0]?.props.onOpen as () => void)();

		expect(opened).toBe(2);
	});
});
