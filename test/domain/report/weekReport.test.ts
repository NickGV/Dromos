import { describe, expect, it } from 'vitest';
import { isCalendarDate, isoWeekLabel, isoWeekStart, lastCompleteWeek, weekReport, type AppNotes, type KairosDay, type SpendingNote } from '../../../src/domain';

const TODAY = '2026-11-17';

function day(date: string, screenMinutes: number, exceeded: readonly string[] = []): KairosDay {
	return { date, screenMinutes, underLimit: [], exceeded };
}

function week(period: string, start: string, end: string, spent: number, income: number, net: number): SpendingNote {
	return { period, start, end, spent, income, net };
}

function notes(kairos: readonly KairosDay[], cheshbon: readonly SpendingNote[] = []): AppNotes {
	return { kairos, cheshbon };
}

// app-reports S1: the card shows the last complete ISO week, Monday to Sunday, by the local date.
describe('lastCompleteWeek', () => {
	it('is 2026-11-09 to 2026-11-15, 2026-W46, on Tuesday 2026-11-17', () => {
		expect(lastCompleteWeek(TODAY)).toEqual({
			start: '2026-11-09',
			end: '2026-11-15',
			label: '2026-W46',
			dates: ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'],
		});
	});

	it('is the week before on a Monday and on a Sunday, whose own week is not over yet', () => {
		expect(lastCompleteWeek('2026-11-16')).toMatchObject({ start: '2026-11-09', end: '2026-11-15', label: '2026-W46' });
		expect(lastCompleteWeek('2026-11-15')).toMatchObject({ start: '2026-11-02', end: '2026-11-08', label: '2026-W45' });
	});

	it('takes the ISO year of the week across the new year', () => {
		expect(lastCompleteWeek('2027-01-05')).toMatchObject({ start: '2026-12-28', end: '2027-01-03', label: '2026-W53' });
		expect(lastCompleteWeek('2027-01-12')).toMatchObject({ start: '2027-01-04', end: '2027-01-10', label: '2027-W01' });
		expect(lastCompleteWeek('2025-01-07')).toMatchObject({ start: '2024-12-30', end: '2025-01-05', label: '2025-W01' });
	});
});

describe('ISO week labels', () => {
	it('names the week of a day and finds the Monday of a label', () => {
		expect(isoWeekLabel('2026-11-13')).toBe('2026-W46');
		expect(isoWeekStart('2026-W46')).toBe('2026-11-09');
		expect(isoWeekStart('2026-W53')).toBe('2026-12-28');
	});

	it('has no Monday for a label that is not a week', () => {
		for (const label of ['2025-W53', '2026-W00', '2026-W54', '2026-46', 'W46', '2026-11-16']) expect(isoWeekStart(label), label).toBeNull();
	});

	it('takes only real calendar days', () => {
		expect(isCalendarDate('2026-11-13')).toBe(true);
		for (const value of ['2026-02-30', '2026-13-01', '2026-11-13T08:00', '13/11/2026', '', 20261113, null]) expect(isCalendarDate(value), String(value)).toBe(false);
	});
});

describe('weekReport: the phone of the week from Kairos (S1)', () => {
	const FULL = [
		day('2026-11-09', 38),
		day('2026-11-10', 52),
		day('2026-11-11', 71, ['Instagram']),
		day('2026-11-12', 45),
		day('2026-11-13', 29),
		day('2026-11-14', 96, ['Instagram', 'YouTube']),
		day('2026-11-15', 64),
	];

	it('adds the minutes in watched apps, counts the days with a note and the days over a free limit, and names those apps once', () => {
		const phone = weekReport(notes(FULL), TODAY).kairos?.phone;

		expect(phone).toMatchObject({ minutes: 395, daysWithNote: 7, overDays: 2, overApps: ['Instagram', 'YouTube'] });
		expect(phone?.days.map((entry) => entry.date)).toEqual(lastCompleteWeek(TODAY).dates);
	});

	it('leaves a day without a note as no data, never as a zero, and counts only the days with one', () => {
		const phone = weekReport(notes([day('2026-11-09', 0), day('2026-11-13', 3), day('2026-11-16', 40), day('2026-11-08', 50)]), TODAY).kairos?.phone;

		expect(phone?.days.map((entry) => entry.note?.screenMinutes ?? null)).toEqual([0, null, null, null, 3, null, null]);
		expect(phone).toMatchObject({ minutes: 3, daysWithNote: 2, overDays: 0, overApps: [] });
	});

	it('counts one day per date when a copy of the note was read too', () => {
		const phone = weekReport(notes([day('2026-11-13', 3), day('2026-11-13', 300, ['YouTube'])]), TODAY).kairos?.phone;

		expect(phone).toMatchObject({ minutes: 3, daysWithNote: 1, overDays: 0 });
	});

	it('has a week with no note at all when Kairos wrote only other weeks', () => {
		const report = weekReport(notes([day('2026-11-02', 10)]), TODAY);

		expect(report.kairos?.phone).toMatchObject({ minutes: 0, daysWithNote: 0 });
		expect(report.kairos?.phone.days.every((entry) => entry.note === null)).toBe(true);
	});
});

