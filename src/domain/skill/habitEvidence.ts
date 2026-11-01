/** What the habit evidence needs from a task: dailies carry a streak, to-dos do not. */
export interface StreakTask {
	readonly kind: 'todo' | 'daily';
	readonly skills: readonly string[];
	readonly streak?: number | null;
}

/**
 * The longest current streak among the dailies tagged with each skill: the evidence of a
 * `habit` requirement (S7). The streak is Habitica's own, so one missed day sends it back to
 * zero and so the evidence (S8). To-dos, dailies without a skill and invalid streaks add nothing.
 */
export function longestStreakBySkill(tasks: readonly StreakTask[]): Map<string, number> {
	const longest = new Map<string, number>();
	for (const task of tasks) {
		if (task.kind !== 'daily' || typeof task.streak !== 'number' || !Number.isFinite(task.streak) || task.streak <= 0) continue;
		for (const skill of task.skills) longest.set(skill, Math.max(longest.get(skill) ?? 0, Math.floor(task.streak)));
	}
	return longest;
}
