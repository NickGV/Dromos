import type { MouseEvent } from 'react';

/**
 * Calls `then` when the click was on an internal link of a card's rendered text, which a link
 * activated by the keyboard also fires. Obsidian follows it by opening the note, so the book and
 * resource cards close first.
 */
export function followedLink(event: MouseEvent<HTMLElement>, then: () => void): void {
	if ((event.target as HTMLElement).closest('a.internal-link')) then();
}

/** A `ref` callback that moves the focus to the button as soon as it is drawn, without scrolling. */
export function focusOnDraw(button: HTMLButtonElement | null): void {
	button?.focus({ preventScroll: true });
}
