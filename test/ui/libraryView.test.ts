import { describe, expect, it } from 'vitest';
import type { CampaignSnapshot } from '../../src/application';
import type { Book } from '../../src/domain';
import { createTranslator } from '../../src/i18n';
import { homeDeskView, libraryHabitsView, libraryRoomView, libraryShelfView, shelfId } from '../../src/ui/presenters/libraryView';
import { area, campaign, habit } from '../domain/campaign/campaignFixtures';
import { aBook, aReflection } from '../fakes/books';

const en = createTranslator('en');
const es = createTranslator('es');
const TODAY = '2026-11-09';
const FULL = aReflection(['about', 'kept', 'changes', 'connects']);

const book = (title: string, overrides: Partial<Book> = {}): Book => aBook({ path: `03 - Areas/Bibliotheke/${title}.md`, title, author: null, ...overrides });

/** The library of the design (08-Visual-Design, "Biblioteca (M7)"), with one paused and one archived book. */
const LIBRARY: readonly Book[] = [
	book('Mero cristianismo', { author: 'C. S. Lewis', shelf: 'Teología', status: 'active', started: '2026-10-28' }),
	book('Clean Architecture', { author: 'Robert C. Martin', shelf: 'Programación', status: 'active', started: '2026-10-31' }),
	book('El costo del discipulado', { author: 'Dietrich Bonhoeffer', shelf: 'Teología' }),
	book('Refactoring', { author: 'Martin Fowler', shelf: 'Programación' }),
	book('Cien años de soledad', { author: 'Gabriel García Márquez', shelf: 'Ficción' }),
	book('Hábitos atómicos', { author: 'James Clear' }),
	book('El conocimiento del Dios santo', { author: 'A. W. Tozer', shelf: 'Teología', status: 'completed', reflection: FULL }),
	book('The Green Mile', { author: 'Stephen King', shelf: 'Ficción', status: 'completed', finished: '2026-10-03', reflection: FULL }),
	book('The Pragmatic Programmer', { author: 'Andrew Hunt and David Thomas', shelf: 'Programación', status: 'completed' }),
	book('Confesiones', { author: 'Agustín de Hipona', shelf: 'Teología', status: 'paused', started: '2026-09-01' }),
	book('Un libro guardado', { shelf: 'Ficción', status: 'archived' }),
];

