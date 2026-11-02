import { Platform } from 'obsidian';
import type { Clipboard } from '../../ports';

export class SystemClipboard implements Clipboard {
	copy(text: string): Promise<void> {
		return navigator.clipboard.writeText(text);
	}
}

/** False on a phone or a tablet. */
export function isDesktopApp(): boolean {
	return Platform.isDesktopApp;
}
