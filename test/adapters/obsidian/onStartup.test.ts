import { describe, expect, it } from 'vitest';
import { onStartup, type StartupWorkspace } from '../../../src/adapters/obsidian/onStartup';

/** Stands in for Obsidian's workspace: queues callbacks until the layout is ready, then runs them at once. */
class FakeWorkspace implements StartupWorkspace {
	private queued: (() => void)[] = [];

	constructor(public layoutReady: boolean) {}

	onLayoutReady(callback: () => void): void {
		if (this.layoutReady) callback();
		else this.queued.push(callback);
	}

	finishLayout(): void {
		this.layoutReady = true;
		this.queued.forEach((callback) => callback());
		this.queued = [];
	}
}

describe('onStartup', () => {
	it('runs the callback once the layout is ready when the plugin loads while Obsidian starts', () => {
		const workspace = new FakeWorkspace(false);
		let runs = 0;

		onStartup(workspace)(() => runs++);
		expect(runs).toBe(0);

		workspace.finishLayout();
		expect(runs).toBe(1);
	});

	it('never runs it when the layout was already ready, as on a plugin reload or an update through BRAT', () => {
		const workspace = new FakeWorkspace(true);
		let runs = 0;

		onStartup(workspace)(() => runs++);
		workspace.finishLayout();

		expect(runs).toBe(0);
	});

	it('decides when it is called, so a layout that gets ready during the plugin load still counts as startup', () => {
		const workspace = new FakeWorkspace(false);
		let runs = 0;

		const atStartup = onStartup(workspace);
		// The plugin awaits its settings; the layout can finish in the meantime.
		workspace.finishLayout();
		atStartup(() => runs++);

		expect(runs).toBe(1);
	});
});
