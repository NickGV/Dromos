import { Modal, type App } from 'obsidian';
import type { ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

/** What a card is opened with: its accessible name and language, what it draws, and what runs once it closes. */
export interface CardModalRequest {
	readonly label: string;
	readonly lang: string;
	readonly content: ReactNode;
	readonly onClose: () => void;
}

/** An open card: draws new content in place, or closes. */
export interface CardModalHandle {
	show(content: ReactNode): void;
	close(): void;
}

/**
 * The book card of the library (M7 S5): an Obsidian modal with a React tree inside. It wears the
 * view's root class, so the parchment palette, light and dark, reaches it outside the view. Its
 * own close button and Escape close it; `onClose` runs once, however it closed.
 */
class BookCardModal extends Modal {
	private root: Root | null = null;
	private content: ReactNode;

	constructor(
		app: App,
		private readonly request: CardModalRequest,
	) {
		super(app);
		this.content = request.content;
	}

	onOpen(): void {
		this.modalEl.addClasses(['dromos-root', 'dromos-book-modal']);
		this.modalEl.setAttr('aria-label', this.request.label);
		this.modalEl.setAttr('lang', this.request.lang);
		this.root = createRoot(this.contentEl);
		this.root.render(this.content);
	}

	show(content: ReactNode): void {
		this.content = content;
		this.root?.render(content);
	}

	onClose(): void {
		this.root?.unmount();
		this.root = null;
		this.contentEl.empty();
		this.request.onClose();
	}
}

/** Opens book cards over the workspace of `app`. */
export function createOpenCardModal(app: App): (request: CardModalRequest) => CardModalHandle {
	return (request) => {
		const modal = new BookCardModal(app, request);
		modal.open();
		return { show: (content) => modal.show(content), close: () => modal.close() };
	};
}
