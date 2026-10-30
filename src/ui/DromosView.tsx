import { ItemView, WorkspaceLeaf } from 'obsidian';
import { StrictMode } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { HomeScreen, type HomeScreenDeps } from './containers/HomeScreen';

export const VIEW_TYPE_DROMOS = 'dromos-home';

export class DromosView extends ItemView {
	private root: Root | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly deps: HomeScreenDeps,
	) {
		super(leaf);
		this.navigation = false;
	}

	getViewType(): string {
		return VIEW_TYPE_DROMOS;
	}

	getDisplayText(): string {
		return 'Dromos';
	}

	getIcon(): string {
		return 'footprints';
	}

	onOpen(): Promise<void> {
		this.contentEl.addClass('dromos-root');
		this.root = createRoot(this.contentEl);
		this.root.render(
			<StrictMode>
				<HomeScreen deps={this.deps} />
			</StrictMode>,
		);
		return Promise.resolve();
	}

	onClose(): Promise<void> {
		this.root?.unmount();
		this.root = null;
		this.contentEl.removeClass('dromos-root');
		return Promise.resolve();
	}
}
