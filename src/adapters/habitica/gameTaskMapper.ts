import { skillIdFromTag } from '../../domain';
import type { ObservedTask } from '../../ports';
import type { HabiticaTagDto, HabiticaTaskDto } from './habiticaTask';
import { localDate } from './questMapper';

/** Habitica tag id to skill id, for the tags named `skill/<id>`. */
export function skillTagIds(tags: readonly HabiticaTagDto[]): Map<string, string> {
	const ids = new Map<string, string>();
	for (const tag of tags) {
		const skill = skillIdFromTag(tag.name);
		if (skill !== null) ids.set(tag.id, skill);
	}
	return ids;
}

/**
 * Maps a Habitica daily or to-do to what the game needs; `null` for habits and rewards (S12).
 * A completed to-do is dated with the local day it was completed; a daily is dated `today`,
 * because Habitica only says whether it is done now. A missing priority is Habitica's default, 1.
 */
export function observedTaskFromHabiticaTask(task: HabiticaTaskDto, skillTags: ReadonlyMap<string, string>, today: string): ObservedTask | null {
	if (task.type !== 'daily' && task.type !== 'todo') return null;
	const completed = task.completed === true;
	const skills = [...new Set((task.tags ?? []).flatMap((tag) => skillTags.get(tag) ?? []))];
	const base = {
		habiticaId: task.id ?? task._id ?? '',
		title: task.text,
		priority: typeof task.priority === 'number' && Number.isFinite(task.priority) && task.priority > 0 ? task.priority : 1,
		skills,
		completed,
	};
	if (task.type === 'daily') {
		const streak = typeof task.streak === 'number' && Number.isFinite(task.streak) && task.streak > 0 ? Math.floor(task.streak) : 0;
		return { ...base, kind: 'daily', date: today, streak };
	}
	return { ...base, kind: 'todo', date: completed ? (localDate(task.dateCompleted) ?? today) : today, streak: null };
}
