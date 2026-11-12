import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { TitlesReading } from '../../../src/application';
import { createTranslator } from '../../../src/i18n';
import { TitlesCard } from '../../../src/ui/organisms/TitlesCard';
import { titlesCardView, type TitlesCardView } from '../../../src/ui/presenters/titlesCardView';
import { aTitle } from '../../fakes/InMemoryTitleRepository';
import { elementsOf } from './elements';

const es = createTranslator('es');
const TODAY = '2026-11-12';
const CORREDOR = aTitle('corredor', '2026-11-01', { title: 'Corredor', feat: 'Empezar el camino.', why: 'Un paso que nadie más ve.' });
const CONSTRUCTOR = aTitle('primera-campana', '2027-06-02', { title: 'Constructor', feat: 'Terminar la primera campaña.', why: 'Ahora sabes que puedes.' });
const PERSEVERANTE = aTitle('perseverante', '2027-10-21', { title: 'Perseverante', feat: 'Treinta mañanas seguidas.', why: 'Fue volver.' });

const THREE: TitlesReading = { titles: [PERSEVERANTE, CONSTRUCTOR, CORREDOR], unreadable: [] };
const view = (reading: TitlesReading = THREE, title = 'Constructor', failed = false): TitlesCardView => titlesCardView(reading, { name: 'Nicolás', title }, TODAY, es, failed);
const html = (cardView = view()): string => renderToStaticMarkup(<TitlesCard view={cardView} onChoose={() => undefined} />);
const rowsOf = (markup: string): string[] => [...markup.matchAll(/<li class="dromos-titles-row[^"]*">.*?<\/li>/g)].map((match) => match[0]);
const buttonsOf = (cardView: TitlesCardView, onChoose: (title: string) => void = () => undefined) => elementsOf(TitlesCard({ view: cardView, onChoose })).filter((element) => element.type === 'button');

describe('TitlesCard: today’s title (titles S5, option A)', () => {
	it('opens on today’s title, large, under "Tu título", with its day and how many Esdras granted', () => {
		expect(html()).toMatch(
			/^<div class="dromos-titles-card"><div class="dromos-stage-sheet"><div class="dromos-titles-head"><p class="dromos-stage-kicker">Tu título<\/p><h2 class="dromos-stage-title" tabindex="-1">Constructor<\/h2><p class="dromos-stage-since">Otorgado el 2 de junio de 2027 · 3 títulos otorgados por Esdras<\/p><\/div>/,
		);
	});

	it('moves the focus to its heading as it is drawn, without scrolling', () => {
		const heading = elementsOf(TitlesCard({ view: view(), onChoose: () => undefined })).find((element) => element.type === 'h2');
		const ref = (heading as { ref?: unknown } | undefined)?.ref;
		const calls: unknown[] = [];

		expect(typeof ref).toBe('function');
		(ref as (element: unknown) => void)({ focus: (options: unknown) => calls.push(options) });
		(ref as (element: unknown) => void)(null);
		expect(calls).toEqual([{ preventScroll: true }]);
	});
});

describe('TitlesCard: the titles you earned, one row each (titles S5)', () => {
	it('lists them newest first under "Los que ganaste", each with its day, feat and Esdras’s why signed', () => {
		const markup = html();
		const [first] = rowsOf(markup);

		expect(markup).toContain('<section class="dromos-stage-block"><h3 class="dromos-stage-section">Los que ganaste</h3><ul class="dromos-titles-list">');
		expect(rowsOf(markup).map((row) => /<h4 class="dromos-titles-name">([^<]*)<\/h4>/.exec(row)?.[1])).toEqual(['Perseverante', 'Constructor', 'Corredor']);
		expect(first).toBe(
			'<li class="dromos-titles-row"><div class="dromos-titles-row-head"><h4 class="dromos-titles-name">Perseverante</h4><span class="dromos-titles-when">21 de octubre de 2027</span></div><p class="dromos-titles-feat">Treinta mañanas seguidas.</p><p class="dromos-titles-why">«Fue volver.» <span class="dromos-titles-sign">— Esdras</span></p><div class="dromos-titles-action"><button type="button" class="dromos-btn is-small dromos-titles-use" aria-label="Usar este título: Perseverante">Usar este título</button></div></li>',
		);
	});

	it('marks today’s row, and says "En tu placa" as text in place of a button', () => {
		const current = rowsOf(html()).find((row) => row.includes('is-current')) ?? '';

		expect(current).toMatch(/^<li class="dromos-titles-row is-current">.*<h4 class="dromos-titles-name">Constructor<\/h4>/);
		expect(current).toContain('<div class="dromos-titles-action"><span class="dromos-titles-mark"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>En tu placa</span></div></li>');
		expect(current).not.toContain('<button');
	});

	it('gives every other row a button named by its title, which chooses that title', () => {
		const chosen: string[] = [];
		const buttons = buttonsOf(view(), (title) => chosen.push(title));

		expect(buttons.map((button) => button.props['aria-label'])).toEqual(['Usar este título: Perseverante', 'Usar este título: Corredor']);
		for (const button of buttons) (button.props.onClick as () => void)();
		expect(chosen).toEqual(['Perseverante', 'Corredor']);
	});

	it('leaves out a feat or a why the row left empty', () => {
		const markup = html(view({ titles: [aTitle('corredor', '2026-11-01', { title: 'Corredor' })], unreadable: [] }, 'Corredor'));

		expect(markup).not.toContain('dromos-titles-feat');
		expect(markup).not.toContain('dromos-titles-why');
	});
});

describe('TitlesCard: the lines at its foot and after a failed write (titles S5)', () => {
	it('with a single title, says titles come from big feats', () => {
		const markup = html(view({ titles: [CORREDOR], unreadable: [] }, 'Corredor'));

		expect(markup).toContain('<h3 class="dromos-stage-section">El que ganaste</h3>');
		expect(markup).toMatch(/<\/section><p class="dromos-titles-note">Esdras otorga un título por cada hazaña grande y rara: .*Los que ganes aparecerán aquí\.<\/p><\/div><\/div>$/);
	});

	it('has no note with more than one title', () => {
		expect(html()).not.toContain('dromos-titles-note');
	});

	it('names an unreadable row of Titles.md at its foot', () => {
		const markup = html(view({ ...THREE, unreadable: [{ path: 'Dromos/Titles.md', line: 9, text: '| x |' }] }));

		expect(markup).toMatch(/<\/section><p class="dromos-titles-problem">No se pudo leer 1 fila de Dromos\/Titles.md \(línea 9\)\.<\/p><\/div><\/div>$/);
	});

	it('after a write that failed, says under the head that the title is unchanged, as an alert', () => {
		expect(html(view(THREE, 'Constructor', true))).toContain(
			'<p class="dromos-stage-since">Otorgado el 2 de junio de 2027 · 3 títulos otorgados por Esdras</p><p class="dromos-titles-problem is-error" role="alert">No se pudo escribir Character.md. Tu título sigue siendo Constructor.</p></div>',
		);
		expect(html()).not.toContain('role="alert"');
	});

	it('holds no other button: the modal’s own close button and Escape close it', () => {
		expect(buttonsOf(view({ titles: [CORREDOR], unreadable: [] }, 'Corredor'))).toEqual([]);
	});
});
