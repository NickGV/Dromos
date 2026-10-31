import type { NewTodo, TaskCreator } from '../../src/ports';

/** Task creator that records what it was asked to create and hands out sequential ids. */
export class FakeTaskCreator implements TaskCreator {
	readonly created: NewTodo[] = [];
	failWith: Error | null = null;

	createTodo(todo: NewTodo): Promise<string> {
		if (this.failWith) return Promise.reject(this.failWith);
		this.created.push(todo);
		return Promise.resolve(`3f2a1c8e-0000-4000-8000-${String(this.created.length).padStart(12, '0')}`);
	}
}