describe('libraryRoomView: the reading room (M7 S5)', () => {
	it('sums up the library, finished counting sealed books and those missing their reflection, paused added at the end', () => {
		expect(libraryRoomView(LIBRARY, TODAY, es).summary).toBe('2 leyendo · 4 pendientes · 3 terminados · 1 en pausa');
		expect(libraryRoomView(LIBRARY, TODAY, en).summary).toBe('2 reading · 4 to read · 3 finished · 1 paused');
	});

	it('leaves "en pausa" out of the summary when nothing is paused, and speaks of one book in the singular', () => {
		const unpaused = LIBRARY.filter((entry) => entry.status !== 'paused');
		const one = [book('A', { status: 'active' }), book('B'), book('C', { status: 'completed' })];

		expect(libraryRoomView(unpaused, TODAY, es).summary).toBe('2 leyendo · 4 pendientes · 3 terminados');
		expect(libraryRoomView(one, TODAY, es).summary).toBe('1 leyendo · 1 pendiente · 1 terminado');
		expect(libraryRoomView(one, TODAY, en).summary).toBe('1 reading · 1 to read · 1 finished');
	});

	it('neither shows nor counts an archived book, and drops a shelf that holds only archived ones', () => {
		const room = libraryRoomView([...LIBRARY, book('Viejo', { shelf: 'Historia', status: 'archived' })], TODAY, es);

		expect(room.summary).toBe('2 leyendo · 4 pendientes · 3 terminados · 1 en pausa');
		expect(room.alcoves.map((alcove) => [alcove.name, alcove.countText])).toEqual([
			['Ficción', '2 libros'],
			['Programación', '3 libros'],
			['Teología', '4 libros'],
			['Sin estante', '1 libro'],
		]);
	});

	it('gives one alcove per shelf, as one button named after the shelf and its count, the books with no shelf in a capsa last', () => {
		const alcoves = libraryRoomView(LIBRARY, TODAY, en).alcoves;

		expect(alcoves.map((alcove) => alcove.openLabel)).toEqual(['Open the shelf Ficción, 2 books', 'Open the shelf Programación, 3 books', 'Open the shelf Teología, 4 books', 'Open the shelf No shelf, 1 book']);
		expect(alcoves.map((alcove) => alcove.capsa)).toEqual([false, false, false, true]);
		expect(libraryRoomView(LIBRARY, TODAY, es).alcoves[0]?.openLabel).toBe('Abrir el estante Ficción, 2 libros');
		expect(libraryRoomView(LIBRARY, TODAY, es).shelvesTitle).toBe('Los estantes');
	});

	it('hints at what an alcove holds with up to six tied scrolls', () => {
		const many = Array.from({ length: 9 }, (_, index) => book(`Libro ${index}`, { shelf: 'Teología' }));

		expect(libraryRoomView(LIBRARY, TODAY, es).alcoves.map((alcove) => alcove.scrolls)).toEqual([2, 3, 4, 1]);
		expect(libraryRoomView(many, TODAY, es).alcoves[0]?.scrolls).toBe(6);
	});

	it('puts only the books being read on the desk, each saying for how long, paused ones staying on their shelf', () => {
		const desk = libraryRoomView(LIBRARY, TODAY, es).desk;

		expect(desk.title).toBe('Leyendo ahora');
		expect(desk.empty).toBeNull();
		expect(desk.scrolls).toEqual([
			{ path: '03 - Areas/Bibliotheke/Clean Architecture.md', title: 'Clean Architecture', author: 'Robert C. Martin', since: 'Leyendo desde hace 9 días', openLabel: 'Abrir la ficha de Clean Architecture' },
			{ path: '03 - Areas/Bibliotheke/Mero cristianismo.md', title: 'Mero cristianismo', author: 'C. S. Lewis', since: 'Leyendo desde hace 12 días', openLabel: 'Abrir la ficha de Mero cristianismo' },
		]);
	});

	it('says "Leyendo" alone without a start date, and counts a start of today or yesterday in words', () => {
		const since = (started: string | null, t = es) => libraryRoomView([book('A', { status: 'active', started })], TODAY, t).desk.scrolls[0]?.since;

		expect(since(null)).toBe('Leyendo');
		expect(since('no es una fecha')).toBe('Leyendo');
		expect(since(TODAY)).toBe('Leyendo desde hoy');
		expect(since('2026-11-08')).toBe('Leyendo desde hace 1 día');
		expect(since('2026-11-12')).toBe('Leyendo desde hoy');
		expect(since('2026-10-28', en)).toBe('Reading for 12 days');
		expect(since('2026-11-08', en)).toBe('Reading for 1 day');
		expect(since(TODAY, en)).toBe('Reading since today');
		expect(since(null, en)).toBe('Reading');
	});

	it('leaves the desk bare with its line when no book is being read', () => {
		const desk = libraryRoomView([book('A'), book('B', { status: 'paused' })], TODAY, es).desk;

		expect(desk.scrolls).toEqual([]);
		expect(desk.empty).toBe('No estás leyendo ningún libro. Elige uno de un estante.');
		expect(libraryRoomView([book('A')], TODAY, en).desk.empty).toBe('You are not reading any book. Choose one from a shelf.');
	});

	it('says the library is empty, with no summary, alcoves or desk line, when it has no book left to show', () => {
		for (const books of [[], [book('Viejo', { status: 'archived' })]]) {
			const room = libraryRoomView(books, TODAY, es);
			expect(room.empty).toBe('La biblioteca está vacía. Pídele a Esdras que agregue los libros que quieres leer.');
			expect(room.summary).toBeNull();
			expect(room.alcoves).toEqual([]);
			expect(room.desk.empty).toBeNull();
		}
		expect(libraryRoomView([], TODAY, en).empty).toBe('The library is empty. Ask Esdras to add the books you want to read.');
		expect(libraryRoomView(LIBRARY, TODAY, es).empty).toBeNull();
	});
});

describe('homeDeskView: the small reading desk on home (home-header S1)', () => {
	const loaded = (books: readonly Book[]) => ({ kind: 'loaded' as const, books, resources: [] });

	it('holds only the books being read, as the desk of the library draws them', () => {
		const desk = homeDeskView(loaded(LIBRARY), TODAY, es);

		expect(desk?.title).toBe('Leyendo ahora');
		expect(desk?.empty).toBeNull();
		expect(desk?.scrolls).toEqual(libraryRoomView(LIBRARY, TODAY, es).desk.scrolls);
		expect(desk?.scrolls.map((scroll) => scroll.title)).toEqual(['Clean Architecture', 'Mero cristianismo']);
		expect(homeDeskView(loaded(LIBRARY), TODAY, en)?.title).toBe('Reading now');
	});

	it('is not drawn while no book is being read, while the library loads, or when it cannot be read', () => {
		expect(homeDeskView(loaded([book('A'), book('B', { status: 'paused' }), book('C', { status: 'completed', reflection: FULL })]), TODAY, es)).toBeNull();
		expect(homeDeskView(loaded([]), TODAY, es)).toBeNull();
		expect(homeDeskView(null, TODAY, es)).toBeNull();
		expect(homeDeskView({ kind: 'unreadable' }, TODAY, es)).toBeNull();
	});
});

