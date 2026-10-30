import type { Quest } from '../../src/domain';

/** A pending daily due today; override any field. */
export function aQuest(id: string, overrides: Partial<Quest> = {}): Quest {
	return {
		id,
		title: `Quest ${id}`,
		type: 'daily',
		completed: false,
		skillTags: [],
		dueToday: true,
		dueDate: null,
		...overrides,
	};
}
