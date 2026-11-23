import { FuzzySuggestModal, type App } from 'obsidian';

/** What the picker shows: a placeholder for its search field and the line it shows when nothing matches. */
export interface PickerLabels {
	readonly placeholder: string;
	readonly empty: string;
}

/**
 * The picker of "Vincular existente" (link-existing-todo S3): Obsidian's own search list, which filters
 * as you type and works with the keyboard and on the phone. It only shows the to-dos it is given; it
 * reads nothing from Habitica. Resolves with the chosen one, or `null` when it closes without a choice.
 */
class TodoPickerModal<T extends { readonly title: string }> extends FuzzySuggestModal<T> {
	private chosen = false;

	constructor(
		app: App,
		private readonly items: readonly T[],
		labels: PickerLabels,
		private readonly done: (item: T | null) => void,
	) {
		super(app);
		this.setPlaceholder(labels.placeholder);
		this.emptyStateText = labels.empty;
	}

	getItems(): T[] {
		return [...this.items];
	}

	getItemText(item: T): string {
		return item.title;
	}

	onChooseItem(item: T): void {
		this.chosen = true;
		this.done(item);
	}

	onClose(): void {
		super.onClose();
		// Obsidian closes the list before it reports the choice, so a close only means "no choice" once that had its turn.
		window.setTimeout(() => {
			if (!this.chosen) this.done(null);
		}, 0);
	}
}

/** Opens the to-do picker over the workspace of `app`. */
export function createTodoPicker(app: App): <T extends { readonly title: string }>(items: readonly T[], labels: PickerLabels) => Promise<T | null> {
	return (items, labels) => new Promise((resolve) => new TodoPickerModal(app, items, labels, resolve).open());
}
