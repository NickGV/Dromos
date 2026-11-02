import { Notice } from 'obsidian';

/** A brief Obsidian toast. */
export function showNotice(message: string): void {
	new Notice(message);
}
