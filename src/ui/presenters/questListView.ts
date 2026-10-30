import type { Quest } from '../../domain';

/** Whether a to-do is late or due today. */
export type DueTone = 'overdue' | 'today';

/** One quest row as `QuestList` renders it. */
export interface QuestRowView {
	readonly id: string;
	readonly title: string;
	/** Completed dailies are shown struck through. */
	readonly completed: boolean;
	/** To-dos with a date up to today; `null` for dailies and undated to-dos. */
	readonly due: { readonly tone: DueTone; readonly label: string } | null;
}

/** Today's quests split for the list (S8): dailies first, then to-dos. */
export interface QuestListView {
	readonly dailies: readonly QuestRowView[];
	readonly todos: readonly QuestRowView[];
	/** Shown instead of the list when there is nothing to show, else `null`. */
	readonly emptyText: string | null;
}

/**
 * Splits the session's quests for the list, keeping source order (the task source
 * already sorted them). `quests` is `null` before the first sync. `today` is
 * `Clock.today()`, so to-do labels follow the current day, not the sync day.
 */
export function questListView(quests: readonly Quest[] | null, today: string): QuestListView {
	if (quests === null) {
		return { dailies: [], todos: [], emptyText: 'Las quests aparecerán después de sincronizar con Habitica.' };
	}
	return {
		dailies: quests.filter((quest) => quest.type === 'daily').map((quest) => row(quest, null)),
		todos: quests.filter((quest) => quest.type === 'todo').map((quest) => row(quest, dueOf(quest.dueDate, today))),
		emptyText: quests.length === 0 ? 'No hay quests para hoy' : null,
	};
}

function row(quest: Quest, due: QuestRowView['due']): QuestRowView {
	return { id: quest.id, title: quest.title, completed: quest.completed, due };
}

// ISO dates compare as plain strings; future dates get no label.
function dueOf(dueDate: string | null, today: string): QuestRowView['due'] {
	if (dueDate === null || dueDate > today) return null;
	return dueDate < today ? { tone: 'overdue', label: 'Vencida' } : { tone: 'today', label: 'Hoy' };
}
