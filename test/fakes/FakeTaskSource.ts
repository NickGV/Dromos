import type { Quest } from '../../src/domain';
import type { TaskSource } from '../../src/ports';

type Step = () => Promise<Quest[]>;

/** Task source scripted per call: each `fetchToday()` consumes the next step. `calls` counts requests. */
export class FakeTaskSource implements TaskSource {
	calls = 0;
	private readonly steps: Step[] = [];

	/** The next call resolves with `quests`. */
	resolves(quests: Quest[]): this {
		this.steps.push(() => Promise.resolve(quests));
		return this;
	}

	/** The next call rejects with `reason`, which may be any value, not only a `TaskSourceError`. */
	rejects(reason: unknown): this {
		this.steps.push(() => rejectWith(reason));
		return this;
	}

	/** The next call stays pending until the returned function runs, then resolves with `quests`. */
	holds(quests: Quest[]): () => void {
		let release: (() => void) | undefined;
		const pending = new Promise<Quest[]>((resolve) => {
			release = () => resolve(quests);
		});
		this.steps.push(() => pending);
		return () => release?.();
	}

	fetchToday(): Promise<Quest[]> {
		this.calls += 1;
		const step = this.steps.shift();
		return step ? step() : rejectWith(new Error(`FakeTaskSource: no response scripted for call ${this.calls}`));
	}
}

/** Rejects with any value, so tests can throw things that are not `Error`s. */
async function rejectWith(reason: unknown): Promise<Quest[]> {
	await Promise.resolve();
	throw reason;
}
