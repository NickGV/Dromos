import type { Checklist, Quest } from '../../domain';
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
		...checklistOf(task.checklist),
	};
	if (task.type === 'daily') return { ...base, type: 'daily', dueToday: task.isDue === true, dueDate: null };
	if (task.type === 'todo') return { ...base, type: 'todo', dueToday: false, dueDate: localDate(task.date) };
	return null;
}

/**
 * The subtasks Habitica sent, in order and counted, or nothing when there are none. Every object
 * is a subtask, done only when its `completed` is `true`, titled by its `text` (empty when it has
 * none); anything else in the list is skipped instead of rejecting the task (missions A3).
 */
export function checklistOf(value: unknown): { checklist?: Checklist } {
	if (!Array.isArray(value)) return {};
	const items = value
		.filter((item): item is { completed?: unknown; text?: unknown } => typeof item === 'object' && item !== null)
		.map((item) => ({ title: typeof item.text === 'string' ? item.text : '', completed: item.completed === true }));
	return items.length === 0 ? {} : { checklist: { done: items.filter((item) => item.completed).length, total: items.length, items } };
}

/** `YYYY-MM-DD` of an ISO timestamp in Dromos' time zone, as `Clock.today()`; `null` when missing, empty or unreadable. */
export function localDate(timestamp: string | null | undefined): string | null {
	if (!timestamp) return null;
	const instant = new Date(timestamp);
	return Number.isNaN(instant.getTime()) ? null : localDateOf(instant);
}
