import { describe, expect, it } from 'vitest';
import type { TitlesReading } from '../../src/application';
import { createTranslator } from '../../src/i18n';
import type { SyncBannerView } from '../../src/ui/presenters/syncBanner';
import { titleArrival, titleButtonLabel, titlesCardView, withTitleArrival } from '../../src/ui/presenters/titlesCardView';
import { aTitle } from '../fakes/InMemoryTitleRepository';

const es = createTranslator('es');
const en = createTranslator('en');
const TODAY = '2026-11-12';

const CORREDOR = aTitle('corredor', '2026-11-01', { title: 'Corredor', feat: 'Empezar el camino.', why: 'Todo camino empieza con un paso que nadie más ve.' });
const LECTOR = aTitle('lector-constante', '2027-03-14', { title: 'Lector constante', feat: 'Terminar diez libros con su reflexión.', why: 'Eso es leer, no pasar páginas.' });
const CONSTRUCTOR = aTitle('primera-campana', '2027-06-02', { title: 'Constructor', feat: 'Terminar la primera campaña.', why: 'Ahora sabes que puedes.' });
const PERSEVERANTE = aTitle('perseverante', '2027-10-21', { title: 'Perseverante', feat: 'Sostener la lectura de la mañana 30 días seguidos.', why: 'Fue volver.' });
const MAESTRO = aTitle('maestro-memoria', '2028-05-09', { title: 'Maestro de la memoria', feat: 'Llevar Mnemonista a rango 5.', why: 'Lo llevas contigo.' });

const FIVE: TitlesReading = { titles: [MAESTRO, PERSEVERANTE, CONSTRUCTOR, LECTOR, CORREDOR], unreadable: [] };
const ONE: TitlesReading = { titles: [CORREDOR], unreadable: [] };

describe('titlesCardView: the head, today’s title (titles S5)', () => {
	it('names the dialog after the character, and shows today’s title, its day and how many Esdras granted', () => {
		const view = titlesCardView(FIVE, { name: 'Nicolás', title: 'Constructor' }, TODAY, es);

		expect(view).toMatchObject({
			ariaLabel: 'Los títulos de Nicolás',
			kicker: 'Tu título',
			title: 'Constructor',
			since: 'Otorgado el 2 de junio de 2027 · 5 títulos otorgados por Esdras',
			error: null,
			listTitle: 'Los que ganaste',
			currentText: 'En tu placa',
			useText: 'Usar este título',
			note: null,
			unreadable: null,
		});
	});

	it('writes a day of this year without its year, as the library does', () => {
		expect(titlesCardView(ONE, { name: 'Nicolás', title: 'Corredor' }, TODAY, es).since).toBe('Otorgado el 1 de noviembre · 1 título otorgado por Esdras');
	});

	it('still shows a title that is not a granted one, with only the count and no row marked', () => {
		const view = titlesCardView(FIVE, { name: 'Nicolás', title: 'Viajero de la noche' }, TODAY, es);

		expect(view.title).toBe('Viajero de la noche');
		expect(view.since).toBe('5 títulos otorgados por Esdras');
		expect(view.rows.filter((row) => row.current)).toEqual([]);
	});

	it('with no title in Character.md, heads the card with the dialog’s name', () => {
		const view = titlesCardView(ONE, { name: 'Nicolás', title: '' }, TODAY, es);

		expect(view).toMatchObject({ kicker: null, title: 'Los títulos de Nicolás', since: '1 título otorgado por Esdras' });
	});
});

describe('titlesCardView: one row per earned title (titles S5)', () => {
	it('lists them in the order read, newest first, each with its day, feat and Esdras’s why signed', () => {
		const rows = titlesCardView(FIVE, { name: 'Nicolás', title: 'Constructor' }, TODAY, es).rows;

		expect(rows.map((row) => row.title)).toEqual(['Maestro de la memoria', 'Perseverante', 'Constructor', 'Lector constante', 'Corredor']);
		expect(rows[0]).toEqual({
			id: 'maestro-memoria',
			title: 'Maestro de la memoria',
			when: '9 de mayo de 2028',
			feat: 'Llevar Mnemonista a rango 5.',
			why: '«Lo llevas contigo.»',
			sign: '— Esdras',
			current: false,
			useLabel: 'Usar este título: Maestro de la memoria',
		});
	});

	it('marks today’s title only, by its text', () => {
		expect(titlesCardView(FIVE, { name: 'Nicolás', title: 'Constructor' }, TODAY, es).rows.map((row) => row.current)).toEqual([false, false, true, false, false]);
	});

	it('leaves out a feat or a why the row left empty', () => {
		const [row] = titlesCardView({ titles: [aTitle('corredor', '2026-11-01', { title: 'Corredor' })], unreadable: [] }, { name: 'Nicolás', title: 'Corredor' }, TODAY, es).rows;

		expect(row).toMatchObject({ feat: null, why: null });
	});
});

