import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { DeedEntry, WeekEntry } from '../../../src/application';
import { createTranslator } from '../../../src/i18n';
import { WeekBars } from '../../../src/ui/molecules/WeekBars';
import { ChronicleScreen } from '../../../src/ui/organisms/ChronicleScreen';
import { ScreenHeader } from '../../../src/ui/organisms/ScreenHeader';
import { historyView, type HistoryView } from '../../../src/ui/presenters/historyView';
import { componentsOf, elementsOf } from './elements';
import { noop } from './homeDeps';

const en = createTranslator('en');
/** The test clock's day, a Tuesday: the current week starts on Monday 2 November. */
const TODAY = '2026-11-03';
const ZERO = { fuerza: 0, vitalidad: 0, inteligencia: 0, sabiduria: 0, espiritu: 0, disciplina: 0 };

const deed = (overrides: Partial<DeedEntry> = {}): DeedEntry => ({ date: '2026-11-02', task: 'Read 20 pages', xp: 10, source: 'complete', skills: [{ id: 'lector', name: 'Reader' }], ...overrides });
const HISTORY: WeekEntry[] = [
	{ start: '2026-10-26', xp: 40, previousXp: null, days: [0, 0, 0, 0, 40, 0, 0], statXp: { ...ZERO, sabiduria: 40 }, unskilledXp: 0, deeds: [deed({ date: '2026-10-30', xp: 40 })] },
	{ start: '2026-11-02', xp: 25, previousXp: 40, days: [10, 15, 0, 0, 0, 0, 0], statXp: { ...ZERO, sabiduria: 10 }, unskilledXp: 15, deeds: [deed({ date: TODAY, task: 'Stretch', xp: 15, skills: [] }), deed()] },
];
const view = (selected: string | null = null): HistoryView => historyView(HISTORY, selected, TODAY, en);
const textOf = (html: string): string => html.replace(/<[^>]+>/g, '').replaceAll(' ', ' ');

