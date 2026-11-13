import type { Area } from '../../src/domain';
import type { AreaRepository, LinkResult, RelinkResult } from '../../src/ports';

/** Area repository backed by a list, for use-case tests. */
export class InMemoryAreaRepository implements AreaRepository {
	constructor(private areas: readonly Area[] = []) {}

	listAreas(): Promise<readonly Area[]> {
		return Promise.resolve(this.areas);
	}

	/** Same check-and-set as the vault: the first habit with that title and no id gets it. */
	linkHabitHabiticaId(areaPath: string, habitTitle: string, habiticaId: string): Promise<LinkResult> {
		const area = this.areas.find((candidate) => candidate.path === areaPath);
		if (!area) return Promise.resolve('not-found');
		const index = area.habits.findIndex((habit) => habit.title === habitTitle && habit.habiticaId === null);
		if (index === -1) return Promise.resolve(area.habits.some((habit) => habit.title === habitTitle) ? 'already-linked' : 'not-found');
		const habits = area.habits.map((habit, position) => (position === index ? { ...habit, habiticaId } : habit));
		this.areas = this.areas.map((candidate) => (candidate === area ? { ...area, habits } : candidate));
		return Promise.resolve('linked');
	}

	/** Same compare-and-swap as the vault: the first habit with that title whose id is still `oldId` gets `newId`. */
	relinkHabitHabiticaId(areaPath: string, habitTitle: string, oldId: string, newId: string): Promise<RelinkResult> {
		const area = this.areas.find((candidate) => candidate.path === areaPath);
		const index = area ? area.habits.findIndex((habit) => habit.title === habitTitle && habit.habiticaId === oldId) : -1;
		if (!area || index === -1) return Promise.resolve('changed');
		const habits = area.habits.map((habit, position) => (position === index ? { ...habit, habiticaId: newId } : habit));
		this.areas = this.areas.map((candidate) => (candidate === area ? { ...area, habits } : candidate));
		return Promise.resolve('relinked');
	}
}
