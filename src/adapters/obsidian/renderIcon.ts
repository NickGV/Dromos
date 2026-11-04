import { setIcon } from 'obsidian';

/** Draws one of Obsidian's line icons (Lucide) inside `host`, so they match the rest of the app. */
export function renderIcon(host: HTMLElement, name: string): void {
	setIcon(host, name);
}
