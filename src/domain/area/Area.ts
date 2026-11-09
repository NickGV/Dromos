import type { CampaignHabit } from '../campaign/Campaign';
import { habitSkills } from '../campaign/habitSkills';

/** The skill of the reading to-do and of the Library's Archeion (Q027, ADR-016, ADR-017). */
export const READING_SKILL = 'lector';

/**
 * An area hub: an `archeion` note that is not archived (ADR-013, ADR-017). It is never a campaign:
 * it has no phases or tasks, only the habits it asks to build, with the schema and rules of a
 * campaign habit (a Habitica daily, 21 days by default, a strict streak).
 */
export interface Area {
	/** Vault path of the note. */
	readonly path: string;
	readonly title: string;
	/** Skill ids the area trains; the default of the habits that declare none. Empty when it has none. */
	readonly skills: readonly string[];
	readonly habits: readonly CampaignHabit[];
}

/**
 * True for an area habit the Library shows (ADR-017): its skills, its own or else its area's,
 * include the reading skill. So a `lector` habit shows from any area, and a habit with a skill of
 * its own other than `lector` does not, even in a `lector` area.
 */
export function isReadingHabit(habit: Pick<CampaignHabit, 'skills'>, area: Pick<Area, 'skills'>): boolean {
	return habitSkills(habit, area.skills).includes(READING_SKILL);
}
