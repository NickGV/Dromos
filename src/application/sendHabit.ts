import { habitSkills, type CampaignHabit } from '../domain';
import type { LinkResult, TagCatalog, TaskCreator } from '../ports';
import { sendAndLink, type LinkOutcome } from './sendAndLink';

/** What creating a habit's daily needs; the same for a campaign habit and an area habit (ADR-017). */
export interface SendHabitDeps {
	readonly creator: TaskCreator;
	/** Where the `skill/<id>` tags of the daily are found or created. */
	readonly tags: TagCatalog;
	/** A link that opens the note, put in the daily's notes. Built by the composition root. */
	readonly noteLink: (path: string) => string;
}

/** The note a habit is declared in: a project campaign or an area. */
export interface HabitNote {
	readonly path: string;
	readonly title: string;
	/** The default of the habits that declare no skill. */
	readonly skills: readonly string[];
	readonly habits: readonly CampaignHabit[];
}

/**
 * "Enviar a Habitica" for the habit `habitTitle` of `note`: creates its daily, tagged with the
 * skills of the habit (or the note's), and writes its id back through `link`. A habit that already
 * has an id is never created again. Never rejects.
 */
export async function sendHabit(deps: SendHabitDeps, note: HabitNote, habitTitle: string, link: (habiticaId: string) => Promise<LinkResult>): Promise<LinkOutcome> {
	const { creator, tags, noteLink } = deps;
	const habits = note.habits.filter((habit) => habit.title === habitTitle);
	if (habits.length === 0) return { kind: 'not-found' };
	// The habit `link` will write: the first one with that title and no id yet.
	const target = habits.find((habit) => habit.habiticaId === null);
	if (!target) return { kind: 'already-linked' };
	const skills = habitSkills(target, note.skills);

	return sendAndLink(async () => {
		// Tags first: if they fail nothing is created, so a retry cannot leave a duplicate daily.
		const tagIds = skills.length > 0 ? await tags.ensureSkillTags(skills) : [];
		return creator.createDaily({
			title: habitTitle,
			notes: `Dromos · ${note.title}\n${noteLink(note.path)}`,
			...(tagIds.length > 0 ? { tags: tagIds } : {}),
		});
	}, link);
}
