import { describe, expect, it } from 'vitest';
import type { Resource } from '../../src/domain';
import { createTranslator } from '../../src/i18n';
import { archiveDoorView, archiveView, linkDomain, type ArchiveFilter } from '../../src/ui/presenters/archiveView';
import { aResource } from '../fakes/resources';

const en = createTranslator('en');
const es = createTranslator('es');
const TODAY = '2026-11-10';

const res = (title: string, overrides: Partial<Resource> = {}): Resource => aResource({ path: `04 - Resources/${title}.md`, title, why: null, ...overrides });
const processed = (title: string, finished: string, overrides: Partial<Resource> = {}): Resource => res(title, { saved: '2026-10-01', finished, takeawayWritten: true, ...overrides });

/** The archive of the mockup (08-Visual-Design, "El archivo"): six pending, one missing its takeaway, seven processed. */
const ARCHIVE: readonly Resource[] = [
	res('Los CRDT, explicados', { kind: 'video', author: 'Martin Kleppmann', url: 'https://www.youtube.com/watch?v=x7cQ3mrcKaY', why: 'entender la sincronización', saved: '2026-11-08' }),
	res('Cómo pensar en módulos', { kind: 'post', author: 'Martin Fowler', url: 'https://martinfowler.com/articles/modules.html', why: 'entender los módulos', saved: '2026-11-07' }),
	res('Local-first software', { kind: 'paper', author: 'Ink & Switch', url: 'https://www.inkandswitch.com/local-first/', saved: '2026-11-05' }),
	res('Guía de accesibilidad web', { kind: 'tool', author: 'MDN', url: 'https://developer.mozilla.org/es/docs/Web/Accessibility', saved: '2026-11-04' }),
	res('El valor de aburrirse', { kind: 'post', author: 'Cal Newport', url: 'https://calnewport.com/boredom', saved: '2026-11-02' }),
	res('Sistemas distribuidos', { kind: 'course', author: 'MIT OpenCourseWare', url: 'https://ocw.mit.edu/courses/6-824', saved: '2026-10-29' }),
	res('Cómo se decide qué leer', { kind: 'podcast', author: 'Deep Questions', url: null, why: 'afinar mi criterio de lectura', saved: '2026-11-01', finished: '2026-11-09' }),
	processed('Escribir para pensar', '2026-11-08', { kind: 'post', author: 'Paul Graham', url: 'https://paulgraham.com/writes.html' }),
	processed('La atención como recurso', '2026-11-06', { kind: 'video' }),
	processed('Atajos de Obsidian', '2026-11-05', { kind: 'tool' }),
	processed('Out of the Tar Pit', '2026-11-04', { kind: 'paper' }),
	processed('Qué es el trabajo profundo', '2026-11-03', { kind: 'post' }),
	processed('Hábitos pequeños', '2026-11-02', { kind: 'podcast' }),
	processed('Un hilo viejo', '2026-10-20', { kind: 'post' }),
];

const view = (resources: readonly Resource[] = ARCHIVE, filter: ArchiveFilter = 'all', expanded = false, t = es) => archiveView(resources, TODAY, { filter, expanded }, t);
const titlesOf = (archive: ReturnType<typeof archiveView>) => archive.sections.map((section) => [section.title, section.rows.map((row) => row.title)]);

