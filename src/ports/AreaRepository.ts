import type { Area } from '../domain';
import type { LinkResult, RelinkResult } from './CampaignRepository';

/** Area hubs stored in the vault: `archeion` notes that are not archived (ADR-017). */
export interface AreaRepository {
	/** The areas, ordered by title. Their habits come back with no streak: Habitica answers that later. */
	listAreas(): Promise<readonly Area[]>;

	/**
	 * The check-and-set of a campaign habit, on an area: writes `habiticaId` into the first habit
	 * with `habitTitle` and no id yet. It never overwrites an id (`already-linked`) and writes
	 * nothing else in the note.
	 */
	linkHabitHabiticaId(areaPath: string, habitTitle: string, habiticaId: string): Promise<LinkResult>;

	/**
	 * "Enviar de nuevo" on an area habit (ADR-021): writes `newId` into the first habit with
	 * `habitTitle` whose id is still exactly `oldId`, and nothing else; `changed` when it no longer is.
	 */
	relinkHabitHabiticaId(areaPath: string, habitTitle: string, oldId: string, newId: string): Promise<RelinkResult>;
}
