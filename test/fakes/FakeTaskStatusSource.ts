import type { TaskStatus, TaskStatusSource } from '../../src/ports';

type Step = () => Promise<ReadonlyMap<string, TaskStatus>>;

/** Status source scripted per call. `calls` counts requests; `askedFor` keeps the ids of each one. */
export class FakeTaskStatusSource implements TaskStatusSource {
	calls = 0;
	readonly askedFor: (readonly string[])[] = [];
	private readonly steps: Step[] = [];

	/** The next call resolves with these answers. */
	resolves(answers: Record<string, TaskStatus>): this {
		this.steps.push(() => Promise.resolve(new Map(Object.entries(answers))));
		return this;
	}

	/** The next call rejects with `reason`. */
	rejects(reason: unknown): this {
		this.steps.push(async () => {
			await Promise.resolve();
			throw reason;
		});
		return this;
	}

	/** The next call stays pending until the returned function runs. */
	holds(answers: Record<string, TaskStatus>): () => void {
		let release: (() => void) | undefined;
		const pending = new Promise<ReadonlyMap<string, TaskStatus>>((resolve) => {
			release = () => resolve(new Map(Object.entries(answers)));
		});
		this.steps.push(() => pending);
		return () => release?.();
	}

	fetchStatuses(ids: readonly string[]): Promise<ReadonlyMap<string, TaskStatus>> {
		this.calls += 1;
		this.askedFor.push(ids);
		const step = this.steps.shift();
		return step ? step() : Promise.reject(new Error(`FakeTaskStatusSource: no response scripted for call ${this.calls}`));
	}
}
