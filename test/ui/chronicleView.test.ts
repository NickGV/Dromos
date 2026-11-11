import { describe, expect, it } from 'vitest';
import type { DeedEntry } from '../../src/application';
import { createTranslator } from '../../src/i18n';
import { chronicleView, deedDayText } from '../../src/ui/presenters/chronicleView';

const en = createTranslator('en');
const es = createTranslator('es');
const TODAY = '2026-11-03';

const deed = (overrides: Partial<DeedEntry> = {}): DeedEntry => ({ date: '2026-11-02', task: 'Read 20 pages', xp: 10, source: 'complete', skills: [{ id: 'lector', name: 'Reader' }], ...overrides });
const texts = (deeds: readonly DeedEntry[], t = en): string[] => chronicleView(deeds, TODAY, t)?.lines.map((line) => line.text) ?? [];

describe('chronicleView: each deed as a journal line (game-ui S18)', () => {
	it('reads day, task and what each skill gained', () => {
		expect(texts([deed()])).toEqual(['Yesterday · Read 20 pages · Reader +10 XP']);
	});

	it('names every skill of the deed, the XP once', () => {
		const two = deed({ skills: [{ id: 'lector', name: 'Reader' }, { id: 'escriba', name: 'Scribe' }] });
		const three = deed({ skills: [{ id: 'lector', name: 'Reader' }, { id: 'escriba', name: 'Scribe' }, { id: 'cuidador', name: 'Caregiver' }] });

		expect(texts([two, three])).toEqual(['Yesterday · Read 20 pages · Reader and Scribe +10 XP', 'Yesterday · Read 20 pages · Reader, Scribe and Caregiver +10 XP']);
		expect(texts([three], es)).toEqual(['Ayer · Read 20 pages · Reader, Scribe y Caregiver +10 XP']);
	});

	it('gives a deed without skill its XP alone', () => {
		expect(texts([deed({ task: 'Stretch', skills: [] })])).toEqual(['Yesterday · Stretch · +10 XP']);
		expect(texts([deed({ task: 'Stretch', skills: [] })], es)).toEqual(['Ayer · Stretch · +10 XP']);
	});

	it('reads a streak bonus as such', () => {
		expect(texts([deed({ source: 'streak', xp: 5, skills: [] })])).toEqual(['Yesterday · Streak bonus · +5 XP']);
		expect(texts([deed({ source: 'streak', xp: 5 })])).toEqual(['Yesterday · Streak bonus · Reader +5 XP']);
		expect(texts([deed({ source: 'streak', xp: 5, skills: [] })], es)).toEqual(['Ayer · Bonus de racha · +5 XP']);
	});

	it('reads a revert, and a streak bonus taken back, as undone with a minus sign', () => {
		const revert = deed({ source: 'revert', xp: -10, skills: [] });
		const takenBack = deed({ source: 'streak', xp: -5, skills: [] });

		expect(texts([revert, takenBack])).toEqual(['Yesterday · Undone · Read 20 pages · −10 XP', 'Yesterday · Undone · Streak bonus · −5 XP']);
		expect(texts([deed({ source: 'revert', xp: -10 })])).toEqual(['Yesterday · Undone · Read 20 pages · Reader −10 XP']);
		expect(texts([revert], es)).toEqual(['Ayer · Deshecho · Read 20 pages · −10 XP']);
		expect(chronicleView([revert, deed()], TODAY, en)?.lines.map((line) => line.undone)).toEqual([true, false]);
	});

	it('keeps the parts apart for the line to style, in the order they read', () => {
		expect(chronicleView([deed({ source: 'revert', xp: -10 })], TODAY, en)?.lines[0]).toMatchObject({ day: 'Yesterday', parts: ['Undone', 'Read 20 pages', 'Reader −10 XP'], undone: true });
	});

	it('is titled "Chronicle", in Spanish "Crónica"', () => {
		expect(chronicleView([deed()], TODAY, en)?.title).toBe('Chronicle');
		expect(chronicleView([deed()], TODAY, es)?.title).toBe('Crónica');
	});

	it('gives each line a key of its own, even for two deeds that read the same', () => {
		const keys = chronicleView([deed(), deed()], TODAY, en)?.lines.map((line) => line.key) ?? [];

		expect(new Set(keys).size).toBe(2);
	});
});

