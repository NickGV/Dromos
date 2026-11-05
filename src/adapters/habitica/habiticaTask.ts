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
	/** To-dos only: when it was completed, as an ISO timestamp; may be missing or `null`. */
	readonly dateCompleted?: string | null;
	/** Dailies only: due today for the user's day start. */
	readonly isDue?: boolean;
	readonly tags?: readonly string[];
	/** To-dos only: due date as an ISO timestamp; may be missing, `null` or empty. */
	readonly date?: string | null;
	readonly priority?: number;
	readonly streak?: number;
	/** Dailies and to-dos: subtasks as `{ completed, text, id }`. Not validated: it is display only (missions A3). */
	readonly checklist?: unknown;
}

/** Checks that an envelope's `data` is a task list; rejects anything else as `Unknown` (S5). */
export function readHabiticaTasks(data: unknown): HabiticaTaskDto[] {
	if (!Array.isArray(data) || !data.every(isHabiticaTask)) {
		throw new TaskSourceError('Unknown', null, 'Habitica sent an unexpected task list');
	}
	return data;
}

/** Checks that an envelope's `data` is one task; rejects anything else as `Unknown` (S5). */
export function readHabiticaTask(data: unknown): HabiticaTaskDto {
	if (!isHabiticaTask(data)) throw new TaskSourceError('Unknown', null, 'Habitica sent an unexpected task');
	return data;
}

function isHabiticaTask(value: unknown): value is HabiticaTaskDto {
	if (typeof value !== 'object' || value === null) return false;
	const task = value as Record<string, unknown>;
	const hasId = typeof task.id === 'string' || typeof task._id === 'string';
	const tagsOk = task.tags === undefined || (Array.isArray(task.tags) && task.tags.every((tag) => typeof tag === 'string'));
	const dateOk = task.date === undefined || task.date === null || typeof task.date === 'string';
	const completedDateOk = task.dateCompleted === undefined || task.dateCompleted === null || typeof task.dateCompleted === 'string';
	return hasId && typeof task.text === 'string' && typeof task.type === 'string' && tagsOk && dateOk && completedDateOk;
}

/** A Habitica tag: only its id and name matter. */
export interface HabiticaTagDto {
	readonly id: string;
	readonly name: string;
}

/** Checks that an envelope's `data` is a tag list; rejects anything else as `Unknown`. */
export function readHabiticaTags(data: unknown): HabiticaTagDto[] {
	if (!Array.isArray(data)) throw new TaskSourceError('Unknown', null, 'Habitica sent an unexpected tag list');
	return data.map((entry: unknown) => {
		const tag = typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>) : {};
		const id = typeof tag.id === 'string' ? tag.id : tag._id;
		if (typeof id !== 'string' || typeof tag.name !== 'string') throw new TaskSourceError('Unknown', null, 'Habitica sent an unexpected tag list');
		return { id, name: tag.name };
	});
}
