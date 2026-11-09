/** A to-do to create in Habitica. */
export interface NewTodo {
	readonly title: string;
	readonly notes: string;
	/** Habitica tag ids to put on the to-do; none when absent or empty. */
	readonly tags?: readonly string[];
	/** Checklist items, in order, all unchecked; none when absent or empty. */
	readonly checklist?: readonly string[];
}

/** A daily to create in Habitica: the habit a campaign asks to build. */
export type NewDaily = NewTodo;

/** Where tasks are created (Habitica in M2). */
export interface TaskCreator {
	/** Creates one to-do and resolves with its Habitica id. Rejects only with a `TaskSourceError`. */
	createTodo(todo: NewTodo): Promise<string>;

	/** Creates one daily and resolves with its Habitica id. Rejects only with a `TaskSourceError`. */
	createDaily(daily: NewDaily): Promise<string>;
}
