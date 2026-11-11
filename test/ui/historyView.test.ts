import { describe, expect, it } from 'vitest';
import type { DeedEntry, WeekEntry } from '../../src/application';
import { createTranslator } from '../../src/i18n';
import { historyView, type HistoryView } from '../../src/ui/presenters/historyView';

const en = createTranslator('en');
const es = createTranslator('es');
/** A Wednesday: the current week runs from Monday 9 to Sunday 15 November. */
const TODAY = '2026-11-11';
const ZERO = { fuerza: 0, vitalidad: 0, inteligencia: 0, sabiduria: 0, espiritu: 0, disciplina: 0 };

const deed = (overrides: Partial<DeedEntry> = {}): DeedEntry => ({ date: '2026-11-10', task: 'Read 20 pages', xp: 10, source: 'complete', skills: [{ id: 'lector', name: 'Reader' }], ...overrides });
const week = (start: string, xp: number, overrides: Partial<WeekEntry> = {}): WeekEntry => ({ start, xp, previousXp: null, days: [0, 0, 0, 0, 0, 0, 0], statXp: ZERO, unskilledXp: 0, deeds: [], ...overrides });

const HISTORY: WeekEntry[] = [
	week('2026-10-26', 80),
	week('2026-11-02', 120, { previousXp: 80, days: [40, 0, 0, 0, 80, 0, 0] }),
	week('2026-11-09', 30, { previousXp: 120, days: [10, 0, 20, 0, 0, 0, 0], statXp: { ...ZERO, sabiduria: 20, fuerza: 10 }, unskilledXp: 10, deeds: [deed({ date: TODAY, task: 'Stretch', skills: [] }), deed({ date: '2026-11-09', xp: 20 })] }),
];

function weeks(view: HistoryView): Extract<HistoryView, { kind: 'weeks' }> {
	if (view.kind !== 'weeks') throw new Error('no weeks');
	return view;
}

describe('historyView: the screen (M9 S2, S3)', () => {
	it('opens with its header card, "Chronicle", and leads back to the path', () => {
		expect(historyView(HISTORY, null, TODAY, en)).toMatchObject({ title: 'Chronicle', back: { label: 'Path', ariaLabel: 'Back to the path' } });
		expect(historyView(HISTORY, null, TODAY, es)).toMatchObject({ title: 'Crónica', back: { label: 'Camino', ariaLabel: 'Volver al camino' } });
	});

	it('says in a sentence that the ledger is empty, instead of empty charts', () => {
		for (const history of [undefined, []]) {
			expect(historyView(history, null, TODAY, en)).toEqual({
				kind: 'empty',
				title: 'Chronicle',
				back: { label: 'Path', ariaLabel: 'Back to the path' },
				text: 'No deeds in the ledger yet. Complete a quest in Habitica and sync: its week will show here.',
			});
		}
		expect(historyView([], null, TODAY, es)).toMatchObject({ text: 'Todavía no hay logros en el registro. Completa una quest en Habitica y sincroniza: su semana aparecerá aquí.' });
	});
});

