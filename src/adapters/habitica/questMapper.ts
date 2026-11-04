import type { Quest } from '../../domain';
import { localDateOf } from '../localDate';
import type { HabiticaTaskDto } from './habiticaTask';

/**
 * Maps a Habitica daily or to-do to a `Quest`; `null` for habits and rewards.
 * To-dos get `dueToday: false`: `selectTodaysQuests` derives it from `dueDate`.
 */
export function questFromHabiticaTask(task: HabiticaTaskDto): Quest | null {
	const base = {
		id: task.id ?? task._id ?? '',
		title: task.text,
		completed: task.completed === true,
		skillTags: [...(task.tags ?? [])],
	};
	if (task.type === 'daily') return { ...base, type: 'daily', dueToday: task.isDue === true, dueDate: null };
	if (task.type === 'todo') return { ...base, type: 'todo', dueToday: false, dueDate: localDate(task.date) };
	return null;
}

/** `YYYY-MM-DD` of an ISO timestamp in Dromos' time zone, as `Clock.today()`; `null` when missing, empty or unreadable. */
export function localDate(timestamp: string | null | undefined): string | null {
	if (!timestamp) return null;
	const instant = new Date(timestamp);
	return Number.isNaN(instant.getTime()) ? null : localDateOf(instant);
}
