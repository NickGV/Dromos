import { weekReport, type AppNotes, type WeekReport } from '../domain';
import type { AppNoteRepository, Clock } from '../ports';

export interface LoadWeekReportDeps {
	readonly notes: AppNoteRepository;
	readonly clock: Clock;
}

const NO_NOTES: AppNotes = { kairos: [], cheshbon: [] };

/**
 * Reads the card "Your week" (app-reports S1-S3) when home opens and after each sync, as the titles
 * are, never per render: the last complete ISO week by the clock's local date, from the notes Kairos
 * and Cheshbon wrote. It reads the vault only, never Habitica, and writes nothing. Notes that cannot
 * be read count as none, so the card is not drawn; it never rejects.
 */
export class LoadWeekReport {
	constructor(private readonly deps: LoadWeekReportDeps) {}

	async execute(): Promise<WeekReport> {
		let notes = NO_NOTES;
		try {
			notes = await this.deps.notes.read();
		} catch {
			// No data is never a failure the card shows (S3).
		}
		return weekReport(notes, this.deps.clock.today());
	}
}
