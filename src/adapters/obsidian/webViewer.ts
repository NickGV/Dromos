import type { App } from 'obsidian';

/** The part of Obsidian's core plugins this reads; not in the public API, so every step may be missing. */
interface CorePlugins {
	readonly internalPlugins?: {
		readonly getEnabledPluginById?: (id: string) => { readonly options?: { readonly openExternalURLs?: unknown } } | null;
	};
}

/**
 * Whether Obsidian opens an external link in its own Web viewer tab (M8 S9): the core plugin is on
 * and its "Open external links" too. Desktop only; on a phone, with the plugin off, or if Obsidian
 * changes these internals, it answers `false` and links go to the browser, as before.
 */
export function linksOpenInObsidian(app: App): boolean {
	try {
		const webViewer = (app as unknown as CorePlugins).internalPlugins?.getEnabledPluginById?.('webviewer');
		return webViewer?.options?.openExternalURLs === true;
	} catch {
		return false;
	}
}
