/** Habitica task kinds Dromos shows as quests. */
export type QuestType = 'daily' | 'todo';

/**
 * A Habitica task as Dromos reads it. Read-only: it comes from a `TaskSource`
 * and Dromos never edits it in M1.
 */
export interface Quest {
	/** Habitica task id. */
	readonly id: string;
	readonly title: string;
	readonly type: QuestType;
	/** Done today (dailies) or done for good (to-dos). */
	readonly completed: boolean;
	/** Skill tags linked to the quest; empty when it has none. */
	readonly skillTags: readonly string[];
	/**
	 * Has to be done today. Dailies: Habitica's `isDue`. To-dos: `dueDate` is today
	 * or earlier, derived by `selectTodaysQuests`, so sources may leave it `false`.
	 */
	readonly dueToday: boolean;
	/**
	 * To-dos only: local due date as `YYYY-MM-DD`, in the same time zone as
	 * `Clock.today()`, or `null` when undated. Always `null` for dailies.
	 */
	readonly dueDate: string | null;
}
