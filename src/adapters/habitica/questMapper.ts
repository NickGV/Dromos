import type { Quest } from '../../domain';
import type { HabiticaTaskDto } from './habiticaTask';

/** Time zone of Dromos' local dates, the same one `Clock.today()` uses. */
export const DROMOS_TIME_ZONE = 'America/Bogota';

const LOCAL_DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
	timeZone: DROMOS_TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
});

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

/** `YYYY-MM-DD` of an ISO timestamp in `DROMOS_TIME_ZONE`; `null` when missing, empty or unreadable. */
export function localDate(timestamp: string | null | undefined): string | null {
	if (!timestamp) return null;
	const instant = new Date(timestamp);
	if (Number.isNaN(instant.getTime())) return null;
	const parts = LOCAL_DATE_FORMAT.formatToParts(instant);
	const part = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? '';
	return `${part('year')}-${part('month')}-${part('day')}`;
}