describe('chronicleView: the three newest, the rest under "View more" (home-fit S2)', () => {
	const five = ['Read 20 pages', 'Morning run', 'Plan the week', 'Call the bank', 'Stretch'].map((task) => deed({ task, skills: [] }));
	const tasks = (view: ReturnType<typeof chronicleView>) => view?.lines.map((line) => line.parts[0]) ?? [];

	it('shows the three newest deeds under "View more (2)" at first', () => {
		const view = chronicleView(five, TODAY, en);

		expect(tasks(view)).toEqual(['Read 20 pages', 'Morning run', 'Plan the week']);
		expect(view?.more).toEqual({ label: 'View more (2)', expanded: false });
		expect(chronicleView(five, TODAY, es)?.more).toEqual({ label: 'Ver más (2)', expanded: false });
	});

	it('shows all five once expanded, under "View less"', () => {
		const view = chronicleView(five, TODAY, en, { expanded: true });

		expect(tasks(view)).toEqual(['Read 20 pages', 'Morning run', 'Plan the week', 'Call the bank', 'Stretch']);
		expect(view?.more).toEqual({ label: 'View less', expanded: true });
	});

	it('gives three deeds or fewer no toggle', () => {
		expect(chronicleView(five.slice(0, 3), TODAY, en)).not.toHaveProperty('more');
		expect(tasks(chronicleView(five.slice(0, 3), TODAY, en))).toHaveLength(3);
	});
});

describe('chronicleView: nothing to tell (game-ui S18)', () => {
	it('shows nothing before the first game sync and while the ledger has no deed', () => {
		expect(chronicleView(undefined, TODAY, en)).toBeNull();
		expect(chronicleView([], TODAY, en)).toBeNull();
	});
});

describe('deedDayText: the day of a deed next to today (game-ui S18)', () => {
	it('says today, yesterday and the days of the last week, then the short date', () => {
		expect(['2026-11-03', '2026-11-02', '2026-11-01', '2026-10-28', '2026-10-27', '2026-09-30'].map((date) => deedDayText(date, TODAY, en))).toEqual([
			'Today',
			'Yesterday',
			'2 days ago',
			'6 days ago',
			'27 Oct',
			'30 Sep',
		]);
	});

	it('says it in Spanish', () => {
		expect(['2026-11-03', '2026-11-02', '2026-10-30', '2026-10-20'].map((date) => deedDayText(date, TODAY, es))).toEqual(['Hoy', 'Ayer', 'Hace 4 días', '20 oct']);
	});

	it('follows the clock: the same deed is yesterday on the next day', () => {
		expect([deedDayText('2026-11-03', '2026-11-03', en), deedDayText('2026-11-03', '2026-11-04', en)]).toEqual(['Today', 'Yesterday']);
	});

	it('keeps a day it cannot place, one after today included, as written', () => {
		expect(deedDayText('2026-11-05', TODAY, en)).toBe('5 Nov');
		expect(deedDayText('not a day', TODAY, en)).toBe('not a day');
	});
});

describe('chronicleView: the way into the history (M9 S3)', () => {
	it('offers "View history" with any number of deeds, also with fewer than three', () => {
		expect(chronicleView([deed()], TODAY, en)?.history).toBe('View history');
		expect(chronicleView([deed(), deed(), deed(), deed()], TODAY, en)?.history).toBe('View history');
		expect(chronicleView([deed()], TODAY, es)?.history).toBe('Ver historial');
	});
});
