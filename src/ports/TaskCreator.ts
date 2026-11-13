import type { Weekday } from '../domain';

/** A to-do to create in Habitica. */
export interface NewTodo {
	readonly title: string;
	readonly notes: string;
	/** Habitica tag ids to put on the to-do; none when absent or empty. */
	readonly tags?: readonly string[];
	/** Checklist items, in order, all unchecked; none when absent or empty. */
	readonly checklist?: readonly string[];
}

/**
 * A daily to create in Habitica: the one a campaign or an area asks for (ADR-021). It repeats on
 * `repeat`, and its checklist, if any, is sent only now: editing the note later changes nothing there.
 */
export interface NewDaily extends NewTodo {
	/** The weekdays it is due on, every week; all seven for every day. */
	readonly repeat: readonly Weekday[];
}

/** Where tasks are created (Habitica in M2). */
export interface TaskCreator {
	/** Creates one to-do and resolves with its Habitica id. Rejects only with a `TaskSourceError`. */
	createTodo(todo: NewTodo): Promise<string>;

	/** Creates one daily and resolves with its Habitica id. Rejects only with a `TaskSourceError`. */
	createDaily(daily: NewDaily): Promise<string>;
}
