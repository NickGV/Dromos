import type { GameTaskSource, ObservedTask } from '../../src/ports';

/** Game task source that answers with a list, or fails. `calls` counts the reads. */
export class FakeGameTaskSource implements GameTaskSource {
	calls = 0;
	failWith: Error | null = null;

	constructor(public tasks: ObservedTask[] = []) {}

	fetchObservations(): Promise<ObservedTask[]> {
		this.calls += 1;
		return this.failWith ? Promise.reject(this.failWith) : Promise.resolve(this.tasks);
	}
}