describe('historyView: the bars of the weeks (M9 S2)', () => {
	it('lists the weeks oldest first, the current one marked and selected on open, each named by its week and XP in words', () => {
		const { chart } = weeks(historyView(HISTORY, null, TODAY, en));

		expect(chart.bars.map((bar) => bar.ariaLabel)).toEqual(['Week of 26 Oct: 80 XP', 'Week of 2 Nov: 120 XP', 'This week, week of 9 Nov: 30 XP']);
		expect(chart.bars.map((bar) => bar.label)).toEqual(['26 Oct', '2 Nov', 'This week']);
		expect(chart.bars.map((bar) => [bar.current, bar.selected])).toEqual([
			[false, false],
			[false, false],
			[true, true],
		]);
		expect(chart.ariaLabel).toBe('XP by week');
	});

	it('names them in Spanish', () => {
		const { chart } = weeks(historyView(HISTORY, null, TODAY, es));

		expect(chart.bars.map((bar) => bar.ariaLabel)).toEqual(['Semana del 26 oct: 80 XP', 'Semana del 2 nov: 120 XP', 'Esta semana, semana del 9 nov: 30 XP']);
		expect(chart.ariaLabel).toBe('XP por semana');
	});

	it('selects the week asked for, and the current one when that week is not shown', () => {
		expect(weeks(historyView(HISTORY, '2026-11-02', TODAY, en)).chart.bars.map((bar) => bar.selected)).toEqual([false, true, false]);
		expect(weeks(historyView(HISTORY, '2025-01-06', TODAY, en)).chart.bars.map((bar) => bar.selected)).toEqual([false, false, true]);
	});

	it('scales the bars to a round top, which the chart names, and gives each its value', () => {
		const { chart } = weeks(historyView(HISTORY, null, TODAY, en));

		expect(chart.top).toBe('150 XP');
		expect(chart.bottom).toBeNull();
		expect(chart.zero).toBe(0);
		expect(chart.bars.map((bar) => [bar.bottom, bar.height, bar.value])).toEqual([
			[0, 53.33, '80'],
			[0, 80, '120'],
			[0, 20, '30'],
		]);
	});

	it('draws a week below zero under the baseline, with the minus sign', () => {
		const { chart } = weeks(historyView([week('2026-11-02', 100), week('2026-11-09', -20, { previousXp: 100 })], null, TODAY, en));

		expect(chart.zero).toBe(16.67);
		expect(chart.bottom).toBe('−20 XP');
		expect(chart.bars.map((bar) => [bar.bottom, bar.height, bar.negative, bar.value])).toEqual([
			[16.67, 83.33, false, '100'],
			[0, 16.67, true, '−20'],
		]);
		expect(chart.bars[1]?.ariaLabel).toBe('This week, week of 9 Nov: −20 XP');
	});

	it('keeps a chart of weeks without XP on its baseline', () => {
		const { chart } = weeks(historyView([week('2026-11-09', 0)], null, TODAY, en));

		expect(chart.bars.map((bar) => [bar.bottom, bar.height])).toEqual([[0, 0]]);
		expect(chart.top).toBe('10 XP');
	});
});

