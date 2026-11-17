import { describe, expect, it } from 'vitest';
import { LoadWeekReport } from '../../src/application/LoadWeekReport';
import type { AppNotes } from '../../src/domain';
import type { AppNoteRepository } from '../../src/ports';
import { FixedClock } from '../fakes/FixedClock';

const CLOCK = new FixedClock(new Date('2026-11-17T15:00:00Z'), '2026-11-17');

function repository(notes: AppNotes | Error): AppNoteRepository & { reads: number } {
	return {
		reads: 0,
		read() {
			this.reads += 1;
			return notes instanceof Error ? Promise.reject(notes) : Promise.resolve(notes);
		},
	};
}

describe('LoadWeekReport: the card "Your week" from the vault alone (app-reports S1-S3)', () => {
	it('reads both apps once and reports the last complete week by the local date of the clock', async () => {
		const notes = repository({
			kairos: [{ date: '2026-11-13', screenMinutes: 3, underLimit: [], exceeded: [] }],
			cheshbon: [{ period: '2026-W46', start: '2026-11-09', end: '2026-11-15', spent: 412300, income: 0, net: -412300 }],
		});

		const report = await new LoadWeekReport({ notes, clock: CLOCK }).execute();

		expect(notes.reads).toBe(1);
		expect(report.week).toMatchObject({ start: '2026-11-09', end: '2026-11-15', label: '2026-W46' });
		expect(report.kairos).toMatchObject({ newest: '2026-11-13', late: true, phone: { minutes: 3, daysWithNote: 1 } });
		expect(report.cheshbon).toMatchObject({ money: { spent: 412300, income: 0, net: -412300 }, late: false });
	});

	it('reports neither app when neither wrote a note', async () => {
		const report = await new LoadWeekReport({ notes: repository({ kairos: [], cheshbon: [] }), clock: CLOCK }).execute();

		expect(report.kairos).toBeNull();
		expect(report.cheshbon).toBeNull();
	});

	it('never rejects: notes that cannot be read show as no app at all', async () => {
		const report = await new LoadWeekReport({ notes: repository(new Error('vault')), clock: CLOCK }).execute();

		expect(report).toMatchObject({ kairos: null, cheshbon: null, week: { label: '2026-W46' } });
	});
});