// S2: Kairos is late when its newest day is older than the day before yesterday.
describe('weekReport: when Kairos is late (S2)', () => {
	it('is late on 2026-11-17 when its newest note is from 2026-11-13, in any week', () => {
		expect(weekReport(notes([day('2026-11-09', 0), day('2026-11-13', 3)]), TODAY).kairos).toMatchObject({ newest: '2026-11-13', late: true });
		expect(weekReport(notes([day('2026-11-14', 3)]), TODAY).kairos).toMatchObject({ newest: '2026-11-14', late: true });
	});

	it('is not late while its newest note is from the day before yesterday or later', () => {
		expect(weekReport(notes([day('2026-11-15', 3)]), TODAY).kairos).toMatchObject({ newest: '2026-11-15', late: false });
		expect(weekReport(notes([day('2026-11-16', 3), day('2026-11-01', 1)]), TODAY).kairos).toMatchObject({ newest: '2026-11-16', late: false });
	});
});

describe('weekReport: the money of the week from Cheshbon (S1)', () => {
	it('takes spent, income and net from the weekly note of the week, net as written', () => {
		const report = weekReport(notes([], [week('2026-W45', '2026-11-02', '2026-11-08', 1, 2, 3), week('2026-W46', '2026-11-09', '2026-11-15', 412300, 0, -412300)]), TODAY);

		expect(report.cheshbon?.money).toEqual({ spent: 412300, income: 0, net: -412300 });
	});

	it('has no money for the week when Cheshbon wrote no weekly note for it, daily notes included', () => {
		const report = weekReport(notes([], [week('2026-11-16', '2026-11-16', '2026-11-16', 5000, 0, -5000), week('2026-W45', '2026-11-02', '2026-11-08', 1, 2, 3)]), TODAY);

		expect(report.cheshbon).not.toBeNull();
		expect(report.cheshbon?.money).toBeNull();
	});
});

// S2: Cheshbon is late when its newest weekly note ends more than 8 days before today.
describe('weekReport: when Cheshbon is late (S2)', () => {
	it('is late when its newest weekly note ended on 2026-11-08, nine days before', () => {
		expect(weekReport(notes([], [week('2026-W45', '2026-11-02', '2026-11-08', 0, 0, 0)]), TODAY).cheshbon).toMatchObject({ newestWeek: '2026-11-02', late: true });
	});

	it('is not late eight days after its newest weekly note ended', () => {
		expect(weekReport(notes([], [week('2026-W45', '2026-11-02', '2026-11-08', 0, 0, 0)]), '2026-11-16').cheshbon).toMatchObject({ late: false });
		expect(weekReport(notes([], [week('2026-W46', '2026-11-09', '2026-11-15', 0, 0, 0), week('2026-W45', '2026-11-02', '2026-11-08', 0, 0, 0)]), TODAY).cheshbon).toMatchObject({ newestWeek: '2026-11-09', late: false });
	});

	it('reads the week of a note without `start` or `end` from its period', () => {
		const note: SpendingNote = { period: '2026-W45', start: null, end: null, spent: 0, income: 0, net: 0 };

		expect(weekReport(notes([], [note]), TODAY).cheshbon).toMatchObject({ newestWeek: '2026-11-02', late: true });
	});

	it('is never late with daily notes only, which have no weekly end to be late by', () => {
		expect(weekReport(notes([], [week('2026-10-01', '2026-10-01', '2026-10-01', 0, 0, 0)]), TODAY).cheshbon).toMatchObject({ money: null, newestWeek: null, late: false });
	});
});

// S7: neither app has written a note of its type, or only one has.
describe('weekReport: an app that never wrote', () => {
	it('has neither app when neither wrote a note', () => {
		const report = weekReport(notes([]), TODAY);

		expect(report.kairos).toBeNull();
		expect(report.cheshbon).toBeNull();
		expect(report.week.label).toBe('2026-W46');
	});

	it('has only the app that wrote', () => {
		expect(weekReport(notes([day('2026-11-13', 3)]), TODAY).cheshbon).toBeNull();
		expect(weekReport(notes([], [week('2026-11-16', '2026-11-16', '2026-11-16', 0, 0, 0)]), TODAY).kairos).toBeNull();
	});
});
