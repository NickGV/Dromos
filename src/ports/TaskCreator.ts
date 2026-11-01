/** A to-do to create in Habitica. */
export interface NewTodo {
	readonly title: string;
	readonly notes: string;
	/** Habitica tag ids to put on the to-do; none when absent or empty. */
	readonly tags?: readonly string[];
}

/** Where tasks are created (Habitica in M2). */
export interface TaskCreator {
	/** Creates one to-do and resolves with its Habitica id. Rejects only with a `TaskSourceError`. */
	createTodo(todo: NewTodo): Promise<string>;
}
