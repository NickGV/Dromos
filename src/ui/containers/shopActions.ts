import type { ReactNode } from 'react';
import type { PurchaseOutcome, ShopSnapshot } from '../../application';
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

/** How many purchases the Shop lists, as `LoadShop` reads them. */
const LAST_PURCHASES = 5;

/**
 * The shop once a purchase settled (M10 S1-S3), with no request: the gold Habitica returned, the
 * purchase first among the last ones when the purse kept it, and a bought offer taken off sale; a
 * refusal's gold read again. `null` when only a new read can tell: Habitica bought it without
 * saying the gold, or the purse already held the offer. Any other outcome changes nothing.
 */
export function shopAfter(shop: ShopSnapshot, outcome: PurchaseOutcome): ShopSnapshot | null {
	switch (outcome.kind) {
		case 'bought': {
			if (outcome.gold === null) return null;
			const { entry } = outcome;
			return {
				...shop,
				gold: outcome.gold,
				purchases: outcome.recorded ? [entry, ...shop.purchases].slice(0, LAST_PURCHASES) : shop.purchases,
				offers: entry.offer === null ? shop.offers : shop.offers.filter((offer) => offer.id !== entry.offer),
			};
		}
		case 'too-dear':
			return { ...shop, gold: outcome.gold };
		case 'already-bought':
			return null;
		default:
			return shop;
	}
}
