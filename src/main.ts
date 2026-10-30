import { Plugin, WorkspaceLeaf } from 'obsidian';
import { createDromos } from './composition/createDromos';
import { DromosView, VIEW_TYPE_DROMOS } from './ui/DromosView';

export default class DromosPlugin extends Plugin {
	async onload(): Promise<void> {
		const { home, settingTab } = await createDromos(this);
		this.addSettingTab(settingTab);
		this.registerView(VIEW_TYPE_DROMOS, (leaf) => new DromosView(leaf, home));

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
	}

	onunload(): void {
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
