import { describe, expect, it } from 'vitest';
import { weekReport, type KairosDay, type SpendingNote } from '../../src/domain';
import { createTranslator } from '../../src/i18n';
import { weekReportView, type WeekReportView } from '../../src/ui/presenters/weekReportView';

const TODAY = '2026-11-17';
const es = createTranslator('es');
const en = createTranslator('en');

function day(date: string, screenMinutes: number, exceeded: readonly string[] = []): KairosDay {
	return { date, screenMinutes, underLimit: [], exceeded };
}

function spending(period: string, spent: number, income: number, net: number): SpendingNote {
	const start = period === '2026-W46' ? '2026-11-09' : period === '2026-W45' ? '2026-11-02' : period;
	const end = period === '2026-W46' ? '2026-11-15' : period === '2026-W45' ? '2026-11-08' : period;
	return { period, start, end, spent, income, net };
}

// The two states of the boards: the real one today (five Kairos days, Cheshbon never wrote) and a full week.
const REAL = [day('2026-11-09', 0), day('2026-11-10', 0), day('2026-11-11', 0), day('2026-11-12', 0), day('2026-11-13', 3)];
const FULL = [
	day('2026-11-09', 38),
	day('2026-11-10', 52),
	day('2026-11-11', 71, ['Instagram']),
	day('2026-11-12', 45),
	day('2026-11-13', 29),
	day('2026-11-14', 96, ['Instagram', 'YouTube']),
	day('2026-11-15', 64),
];
const W46 = spending('2026-W46', 412300, 0, -412300);

function view(kairos: readonly KairosDay[], cheshbon: readonly SpendingNote[], t = es, today = TODAY): WeekReportView | null {
	return weekReportView(weekReport({ kairos, cheshbon }, today), today, t);
}

function shown(kairos: readonly KairosDay[], cheshbon: readonly SpendingNote[], t = es, today = TODAY): WeekReportView {
	const result = view(kairos, cheshbon, t, today);
	if (result === null) throw new Error('expected a card');
	return result;
}

// app-reports S7: the card in Spanish, as on the boards.
describe('weekReportView: a full week (S1, S7)', () => {
	const card = shown(FULL, [W46]);

	it('names the card and the week', () => {
		expect(card.title).toBe('Tu semana');
		expect(card.period).toBe('La semana pasada, del 9 al 15 de noviembre');
		expect(card.late).toEqual([]);
	});

	it('gives the phone: the minutes in watched apps, the daily average over the days with a note, and the days over the free limit', () => {
		expect(card.phone).toMatchObject({
			kind: 'data',
			title: 'Teléfono',
			source: 'Kairos',
			total: '6 h 35 min',
			totalLabel: 'en apps vigiladas',
			average: '56 min al día de media · 7 días con nota',
			over: '2 de 7 días sobre el límite libre: Instagram y YouTube.',
			anyOver: true,
		});
	});

	it('draws seven bars Monday to Sunday with each day minutes, the days over the limit marked', () => {
		if (card.phone.kind !== 'data') throw new Error('expected data');
		const { days } = card.phone;

		expect(days.map((entry) => entry.label)).toEqual(['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']);
		expect(days.map((entry) => entry.date)).toEqual(['9', '10', '11', '12', '13', '14', '15']);
		expect(days.map((entry) => entry.value)).toEqual(['38', '52', '71', '45', '29', '96', '64']);
		expect(days.map((entry) => entry.over)).toEqual([false, false, true, false, false, true, false]);
		expect(days.map((entry) => entry.missing)).toEqual([false, false, false, false, false, false, false]);
		expect(days[5]?.height).toBe(100);
		expect(days[0]?.height).toBe(39.58);
		expect(days[2]?.text).toBe('miércoles 11 nov: 1 h 11 min, Instagram sobre el límite libre');
		expect(days[3]?.text).toBe('jueves 12 nov: 45 min');
	});

	it('gives the money of the weekly note, a negative net with a true minus sign', () => {
		expect(card.money).toEqual({
			kind: 'data',
			title: 'Dinero',
			source: 'Cheshbon',
			rows: [
				{ label: 'Gastos', value: '$ 412.300' },
				{ label: 'Ingresos', value: '$ 0' },
			],
			net: { label: 'Neto', value: '−$ 412.300' },
		});
	});

	it('folds to the week in words', () => {
		expect(card.summary).toEqual(['6 h 35 min en apps vigiladas', 'gastos $ 412.300']);
	});
});

describe('weekReportView: money formatting', () => {
	it('groups thousands with a dot and writes a positive net as it is', () => {
		const card = shown(FULL, [spending('2026-W46', 538900, 2400000, 1861100)]);

		expect(card.money).toMatchObject({ rows: [{ value: '$ 538.900' }, { value: '$ 2.400.000' }], net: { value: '$ 1.861.100' } });
	});

	it('writes English money with a comma and no space', () => {
		const card = shown(FULL, [W46], en);

		expect(card.money).toMatchObject({ rows: [{ label: 'Spent', value: '$412,300' }, { label: 'Income', value: '$0' }], net: { label: 'Net', value: '−$412,300' } });
	});
});

