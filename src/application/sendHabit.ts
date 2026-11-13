import { habitSkills, type CampaignHabit } from '../domain';
import type { LinkResult, RelinkResult, TagCatalog, TaskCreator } from '../ports';
import { sendAndLink, sendAndRelink, type LinkOutcome } from './sendAndLink';

/** What creating a habit's daily needs; the same for a campaign habit and an area habit (ADR-017). */
export interface SendHabitDeps {
	readonly creator: TaskCreator;
	/** Where the `skill/<id>` tags of the daily are found or created. */
	readonly tags: TagCatalog;
	/** A link that opens the note, put in the daily's notes. Built by the composition root. */
	readonly noteLink: (path: string) => string;
	/**
	 * True when Habitica confirmed in the last sync that it no longer has this id (ADR-021): the
	 * only id "Enviar de nuevo" may replace. Built by the composition root from the campaigns' sync.
	 */
	readonly deleted: (habiticaId: string) => boolean;
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
 * skills of the habit (or the note's), on its weekdays and with its checklist (ADR-021), and writes
 * its id back through `link`. A habit that already has an id is never created again. Never rejects.
 */
export async function sendHabit(deps: SendHabitDeps, note: HabitNote, habitTitle: string, link: (habiticaId: string) => Promise<LinkResult>): Promise<LinkOutcome> {
	const habits = note.habits.filter((habit) => habit.title === habitTitle);
	if (habits.length === 0) return { kind: 'not-found' };
	// The habit `link` will write: the first one with that title and no id yet.
	const target = habits.find((habit) => habit.habiticaId === null);
	if (!target) return { kind: 'already-linked' };

	return sendAndLink(() => createDaily(deps, note, target), link);
}

/**
 * "Enviar de nuevo" for the habit `habitTitle` of `note` (ADR-021): the first one with that title
 * whose id Habitica confirmed deleted gets its daily created again, as a first send creates it, and
 * the new id replaces the old one through `relink`, a compare-and-swap on the old id. A habit
 * whose id Habitica did not confirm deleted, or that the note no longer holds, is `changed`, and
 * nothing is created. Never rejects.
 */
export async function resendHabit(
	deps: SendHabitDeps,
	note: HabitNote,
	habitTitle: string,
	relink: (oldId: string, newId: string) => Promise<RelinkResult>,
): Promise<LinkOutcome> {
	const habits = note.habits.filter((habit) => habit.title === habitTitle);
	if (habits.length === 0) return { kind: 'not-found' };
	const target = habits.find((habit) => habit.habiticaId !== null && deps.deleted(habit.habiticaId));
	const oldId = target?.habiticaId;
	if (!target || !oldId) return { kind: 'changed', habiticaId: null };

	return sendAndRelink(() => createDaily(deps, note, target), (newId) => relink(oldId, newId));
}

/**
 * Creates the daily of `habit` in Habitica and resolves with its id: tagged with its skills (or the
 * note's), due on its weekdays, with its checklist. Rejects as the creator does.
 */
export async function createDaily({ creator, tags, noteLink }: SendHabitDeps, note: HabitNote, habit: CampaignHabit): Promise<string> {
	const skills = habitSkills(habit, note.skills);
	// Tags first: if they fail nothing is created, so a retry cannot leave a duplicate daily.
	const tagIds = skills.length > 0 ? await tags.ensureSkillTags(skills) : [];
	return creator.createDaily({
		title: habit.title,
		notes: `Dromos · ${note.title}\n${noteLink(note.path)}`,
		...(tagIds.length > 0 ? { tags: tagIds } : {}),
		repeat: habit.repeat,
		// Sent only now: editing the checklist in the note later changes nothing in Habitica (ADR-021).
		...(habit.checklist.length > 0 ? { checklist: habit.checklist } : {}),
	});
}