describe('libraryShelfView: one shelf (M7 S5)', () => {
	const shelf = (name: string | null, t = es, books: readonly Book[] = LIBRARY) => libraryShelfView(books, shelfId(name), TODAY, t);

	it('titles the shelf with its count and offers the way back to the room', () => {
		const view = shelf('Teología');

		expect(view?.title).toBe('Teología · 4');
		expect(view?.backLabel).toBe('Biblioteca');
		expect(view?.backAria).toBe('Volver a la biblioteca');
		expect(shelf(null)?.title).toBe('Sin estante · 1');
		expect(shelf('Teología', en)?.title).toBe('Teología · 4');
		expect(shelf('Teología', en)?.backLabel).toBe('Library');
	});

	it('lays its books in three rows, reading (paused ones too), pending and finished, each titled with its count', () => {
		const rows = shelf('Teología')?.rows ?? [];

		expect(rows.map((row) => [row.id, row.title])).toEqual([
			['reading', 'Leyendo · 2'],
			['pending', 'Pendientes · 1'],
			['finished', 'Terminados · 1'],
		]);
		expect(rows[0]?.scrolls.map((scroll) => [scroll.title, scroll.state, scroll.stateLabel, scroll.note])).toEqual([
			['Mero cristianismo', 'reading', 'Leyendo', 'En la mesa de lectura'],
			['Confesiones', 'paused', 'En pausa', null],
		]);
		expect(rows[1]?.scrolls.map((scroll) => [scroll.title, scroll.stateLabel])).toEqual([['El costo del discipulado', 'Pendiente']]);
		expect(rows[2]?.scrolls.map((scroll) => [scroll.title, scroll.state, scroll.stateLabel])).toEqual([['El conocimiento del Dios santo', 'sealed', 'Terminado']]);
	});

	it('hides the rows with no book', () => {
		expect(shelf('Ficción')?.rows.map((row) => row.title)).toEqual(['Pendientes · 1', 'Terminados · 1']);
		expect(shelf(null)?.rows.map((row) => row.title)).toEqual(['Pendientes · 1']);
		expect(shelf('Ficción', en)?.rows.map((row) => row.title)).toEqual(['To read · 1', 'Finished · 1']);
	});

	it('marks a finished book without its whole reflection as such, among the finished ones', () => {
		const finished = shelf('Programación')?.rows.find((row) => row.id === 'finished');

		expect(finished?.scrolls.map((scroll) => [scroll.title, scroll.state, scroll.stateLabel])).toEqual([['The Pragmatic Programmer', 'reflection-missing', 'Falta la reflexión']]);
		expect(shelf('Programación', en)?.rows.find((row) => row.id === 'finished')?.scrolls[0]?.stateLabel).toBe('Reflection missing');
	});

	it('names each scroll button after its book, with its tag', () => {
		const scroll = shelf('Teología', en)?.rows[0]?.scrolls[0];

		expect(scroll).toMatchObject({ path: '03 - Areas/Bibliotheke/Mero cristianismo.md', title: 'Mero cristianismo', author: 'C. S. Lewis', openLabel: 'Open the card of Mero cristianismo', note: 'On the reading desk' });
	});

	it('finds a shelf whatever the case its notes write it in, and leaves archived books off it', () => {
		const books = [...LIBRARY, book('Otro', { shelf: 'teología' })];

		expect(shelf('TEOLOGÍA', es, books)?.title).toBe('Teología · 5');
		expect(shelf('Ficción')?.rows.flatMap((row) => row.scrolls.map((scroll) => scroll.title))).not.toContain('Un libro guardado');
	});

	it('is gone when no book is left on the shelf', () => {
		expect(shelf('Historia')).toBeNull();
		expect(shelf('Teología', es, [book('Viejo', { shelf: 'Teología', status: 'archived' })])).toBeNull();
	});
});

describe('the reading to-do copy (M7 S3)', () => {
	it('names the to-do and its five checklist items in both languages', () => {
		expect(es('library.todo.title', { title: 'Mero cristianismo' })).toBe('Leer: Mero cristianismo');
		expect(en('library.todo.title', { title: 'Mere Christianity' })).toBe('Read: Mere Christianity');
		const items = ['library.todo.item.finish', 'library.todo.item.about', 'library.todo.item.kept', 'library.todo.item.changes', 'library.todo.item.connects'] as const;
		expect(items.map((key) => es(key))).toEqual(['Terminar de leer', 'De qué trata', 'Qué me quedó', 'Qué cambia en mí', 'Con qué lo conecto']);
		expect(items.map((key) => en(key))).toEqual(['Finish reading', 'What it is about', 'What stayed with me', 'What changes in me', 'What I connect it to']);
	});
});

