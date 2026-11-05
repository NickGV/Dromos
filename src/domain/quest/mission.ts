import type { Checklist } from './Quest';

/** A task with at least this many subtasks reads as a mission (missions S1). */
export const MISSION_MIN_SUBTASKS = 3;

/** True for a checklist long enough to make its task a mission; display only, it changes no XP (missions S2). */
export function isMission(checklist: Checklist | undefined): checklist is Checklist {
	return checklist !== undefined && checklist.total >= MISSION_MIN_SUBTASKS;
}