describe('historyView: the selected week (M9 S2)', () => {
	it('heads it with its name and its XP', () => {
		expect(weeks(historyView(HISTORY, null, TODAY, en)).week).toMatchObject({ title: 'This week', xp: '30 XP' });
		expect(weeks(historyView(HISTORY, '2026-11-02', TODAY, en)).week).toMatchObject({ title: 'Week of 2 Nov', xp: '120 XP' });
		expect(weeks(historyView(HISTORY, '2026-11-02', TODAY, es)).week).toMatchObject({ title: 'Semana del 2 nov', xp: '120 XP' });
	});

	it('compares it with the week before: more, less, the same, and nothing for the first week', () => {
		const comparison = (history: readonly WeekEntry[], selected: string, t = en) => weeks(historyView(history, selected, TODAY, t)).week.comparison;
		const same = [week('2026-11-02', 50), week('2026-11-09', 50, { previousXp: 50 })];

		expect(comparison(HISTORY, '2026-11-02')).toBe('+40 XP vs the week before');
		expect(comparison(HISTORY, '2026-11-09')).toBe('−90 XP vs the week before');
		expect(comparison(same, '2026-11-09')).toBe('Same XP as the week before');
		expect(comparison(HISTORY, '2026-10-26')).toBeNull();
		expect(comparison(HISTORY, '2026-11-02', es)).toBe('+40 XP frente a la semana anterior');
		expect(comparison(HISTORY, '2026-11-09', es)).toBe('−90 XP frente a la semana anterior');
		expect(comparison(same, '2026-11-09', es)).toBe('La misma XP que la semana anterior');
	});

	it('shows its seven days Monday first, today marked in the current week and the days still ahead without a value', () => {
		const { days } = weeks(historyView(HISTORY, null, TODAY, en)).week;

		expect(days.map((day) => [day.label, day.date, day.value])).toEqual([
			['Mon', '9', '10'],
			['Tue', '10', '0'],
			['Wed', '11', '20'],
			['Thu', '12', ''],
			['Fri', '13', ''],
			['Sat', '14', ''],
			['Sun', '15', ''],
		]);
		expect(days.map((day) => day.today)).toEqual([false, false, true, false, false, false, false]);
		expect(days.map((day) => day.ahead)).toEqual([false, false, false, true, true, true, true]);
		expect(days.map((day) => day.height)).toEqual([50, 0, 100, 0, 0, 0, 0]);
	});

	it('says every day in words', () => {
		expect(weeks(historyView(HISTORY, null, TODAY, en)).week.days.map((day) => day.text)).toEqual([
			'Monday 9 Nov: 10 XP',
			'Tuesday 10 Nov: 0 XP',
			'Wednesday 11 Nov, today: 20 XP',
			'Thursday 12 Nov: still to come',
			'Friday 13 Nov: still to come',
			'Saturday 14 Nov: still to come',
			'Sunday 15 Nov: still to come',
		]);
		expect(weeks(historyView(HISTORY, null, TODAY, es)).week.days.map((day) => day.text).slice(0, 4)).toEqual(['lunes 9 nov: 10 XP', 'martes 10 nov: 0 XP', 'miércoles 11 nov, hoy: 20 XP', 'jueves 12 nov: todavía no llega']);
	});

	it('marks no day of a past week as today or ahead', () => {
		const { days } = weeks(historyView(HISTORY, '2026-11-02', TODAY, en)).week;

		expect(days.map((day) => [day.date, day.value, day.today, day.ahead])).toEqual([
			['2', '40', false, false],
			['3', '0', false, false],
			['4', '0', false, false],
			['5', '0', false, false],
			['6', '80', false, false],
			['7', '0', false, false],
			['8', '0', false, false],
		]);
	});

	it('shows its XP by stat in the card\'s order, then the deeds with no skill', () => {
		const { stats } = weeks(historyView(HISTORY, null, TODAY, en)).week;

		expect(stats.map((stat) => [stat.label, stat.value, stat.width])).toEqual([
			['Strength', '10 XP', 50],
			['Vitality', '0 XP', 0],
			['Intelligence', '0 XP', 0],
			['Wisdom', '20 XP', 100],
			['Spirit', '0 XP', 0],
			['Discipline', '0 XP', 0],
			['No skill', '10 XP', 50],
		]);
		expect(stats.map((stat) => stat.unskilled)).toEqual([false, false, false, false, false, false, true]);
		expect(weeks(historyView(HISTORY, null, TODAY, es)).week.stats.map((stat) => stat.label)).toEqual(['Fuerza', 'Vitalidad', 'Inteligencia', 'Sabiduría', 'Espíritu', 'Disciplina', 'Sin skill']);
	});

	it('keeps a stat that lost XP in the week with its minus sign and no bar', () => {
		const lost = week('2026-11-09', -15, { statXp: { ...ZERO, sabiduria: -15 } });

		expect(weeks(historyView([lost], null, TODAY, en)).week.stats[3]).toMatchObject({ label: 'Wisdom', value: '−15 XP', width: 0, negative: true });
	});

	it('lists its deeds newest first, as the chronicle words them', () => {
		const { week: selected } = weeks(historyView(HISTORY, null, TODAY, en));

		expect(selected.deeds.map((line) => line.text)).toEqual(['Today · Stretch · +10 XP', '2 days ago · Read 20 pages · Reader +20 XP']);
		expect(selected.deedsEmpty).toBeNull();
		expect(selected.titles).toEqual({ days: 'By day', stats: 'By stat', deeds: 'Deeds' });
	});

	it('says so when the week has no deeds', () => {
		expect(weeks(historyView(HISTORY, '2026-10-26', TODAY, en)).week).toMatchObject({ deeds: [], deedsEmpty: 'No deeds this week.' });
		expect(weeks(historyView(HISTORY, '2026-10-26', TODAY, es)).week).toMatchObject({ deedsEmpty: 'Ningún logro esta semana.', titles: { days: 'Por día', stats: 'Por atributo', deeds: 'Logros' } });
	});
});
