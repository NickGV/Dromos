import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { weekReport, type KairosDay } from '../../../src/domain';
import { createTranslator } from '../../../src/i18n';
import { HomeScreen } from '../../../src/ui/containers/HomeScreen';
import { WeekReportCard } from '../../../src/ui/organisms/WeekReportCard';
import { weekReportView, type WeekReportView } from '../../../src/ui/presenters/weekReportView';
import { homeDeps, noop } from './homeDeps';

const TODAY = '2026-11-17';
const es = createTranslator('es');

function day(date: string, screenMinutes: number, exceeded: readonly string[] = []): KairosDay {
	return { date, screenMinutes, underLimit: [], exceeded };
}

const FULL = [day('2026-11-09', 38), day('2026-11-10', 52), day('2026-11-11', 71, ['Instagram']), day('2026-11-12', 45), day('2026-11-13', 29), day('2026-11-14', 96, ['Instagram', 'YouTube']), day('2026-11-15', 64)];
const REAL = [day('2026-11-09', 0), day('2026-11-10', 0), day('2026-11-11', 0), day('2026-11-12', 0), day('2026-11-13', 3)];
const W46 = { period: '2026-W46', start: '2026-11-09', end: '2026-11-15', spent: 412300, income: 0, net: -412300 };

function cardView(kairos: readonly KairosDay[], withMoney: boolean): WeekReportView {
	const view = weekReportView(weekReport({ kairos, cheshbon: withMoney ? [W46] : [] }, TODAY), TODAY, es);
	if (view === null) throw new Error('expected a card');
	return view;
}

function render(view: WeekReportView, open: boolean): string {
	return renderToStaticMarkup(<WeekReportCard view={view} open={open} bodyId="home-week" onToggle={noop} renderIcon={noop} />);
}

// app-reports S7, option C: folded like a campaign, open in place.
describe('WeekReportCard folded (S7)', () => {
	const html = render(cardView(REAL, false), false);

	it('is the section "Tu semana" whose header row is the toggle, folded', () => {
		expect(html).toMatch(/^<section class="dromos-section dromos-report" aria-labelledby="home-week-title"><h2 class="dromos-card-title" id="home-week-title">Tu semana<\/h2>/);
		expect(html).toMatch(/<button type="button" class="dromos-campaign-card-toggle" aria-expanded="false" aria-controls="home-week">.*La semana pasada, del 9 al 15 de noviembre/);
		expect(html).toMatch(/<div class="dromos-report-body" id="home-week" hidden="">/);
	});

	it('shows the week in words, seven tiny bars and the late line', () => {
		const summary = html.slice(html.indexOf('dromos-report-fold'), html.indexOf('dromos-report-body'));

		expect(summary).toContain('3 min en apps vigiladas');
		expect(summary.match(/<span class="dromos-report-mini-bar[^"]*"/g)).toHaveLength(7);
		expect(summary.match(/dromos-report-mini-bar is-missing/g)).toHaveLength(2);
		expect(summary).toContain('Kairos no escribe desde el 13 de noviembre.');
	});

	it('has no button but the toggle: the card only reads', () => {
		expect(html.match(/<button/g)).toHaveLength(1);
		expect(render(cardView(FULL, true), true).match(/<button/g)).toHaveLength(1);
	});
});

describe('WeekReportCard open (S7, the detail of A)', () => {
	const html = render(cardView(FULL, true), true);

	it('drops the folded row and shows the body', () => {
		expect(html).toContain('aria-expanded="true"');
		expect(html).not.toContain('dromos-report-fold');
		expect(html).toMatch(/<div class="dromos-report-body" id="home-week">/);
	});

	it('shows the phone: its total, average, seven bars and the days over the free limit', () => {
		expect(html).toContain('Teléfono');
		expect(html).toContain('<span class="dromos-report-figure">6 h 35 min</span> en apps vigiladas');
		expect(html).toContain('56 min al día de media · 7 días con nota');
		expect(html.match(/<li class="dromos-day[^"]*"/g)).toHaveLength(7);
		expect(html.match(/<li class="dromos-day is-over"/g)).toHaveLength(2);
		expect(html).toContain('2 de 7 días sobre el límite libre: Instagram y YouTube.');
	});

	it('shows the money: Gastos, Ingresos and Neto', () => {
		expect(html).toContain('Dinero');
		expect(html).toMatch(/<dt>Gastos<\/dt><dd>\$ 412\.300<\/dd>/);
		expect(html).toMatch(/<dt>Ingresos<\/dt><dd>\$ 0<\/dd>/);
		expect(html).toMatch(/<dt>Neto<\/dt><dd>−\$ 412\.300<\/dd>/);
	});

	it('hatches a day without a note and says the quiet lines of an app that never wrote', () => {
		const real = render(cardView(REAL, false), true);

		expect(real.match(/<li class="dromos-day is-missing"/g)).toHaveLength(2);
		expect(real).toContain('Ningún día pasó el límite libre.');
		expect(real).toContain('Cheshbon todavía no ha dejado notas en Logos.');
		expect(real).not.toContain('<dl');
	});

	it('never shows a link to the notes nor the keys it leaves out', () => {
		for (const text of ['Abrir la nota', '<a ', 'first_app', 'unlocks', 'notifications', 'focus_minutes', 'gold']) expect(html).not.toContain(text);
	});
});

// Existing behavior: home with no app notes is drawn exactly as before (the differential check compares the markup).
describe('HomeScreen without app notes', () => {
	it('draws no week card', () => {
		for (const language of ['en', 'es'] as const) expect(renderToStaticMarkup(<HomeScreen deps={homeDeps({ language })} />)).not.toContain('dromos-report');
	});
});
