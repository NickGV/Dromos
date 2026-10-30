/** Every way a task source can fail (S5). */
export const TASK_SOURCE_ERROR_KINDS = ['Unauthorized', 'RateLimited', 'Offline', 'Unknown'] as const;
export type TaskSourceErrorKind = (typeof TASK_SOURCE_ERROR_KINDS)[number];

/**
 * Typed failure of a `TaskSource`. Callers branch on `kind`, never on `message`.
 * The message must never contain credentials (S9).
 */
export class TaskSourceError extends Error {
	override readonly name = 'TaskSourceError';

	constructor(
		readonly kind: TaskSourceErrorKind,
		/** Seconds to wait before retrying; set only for `RateLimited` when the source sent one, else `null`. */
		readonly retryAfterSeconds: number | null = null,
		message: string = kind,
	) {
		super(message);
	}
}
