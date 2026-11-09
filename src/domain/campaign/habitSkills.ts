import type { CampaignHabit } from './Campaign';

/** The skills of a habit: its own when it declares some, else those of the note it is declared in (a campaign or an area). */
export function habitSkills(habit: Pick<CampaignHabit, 'skills'>, noteSkills: readonly string[]): readonly string[] {
	return habit.skills.length > 0 ? habit.skills : noteSkills;
}
