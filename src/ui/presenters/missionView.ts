import { isMission, type Checklist, type Subtask } from '../../domain';
import type { Translator } from '../../i18n';

/** The toggle of a mission and, once open, its subtasks (missions S5). Read only: Dromos completes no subtask. */
export interface SubtasksView {
	readonly open: boolean;
	/** "Show the subtasks of <title>" or "Hide …": the toggle's accessible name. */
	readonly toggleLabel: string;
	/** Every subtask in order while open; empty while folded. */
	readonly items: readonly Subtask[];
}

/** The subtasks of a mission, folded or open; `undefined` for a task that is no mission or whose subtask titles are unknown. */
export function subtasksView(checklist: Checklist | undefined, open: boolean, title: string, t: Translator): SubtasksView | undefined {
	if (!isMission(checklist) || checklist.items === undefined) return undefined;
	return open
		? { open: true, toggleLabel: t('mission.subtasks.hide', { title }), items: checklist.items }
		: { open: false, toggleLabel: t('mission.subtasks.show', { title }), items: [] };
}
