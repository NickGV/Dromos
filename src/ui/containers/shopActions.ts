import type { ReactNode } from 'react';
import type { CardModal, CardModalOptions } from './LibraryPanel';

/** Opens a card over the workspace (an Obsidian `Modal`, built in `src/adapters`). */
export type OpenCard = (options: CardModalOptions) => CardModal;

/**
 * Opens a confirmation in a card and answers whether it was confirmed (M10 S1). `render` draws it
 * with `answer`, which its buttons call; the first answer closes the card and counts, later ones
 * change nothing. Closing the card any other way (Escape, its close button, the screen leaving
 * through `onOpen`'s handle) answers no.
 */
export function askToConfirm(open: OpenCard, options: { readonly label: string; readonly lang: string; readonly className?: string }, render: (answer: (yes: boolean) => void) => ReactNode, onOpen?: (card: CardModal) => void): Promise<boolean> {
	return new Promise((resolve) => {
		let settled = false;
		let card: CardModal | null = null;
		const settle = (yes: boolean): boolean => {
			if (settled) return false;
			settled = true;
			resolve(yes);
			return true;
		};
		const answer = (yes: boolean): void => {
			if (settle(yes)) card?.close();
		};
		card = open({ ...options, content: render(answer), onClose: () => void settle(false) });
		onOpen?.(card);
	});
}

/** Runs `buy` only when `ask` answers yes, and answers with what it bought; `null` when it was not confirmed. */
export async function buyAfterConfirming<T>(ask: () => Promise<boolean>, buy: () => Promise<T>): Promise<T | null> {
	if (!(await ask())) return null;
	return buy();
}