describe('weekReportView: days without a note are no data (S1, S3)', () => {
	const card = shown(REAL, []);

	it('averages over the days with a note, under one minute as such', () => {
		expect(card.phone).toMatchObject({ total: '3 min', average: 'Menos de 1 min al día de media · 5 días con nota', over: 'Ningún día pasó el límite libre.', anyOver: false });
	});

	it('draws a day without a note as missing, with no value, never as a zero', () => {
		if (card.phone.kind !== 'data') throw new Error('expected data');
		const { days } = card.phone;

		expect(days.map((entry) => entry.value)).toEqual(['0', '0', '0', '0', '3', '', '']);
		expect(days.map((entry) => entry.missing)).toEqual([false, false, false, false, false, true, true]);
		expect(days[5]).toMatchObject({ height: 0, over: false, text: 'sábado 14 nov: sin datos' });
		// A small week is drawn against an hour, so 3 minutes is a low bar, not a full one.
		expect(days[4]?.height).toBe(5);
	});

	it('says when Kairos wrote nothing in the week but did before', () => {
		expect(shown([day('2026-11-02', 10)], [W46]).phone).toEqual({ kind: 'none', title: 'Teléfono', source: 'Kairos', text: 'Sin notas de Kairos esta semana.' });
	});

	it('says when Cheshbon wrote no weekly note for the week, its daily notes included', () => {
		expect(shown(FULL, [spending('2026-11-16', 1, 0, -1)]).money).toEqual({ kind: 'none', title: 'Dinero', source: 'Cheshbon', text: 'Sin nota de Cheshbon para esta semana.' });
	});
});

// S2: a late app says so with its newest note, folded or open.
describe('weekReportView: late notes (S2)', () => {
	it('says Kairos has not written since its newest day', () => {
		expect(shown(REAL, []).late).toEqual(['Kairos no escribe desde el 13 de noviembre.']);
		expect(shown(REAL, [], en).late).toEqual(['Kairos has not written since November 13.']);
	});

	it('says Cheshbon has not written since the week of its newest weekly note', () => {
		expect(shown(FULL, [spending('2026-W45', 1, 1, 0)]).late).toEqual(['Cheshbon no escribe desde la semana del 2 de noviembre.']);
	});

	it('says nothing of an app that is on time', () => {
		expect(shown([...FULL, day('2026-11-16', 3)], [W46]).late).toEqual([]);
	});
});

// S7: the empty states.
describe('weekReportView: an app that never wrote (S7)', () => {
	it('draws no card when neither app has ever written a note of its type, nor before the first read', () => {
		expect(view([], [])).toBeNull();
		expect(weekReportView(null, TODAY, es)).toBeNull();
	});

	it('gives the half of the app that never wrote one quiet line', () => {
		expect(shown(REAL, []).money).toEqual({ kind: 'none', title: 'Dinero', source: 'Cheshbon', text: 'Cheshbon todavía no ha dejado notas en Logos.' });
		expect(shown([], [W46]).phone).toEqual({ kind: 'none', title: 'Teléfono', source: 'Kairos', text: 'Kairos todavía no ha dejado notas en Logos.' });
	});

	it('drops the parts with no data from the folded line', () => {
		expect(shown(REAL, []).summary).toEqual(['3 min en apps vigiladas']);
		expect(shown([], [W46]).summary).toEqual(['Gastos $ 412.300']);
		expect(shown([], [W46], en).summary).toEqual(['Spent $412,300']);
		expect(shown([day('2026-11-02', 10)], [spending('2026-W45', 1, 1, 0)]).summary).toEqual(['Sin datos de esta semana.']);
	});
});

describe('weekReportView: the week in words', () => {
	it('names a week across two months, and the year only when it is not this one', () => {
		expect(shown(FULL, [], es, '2026-11-03').period).toBe('La semana pasada, del 26 de octubre al 1 de noviembre');
		expect(shown(FULL, [], es, '2027-01-05').period).toBe('La semana pasada, del 28 de diciembre de 2026 al 3 de enero');
		expect(shown(FULL, [], en, '2026-11-03').period).toBe('Last week, October 26 to November 1');
	});

	it('writes hours on their own and long averages in hours', () => {
		const card = shown([day('2026-11-09', 120), day('2026-11-10', 10)], []);

		expect(card.phone).toMatchObject({ total: '2 h 10 min', average: '1 h 5 min al día de media · 2 días con nota' });
		expect(shown([day('2026-11-09', 120)], []).phone).toMatchObject({ total: '2 h', average: '2 h al día de media · 1 día con nota' });
	});

	it('says the whole card in English, sentence case', () => {
		const card = shown(FULL, [W46], en);

		expect(card.title).toBe('Your week');
		expect(card.period).toBe('Last week, November 9 to 15');
		expect(card.phone).toMatchObject({ title: 'Phone', totalLabel: 'in watched apps', average: '56 min a day on average · 7 days with a note', over: '2 of 7 days over the free limit: Instagram and YouTube.' });
		expect(card.money).toMatchObject({ title: 'Money' });
		expect(card.summary).toEqual(['6 h 35 min in watched apps', 'spent $412,300']);
		expect(shown(REAL, [], en).money).toMatchObject({ text: 'Cheshbon has not left any notes in Logos yet.' });
		expect(shown(REAL, [], en).phone).toMatchObject({ over: 'No day went over the free limit.' });
	});
});
