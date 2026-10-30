import type { Quest } from './Quest';

/**
 * Today's quests from an already-mapped list (S6). Dailies due today stay,
 * completed ones included, in source order. Then pending to-dos: overdue and due
 * today first by date ascending, then undated ones in source order; future-dated
 * and completed to-dos are dropped. Each returned to-do gets `dueToday` derived
 * from its date. `today` is the local date as `YYYY-MM-DD`, usually `Clock.today()`.
 */
export function selectTodaysQuests(quests: readonly Quest[], today: string): Quest[] {
	const dailies = quests.filter((quest) => quest.type === 'daily' && quest.dueToday);
	const pendingTodos = quests.filter((quest) => quest.type === 'todo' && !quest.completed);
	const dated = pendingTodos.filter((quest) => quest.dueDate !== null && quest.dueDate <= today).sort(byDueDate);
	const undated = pendingTodos.filter((quest) => quest.dueDate === null);
	const todos = [...dated, ...undated].map((quest) => ({ ...quest, dueToday: quest.dueDate !== null }));
	return [...dailies, ...todos];
}

// ISO dates sort as plain strings; Array#sort is stable, so ties keep source order.
function byDueDate(a: Quest, b: Quest): number {
	const left = a.dueDate ?? '';
	const right = b.dueDate ?? '';
	return left < right ? -1 : left > right ? 1 : 0;
}
