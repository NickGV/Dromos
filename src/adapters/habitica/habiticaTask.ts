import { TaskSourceError } from '../../ports';

/**
 * Fields Dromos reads from a Habitica task (`GET /tasks/user`, API v3). Habitica
 * sends many more; they are ignored. `tags` holds Habitica tag ids.
 */
export interface HabiticaTaskDto {
	readonly id?: string;
	readonly _id?: string;
	readonly text: string;
	/** `habit`, `daily`, `todo` or `reward`. */
	readonly type: string;
	readonly completed?: boolean;
	/** Dailies only: due today for the user's day start. */
	readonly isDue?: boolean;
	readonly tags?: readonly string[];
	/** To-dos only: due date as an ISO timestamp; may be missing, `null` or empty. */
	readonly date?: string | null;
	readonly priority?: number;
	readonly streak?: number;
}

/** Checks that an envelope's `data` is a task list; rejects anything else as `Unknown` (S5). */
export function readHabiticaTasks(data: unknown): HabiticaTaskDto[] {
	if (!Array.isArray(data) || !data.every(isHabiticaTask)) {
		throw new TaskSourceError('Unknown', null, 'Habitica sent an unexpected task list');
	}
	return data;
}

function isHabiticaTask(value: unknown): value is HabiticaTaskDto {
	if (typeof value !== 'object' || value === null) return false;
	const task = value as Record<string, unknown>;
	const hasId = typeof task.id === 'string' || typeof task._id === 'string';
	const tagsOk = task.tags === undefined || (Array.isArray(task.tags) && task.tags.every((tag) => typeof tag === 'string'));
	const dateOk = task.date === undefined || task.date === null || typeof task.date === 'string';
	return hasId && typeof task.text === 'string' && typeof task.type === 'string' && tagsOk && dateOk;
}
