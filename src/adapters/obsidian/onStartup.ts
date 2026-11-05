/** The part of Obsidian's `Workspace` that tells whether the app is still starting. */
export interface StartupWorkspace {
	readonly layoutReady: boolean;
	onLayoutReady(callback: () => void): void;
}

/**
 * Remembers whether Obsidian is starting, and returns a function that runs its callback once the
 * layout is ready, only if it was. Call it before the plugin's first `await`: a plugin reload or an
 * update through BRAT finds the layout already ready, and then the callback never runs.
 */
export function onStartup(workspace: StartupWorkspace): (run: () => void) => void {
	const startingUp = !workspace.layoutReady;
	return (run) => {
		if (startingUp) workspace.onLayoutReady(run);
	};
}
