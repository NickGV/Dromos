import { Plugin, WorkspaceLeaf } from 'obsidian';
import { onStartup } from './adapters/obsidian';
import { createDromos } from './composition/createDromos';
import { DromosView, VIEW_TYPE_DROMOS } from './ui/DromosView';

export default class DromosPlugin extends Plugin {
	private unloaded = false;

	async onload(): Promise<void> {
		// Before any await, so a plugin reload is not taken for Obsidian starting.
		const atStartup = onStartup(this.app.workspace);
		const { home, settingTab, rebuildGame, settings } = await createDromos(this);
		this.addSettingTab(settingTab);
		this.registerView(VIEW_TYPE_DROMOS, (leaf) => new DromosView(leaf, home));

		// Opt-in: the restored layout may not hold the Dromos tab (closed, or another device's layout via Sync).
		atStartup(() => {
			// The callback can still fire after an unload that happened before the layout was ready.
			if (this.unloaded) return;
			if (settings().openOnStartup) void this.activateView();
		});

		this.addRibbonIcon('footprints', 'Dromos', () => {
			void this.activateView();
		});

		this.addCommand({
			id: 'open',
			name: 'Open',
			callback: () => {
				void this.activateView();
			},
		});

		this.addCommand({
			id: 'rebuild-state',
			name: 'Rebuild state from ledger',
			callback: () => {
				void rebuildGame();
			},
		});
	}

	onunload(): void {
		this.unloaded = true;
		// Leaves are left in place on purpose: Obsidian restores them on reload.
	}

	private async activateView(): Promise<void> {
		const { workspace } = this.app;
		const existing: WorkspaceLeaf | undefined = workspace.getLeavesOfType(VIEW_TYPE_DROMOS)[0];
		const leaf = existing ?? workspace.getLeaf('tab');
		if (!existing) {
			await leaf.setViewState({ type: VIEW_TYPE_DROMOS, active: true });
		}
		await workspace.revealLeaf(leaf);
	}
}
