import type { NewDaily, NewTodo, TaskCreator } from '../../src/ports';

/** Task creator that records what it was asked to create and hands out sequential ids. */
export class FakeTaskCreator implements TaskCreator {
	readonly created: NewTodo[] = [];
	readonly createdDailies: NewDaily[] = [];
	failWith: Error | null = null;

	createTodo(todo: NewTodo): Promise<string> {
		if (this.failWith) return Promise.reject(this.failWith);
		this.created.push(todo);
		return Promise.resolve(this.idFor(this.created.length));
	}

	createDaily(daily: NewDaily): Promise<string> {
		if (this.failWith) return Promise.reject(this.failWith);
		this.createdDailies.push(daily);
		return Promise.resolve(this.idFor(100 + this.createdDailies.length));
	}

	private idFor(n: number): string {
		return `3f2a1c8e-0000-4000-8000-${String(n).padStart(12, '0')}`;
	}
}