describe('ChronicleScreen (M9 S2, S3)', () => {
	it('opens with its header card, "Chronicle", whose "← Path" leads back', () => {
		const onBack = vi.fn();
		const header = componentsOf(ChronicleScreen({ view: view(), onSelectWeek: noop, onBack }), ScreenHeader)[0];
		(header?.props.back as { onBack: () => void }).onBack();

		expect(header?.props.title).toBe('Chronicle');
		expect(header?.props.back).toMatchObject({ label: 'Path', ariaLabel: 'Back to the path' });
		expect(onBack).toHaveBeenCalledTimes(1);
		expect(renderToStaticMarkup(<ChronicleScreen view={view()} onSelectWeek={noop} onBack={noop} />)).toMatch(
			/^<div class="dromos-history"><header class="dromos-panel dromos-screen-header has-back"><button type="button" class="dromos-screen-back" aria-label="Back to the path"><span aria-hidden="true">←<\/span>Path<\/button><h2[^>]*data-screen-heading="true">Chronicle<\/h2><\/header>/,
		);
	});

	it('draws each week as a button, in order, pressed when selected and named in words', () => {
		const html = renderToStaticMarkup(<ChronicleScreen view={view()} onSelectWeek={noop} onBack={noop} />);
		const buttons = [...html.matchAll(/<button type="button" class="dromos-week[^"]*" aria-pressed="(true|false)" aria-label="([^"]*)"/g)].map((match) => [match[2], match[1]]);

		expect(buttons).toEqual([
			['Week of 26 Oct: 40 XP', 'false'],
			['This week, week of 2 Nov: 25 XP', 'true'],
		]);
		expect(html).toMatch(/<div class="dromos-weeks" role="group" aria-label="XP by week">/);
	});

	it('selects the week of the bar pressed', () => {
		const onSelectWeek = vi.fn();
		const bars = componentsOf(ChronicleScreen({ view: view(), onSelectWeek, onBack: noop }), WeekBars)[0];
		const chart = view();
		if (chart.kind !== 'weeks' || !bars) throw new Error('no weeks');
		const buttons = elementsOf(WeekBars({ view: chart.chart, onSelect: bars.props.onSelect as (key: string) => void })).filter((element) => element.type === 'button');
		(buttons[0]?.props.onClick as () => void)();

		expect(onSelectWeek).toHaveBeenCalledWith('2026-10-26');
	});

	it('heads the selected week with its XP and the comparison, which a live region announces', () => {
		const html = renderToStaticMarkup(<ChronicleScreen view={view('2026-11-02')} onSelectWeek={noop} onBack={noop} />);

		expect(html).toMatch(/<div class="dromos-history-head" aria-live="polite" aria-atomic="true"><h3 class="dromos-history-week">This week<\/h3><p class="dromos-history-xp">25 XP<\/p><p class="dromos-history-compare">−15 XP vs the week before<\/p><\/div>/);
		expect(renderToStaticMarkup(<ChronicleScreen view={view('2026-10-26')} onSelectWeek={noop} onBack={noop} />)).not.toContain('dromos-history-compare');
	});

	it('says every day of the week in words, today marked, the days ahead too', () => {
		const html = renderToStaticMarkup(<ChronicleScreen view={view()} onSelectWeek={noop} onBack={noop} />);
		const days = [...html.matchAll(/<li class="dromos-day[^"]*">.*?<span class="dromos-visually-hidden">([^<]*)<\/span><\/li>/g)].map((match) => match[1]);

		expect(days).toEqual(['Monday 2 Nov: 10 XP', 'Tuesday 3 Nov, today: 15 XP', 'Wednesday 4 Nov: still to come', 'Thursday 5 Nov: still to come', 'Friday 6 Nov: still to come', 'Saturday 7 Nov: still to come', 'Sunday 8 Nov: still to come']);
		expect(html).toContain('<li class="dromos-day is-today">');
		expect(html.match(/<li class="dromos-day is-ahead">/g)).toHaveLength(5);
	});

	it('lists the XP by stat in the card\'s order with its values, the deeds with no skill last', () => {
		const html = renderToStaticMarkup(<ChronicleScreen view={view()} onSelectWeek={noop} onBack={noop} />);
		const rows = [...html.matchAll(/<li class="dromos-stat-share[^"]*"><span class="dromos-stat-share-name">([^<]*)<\/span>.*?<span class="dromos-stat-share-value">([^<]*)<\/span><\/li>/g)].map((match) => `${match[1]} ${match[2]}`);

		expect(rows).toEqual(['Strength 0 XP', 'Vitality 0 XP', 'Intelligence 0 XP', 'Wisdom 10 XP', 'Spirit 0 XP', 'Discipline 0 XP', 'No skill 15 XP']);
	});

	it('lists the deeds of the week, newest first, as the chronicle words them', () => {
		const html = renderToStaticMarkup(<ChronicleScreen view={view()} onSelectWeek={noop} onBack={noop} />);
		const deeds = [...html.matchAll(/<li class="dromos-deed[^"]*">(.*?)<\/li>/g)].map((match) => textOf(match[1] ?? ''));

		expect(deeds).toEqual(['Today · Stretch · +15 XP', 'Yesterday · Read 20 pages · Reader +10 XP']);
		expect(renderToStaticMarkup(<ChronicleScreen view={historyView([{ ...HISTORY[1]!, deeds: [] }], null, TODAY, en)} onSelectWeek={noop} onBack={noop} />)).toContain('No deeds this week.');
	});

	it('says in a sentence that the ledger is empty, with no charts', () => {
		const html = renderToStaticMarkup(<ChronicleScreen view={historyView([], null, TODAY, en)} onSelectWeek={noop} onBack={noop} />);

		expect(html).toContain('No deeds in the ledger yet. Complete a quest in Habitica and sync: its week will show here.');
		expect(html).not.toContain('dromos-weeks');
		expect(html).not.toContain('dromos-days');
		expect(html).toContain('data-screen-heading');
	});
});