describe('libraryHabitsView: the habits beside the desk (ADR-017, S2)', () => {
	const BIBLIOTHEKE = '03 - Areas/Bibliotheke/Archeion - Bibliotheke.md';
	const snapshot = (overrides: Partial<CampaignSnapshot> = {}): CampaignSnapshot => ({
		campaigns: [],
		areas: [
			area({
				path: BIBLIOTHEKE,
				habits: [
					habit('Leer 10 minutos', { habiticaId: 'd1', days: 21, streak: 6 }),
					habit('Releer notas', { days: 14 }),
					habit('Perdido', { habiticaId: 'd2', streak: null }),
					habit('Diario', { habiticaId: 'd3', days: 7, streak: 9 }),
				],
			}),
			area({ path: '03 - Areas/Kairos/Archeion - Kairos.md', title: 'Archeion - Kairos', skills: ['desarrollador'], habits: [habit('Codear', { habiticaId: 'd4', streak: 3 })] }),
		],
		issues: [{ campaignPath: BIBLIOTHEKE, taskTitle: 'Perdido', kind: 'habitica-task-missing' }],
		lastSyncedAt: new Date('2026-11-09T12:00:00Z'),
		status: { kind: 'synced' },
		...overrides,
	});

	it('rows the reading habits only, each with its streak over its days, as a campaign habit is rowed', () => {
		const view = libraryHabitsView(snapshot(), es);

		expect(view?.title).toBe('Hábitos');
		expect(view?.rows.map((entry) => entry.areaPath)).toEqual([BIBLIOTHEKE, BIBLIOTHEKE, BIBLIOTHEKE, BIBLIOTHEKE]);
		expect(view?.rows.map(({ row }) => [row.title, row.state, row.canSend, row.progress.percent, row.text])).toEqual([
			['Leer 10 minutos', 'tracking', false, 29, 'Racha: 6 de 21 días'],
			['Releer notas', 'unsent', true, 0, 'Meta: 14 días'],
			['Perdido', 'missing', false, 0, 'Meta: 21 días'],
			['Diario', 'built', false, 100, 'Hábito formado: 7 días'],
		]);
	});

	it('speaks English: the heading is "Habits"', () => {
		expect(libraryHabitsView(snapshot(), en)?.title).toBe('Habits');
		expect(libraryHabitsView(snapshot(), en)?.rows[0]?.row.text).toBe('Streak: 6 of 21 days');
	});

	it('offers no send button while Habitica is not configured', () => {
		expect(libraryHabitsView(snapshot({ status: { kind: 'not-configured' } }), es)?.rows[1]?.row).toMatchObject({ state: 'unsent', canSend: false });
	});

	it('shows a habit by its skills, its own or else its Archeion\'s, whatever the Archeion (2026-11-09 change)', () => {
		const LEARNINGS = '03 - Areas/Learnings/Archeion - Learnings.md';
		const BIBLE = '03 - Areas/Bible/Archeion - Bible.md';
		const view = libraryHabitsView(
			snapshot({
				areas: [
					area({ path: BIBLE, title: 'Archeion - Bible', skills: ['teologo'], habits: [habit('Orar'), habit('Leer la Biblia', { skills: ['lector'] })] }),
					area({ path: BIBLIOTHEKE, habits: [habit('Leer 10 minutos', { skills: ['lector'] })] }),
					area({ path: LEARNINGS, title: 'Archeion - Learnings', skills: ['lector'], habits: [habit('Repasar', { skills: ['estudiante'] }), habit('Leer un artículo')] }),
				],
				issues: [],
			}),
			es,
		);

		expect(view?.rows.map(({ areaPath, row }) => [areaPath, row.title])).toEqual([
			[BIBLE, 'Leer la Biblia'],
			[BIBLIOTHEKE, 'Leer 10 minutos'],
			[LEARNINGS, 'Leer un artículo'],
		]);
	});

	it('is absent before the first sync, with no area, or when no habit is a reading one', () => {
		expect(libraryHabitsView(snapshot({ areas: null }), es)).toBeNull();
		expect(libraryHabitsView(snapshot({ areas: [] }), es)).toBeNull();
		expect(libraryHabitsView(snapshot({ areas: [area({ habits: [] }), area({ path: 'x.md', skills: ['desarrollador'], habits: [habit('Codear')] }), area({ path: 'y.md', habits: [habit('Repasar', { skills: ['estudiante'] })] })] }), es)).toBeNull();
	});

	it('never rows the habits of a campaign', () => {
		expect(libraryHabitsView(snapshot({ areas: [], campaigns: [campaign({ skills: ['lector'], habits: [habit('Leer')] })] }), es)).toBeNull();
	});
});