describe('archiveView: the archive (M8 S5)', () => {
	it('names the level "Biblioteca · El archivo" with the way back, as a shelf does', () => {
		expect(view()).toMatchObject({ title: 'Biblioteca · El archivo', backLabel: 'Biblioteca', backAria: 'Volver a la biblioteca' });
		expect(view(ARCHIVE, 'all', false, en)).toMatchObject({ title: 'Library · The archive', backLabel: 'Library', backAria: 'Back to the library' });
	});

	it('sums up the archive: pending by verb, then what misses its takeaway, then what is processed', () => {
		expect(view().summary).toBe('4 por leer · 2 por ver · 1 falta procesar · 7 procesados');
		expect(view(ARCHIVE, 'all', false, en).summary).toBe('4 to read · 2 to watch · 1 to process · 7 processed');
	});

	it('leaves out the parts in zero, and speaks of one in the singular', () => {
		expect(view([res('Un podcast', { kind: 'podcast' })]).summary).toBe('1 por escuchar');
		expect(view([res('A', { finished: '2026-11-09' }), res('B', { kind: 'video', finished: '2026-11-08' })]).summary).toBe('2 faltan procesar');
		expect(view([processed('A', '2026-11-09')]).summary).toBe('1 procesado');
		expect(view([res('A', { kind: null })]).summary).toBe('1 por leer');
	});

	it('keeps the summary of the whole archive while a pigeonhole is selected', () => {
		expect(view(ARCHIVE, 'video').summary).toBe('4 por leer · 2 por ver · 1 falta procesar · 7 procesados');
	});

	it('shows "Todos" and one pigeonhole per kind with a resource, in order, each counting what is not processed', () => {
		const archive = view([...ARCHIVE, processed('Un curso visto', '2026-11-01', { kind: 'course' })]);

		expect(archive.pigeonholesLabel).toBe('Casilleros, con lo que falta procesar');
		expect(archive.pigeonholes.map((hole) => [hole.id, hole.label, hole.count, hole.selected])).toEqual([
			['all', 'Todos', 7, true],
			['post', 'Artículos', 2, false],
			['paper', 'Papers', 1, false],
			['video', 'Videos', 1, false],
			['podcast', 'Podcasts', 1, false],
			['tool', 'Páginas', 1, false],
			['course', 'Cursos', 1, false],
		]);
		expect(view(ARCHIVE, 'all', false, en).pigeonholes.map((hole) => hole.label)).toEqual(['All', 'Articles', 'Papers', 'Videos', 'Podcasts', 'Pages', 'Courses']);
	});

	it('gives a kind with only processed resources its pigeonhole, at zero, and none to a kind with nothing', () => {
		const archive = view([res('A', { kind: 'post' }), processed('B', '2026-11-09', { kind: 'video' })]);

		expect(archive.pigeonholes.map((hole) => [hole.id, hole.count])).toEqual([
			['all', 1],
			['post', 1],
			['video', 0],
		]);
	});

	it('gives "Sin tipo" no pigeonhole: it shows and counts under "Todos" only', () => {
		const archive = view([res('Algo sin tipo', { kind: null }), res('Un artículo', { kind: 'post' })]);

		expect(archive.pigeonholes.map((hole) => [hole.id, hole.count])).toEqual([
			['all', 2],
			['post', 1],
		]);
		expect(archive.sections[0]?.rows.map((row) => [row.title, row.kindLabel])).toEqual([
			['Algo sin tipo', 'Sin tipo'],
			['Un artículo', 'Artículo'],
		]);
		expect(view([res('Algo sin tipo', { kind: null }), res('Un artículo', { kind: 'post' })], 'post').sections[0]?.rows.map((row) => row.title)).toEqual(['Un artículo']);
	});

	it('lays out three sections: pending and missing by the most recently saved, processed by the most recently finished', () => {
		expect(titlesOf(view())).toEqual([
			['Por leer y ver', ['Los CRDT, explicados', 'Cómo pensar en módulos', 'Local-first software', 'Guía de accesibilidad web', 'El valor de aburrirse', 'Sistemas distribuidos']],
			['Falta lo que te dejó', ['Cómo se decide qué leer']],
			['Procesados', ['Escribir para pensar', 'La atención como recurso', 'Atajos de Obsidian', 'Out of the Tar Pit', 'Qué es el trabajo profundo', 'Hábitos pequeños']],
		]);
		expect(view().sections.map((section) => section.id)).toEqual(['pending', 'takeaway-missing', 'processed']);
		expect(view(ARCHIVE, 'all', false, en).sections.map((section) => section.title)).toEqual(['To read and watch', 'Missing what it left you', 'Processed']);
	});

	it('orders the missing ones by the most recently saved, not by when they were finished', () => {
		const archive = view([res('Viejo', { saved: '2026-10-01', finished: '2026-11-09' }), res('Nuevo', { saved: '2026-11-05', finished: '2026-11-06' })]);

		expect(titlesOf(archive)).toEqual([['Falta lo que te dejó', ['Nuevo', 'Viejo']]]);
	});

	it('shows the first six processed, then "Ver más (N)" for the rest, and every one once expanded', () => {
		const folded = view().sections[2];
		const expanded = view(ARCHIVE, 'all', true).sections[2];

		expect(folded?.rows).toHaveLength(6);
		expect(folded?.more).toEqual({ label: 'Ver más (1)', expanded: false });
		expect(expanded?.rows.map((row) => row.title).at(-1)).toBe('Un hilo viejo');
		expect(expanded?.more).toEqual({ label: 'Ver menos', expanded: true });
		expect(view().sections[0]?.more).toBeUndefined();
		expect(view(ARCHIVE.slice(0, 13)).sections[2]?.more).toBeUndefined();
	});

	it('filters the sections to the selected pigeonhole', () => {
		const archive = view(ARCHIVE, 'video');

		expect(titlesOf(archive)).toEqual([
			['Por leer y ver', ['Los CRDT, explicados']],
			['Procesados', ['La atención como recurso']],
		]);
		expect(archive.filter).toBe('video');
		expect(archive.pigeonholes.filter((hole) => hole.selected).map((hole) => hole.id)).toEqual(['video']);
	});

	it('falls back to "Todos" when the selected pigeonhole is gone', () => {
		const archive = view(ARCHIVE.filter((resource) => resource.kind !== 'course'), 'course');

		expect(archive.filter).toBe('all');
		expect(archive.pigeonholes.filter((hole) => hole.selected).map((hole) => hole.id)).toEqual(['all']);
		expect(archive.sections[0]?.rows).toHaveLength(5);
	});

	it('words each row: kind, state by verb, title, author and domain, when it was saved, why and the link', () => {
		const rows = view().sections.flatMap((section) => section.rows);
		const crdt = rows.find((row) => row.title === 'Los CRDT, explicados');
		const podcast = rows.find((row) => row.title === 'Cómo se decide qué leer');

		expect(crdt).toEqual({
			path: '04 - Resources/Los CRDT, explicados.md',
			title: 'Los CRDT, explicados',
			kind: 'video',
			kindLabel: 'Video',
			state: 'pending',
			stateLabel: 'Pendiente',
			source: 'Martin Kleppmann · youtube.com',
			saved: 'Guardado hace 2 días',
			why: 'Me sirve para: entender la sincronización',
			link: { href: 'https://www.youtube.com/watch?v=x7cQ3mrcKaY', label: 'Abrir', ariaLabel: 'Abrir el enlace de Los CRDT, explicados en el navegador' },
			openLabel: 'Abrir la ficha de Los CRDT, explicados',
		});
		expect(podcast).toMatchObject({ kindLabel: 'Podcast', state: 'takeaway-missing', stateLabel: 'Escuchado · falta lo que te dejó', source: 'Deep Questions', link: null });
		expect(rows.find((row) => row.title === 'Escribir para pensar')).toMatchObject({ state: 'processed', stateLabel: 'Procesado', why: null });
	});

	it('names the state by the verb of the kind', () => {
		const missing = (kind: Resource['kind']) => view([res('X', { kind, finished: '2026-11-09' })]).sections[0]?.rows[0]?.stateLabel;

		expect([missing('post'), missing('paper'), missing('tool'), missing(null)]).toEqual(Array(4).fill('Leído · falta lo que te dejó'));
		expect([missing('video'), missing('course')]).toEqual(Array(2).fill('Visto · falta lo que te dejó'));
		expect(missing('podcast')).toBe('Escuchado · falta lo que te dejó');
		expect(view([res('X', { kind: 'video', finished: '2026-11-09' })], 'all', false, en).sections[0]?.rows[0]?.stateLabel).toBe('Watched · missing what it left you');
	});

	it('shows the domain alone without an author, and no source line with neither', () => {
		const source = (overrides: Partial<Resource>) => view([res('X', overrides)]).sections[0]?.rows[0]?.source;

		expect(source({ author: null, url: 'https://www.paulgraham.com/x.html' })).toBe('paulgraham.com');
		expect(source({ author: null, url: null })).toBeNull();
	});

	it('says how long ago it was saved: today, one day, N days; a date ahead reads as today', () => {
		const saved = (date: string, t = es) => view([res('X', { saved: date })], 'all', false, t).sections[0]?.rows[0]?.saved;

		expect([saved('2026-11-10'), saved('2026-11-09'), saved('2026-11-07'), saved('2026-11-12')]).toEqual(['Guardado hoy', 'Guardado hace 1 día', 'Guardado hace 3 días', 'Guardado hoy']);
		expect([saved('2026-11-10', en), saved('2026-11-09', en), saved('2026-11-07', en)]).toEqual(['Saved today', 'Saved 1 day ago', 'Saved 3 days ago']);
	});

	it('says there is nothing pending in an empty archive, with no summary, pigeonhole or section', () => {
		expect(view([])).toMatchObject({ summary: null, empty: 'No hay nada pendiente. Pásale un enlace a Esdras para guardarlo.', pigeonholes: [], sections: [] });
		expect(view([], 'all', false, en).empty).toBe('Nothing is pending. Give Esdras a link to save it.');
		expect(view().empty).toBeNull();
	});

	it('says so too when everything is processed, and still shows the processed ones', () => {
		const archive = view([processed('A', '2026-11-09')]);

		expect(archive.empty).toBe('No hay nada pendiente. Pásale un enlace a Esdras para guardarlo.');
		expect(titlesOf(archive)).toEqual([['Procesados', ['A']]]);
	});
});

describe('linkDomain', () => {
	it('takes the host of the link without "www."', () => {
		expect(linkDomain('https://www.youtube.com/watch?v=1')).toBe('youtube.com');
		expect(linkDomain('http://ocw.mit.edu/courses')).toBe('ocw.mit.edu');
		expect(linkDomain('not a link')).toBeNull();
	});
});

describe('archiveDoorView: the doorway in the reading room (M8 S2)', () => {
	it('names the archive and counts what is not processed', () => {
		expect(archiveDoorView(ARCHIVE, es)).toEqual({ name: 'El archivo', countText: '7 pendientes', openLabel: 'Abrir el archivo, 7 pendientes' });
		expect(archiveDoorView(ARCHIVE, en)).toEqual({ name: 'The archive', countText: '7 pending', openLabel: 'Open the archive, 7 pending' });
	});

	it('speaks of one in the singular and of none plainly', () => {
		expect(archiveDoorView([res('A')], es).countText).toBe('1 pendiente');
		expect(archiveDoorView([processed('A', '2026-11-09')], es).countText).toBe('Nada pendiente');
		expect(archiveDoorView([], en)).toEqual({ name: 'The archive', countText: 'Nothing pending', openLabel: 'Open the archive, nothing pending' });
	});
});