describe('titlesCardView: the notes at its foot (titles S5)', () => {
	it('with a single title, says titles come from big feats', () => {
		const view = titlesCardView(ONE, { name: 'Nicolás', title: 'Corredor' }, TODAY, es);

		expect(view.listTitle).toBe('El que ganaste');
		expect(view.note).toBe('Esdras otorga un título por cada hazaña grande y rara: terminar una campaña, diez libros con su reflexión, treinta días de un hábito. Los que ganes aparecerán aquí.');
	});

	it('names the rows of Titles.md it could not read, as the Shop does', () => {
		const reading: TitlesReading = { ...FIVE, unreadable: [{ path: 'Dromos/Titles.md', line: 9, text: '| x |' }] };

		expect(titlesCardView(reading, { name: 'Nicolás', title: 'Constructor' }, TODAY, es).unreadable).toBe('No se pudo leer 1 fila de Dromos/Titles.md (línea 9).');
	});

	it('after a write that failed, says the title is unchanged', () => {
		expect(titlesCardView(FIVE, { name: 'Nicolás', title: 'Constructor' }, TODAY, es, true).error).toBe('No se pudo escribir Character.md. Tu título sigue siendo Constructor.');
		expect(titlesCardView(ONE, { name: 'Nicolás', title: '' }, TODAY, es, true).error).toBe('No se pudo escribir Character.md. Tu título no cambió.');
	});
});

describe('titlesCardView in English', () => {
	it('words the card', () => {
		const view = titlesCardView({ ...ONE, unreadable: [] }, { name: 'Nicolás', title: 'Corredor' }, TODAY, en, true);

		expect(view).toMatchObject({
			ariaLabel: "Nicolás's titles",
			kicker: 'Your title',
			since: 'Granted on November 1 · 1 title granted by Esdras',
			error: 'Could not write Character.md. Your title is still Corredor.',
			listTitle: 'The one you earned',
			currentText: 'On your plaque',
			useText: 'Use this title',
			note: 'Esdras grants a title for each big, rare feat: finishing a campaign, ten books with their reflection, thirty days of a habit. The ones you earn will appear here.',
		});
		expect(view.rows[0]).toMatchObject({ why: '“Todo camino empieza con un paso que nadie más ve.”', useLabel: 'Use this title: Corredor' });
	});
});

describe('the title on the plaque and its notice (titles S5)', () => {
	it('names the title button by the title, then what it opens', () => {
		expect(titleButtonLabel('Corredor', es)).toBe('Corredor. Ver los títulos');
		expect(titleButtonLabel('Corredor', en)).toBe('Corredor. See the titles');
	});

	it('words the arrival of a title for the live region', () => {
		expect(titleArrival('Perseverante', es)).toBe('Esdras te otorgó un título: Perseverante.');
	});

	it('adds an arrival to the sync line’s announcement, and leaves it as it was without one', () => {
		const banner: SyncBannerView = { tone: 'success', message: 'Sincronizado hace 1 min', detail: null, announcement: 'Misiones sincronizadas', prominent: false };

		expect(withTitleArrival(banner, 'Esdras te otorgó un título: Perseverante.')).toEqual({ ...banner, announcement: 'Misiones sincronizadas. Esdras te otorgó un título: Perseverante.' });
		expect(withTitleArrival({ ...banner, announcement: 'Sin conexión.' }, 'Esdras te otorgó un título: Perseverante.').announcement).toBe('Sin conexión. Esdras te otorgó un título: Perseverante.');
		expect(withTitleArrival(banner, null)).toBe(banner);
	});
});
