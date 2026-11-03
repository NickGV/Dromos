import type { App } from 'obsidian';

/** The part of Obsidian's settings window Dromos uses. It is not in the public typings. */
interface SettingsWindow {
	open(): void;
	openTabById(id: string): unknown;
}

function settingsWindow(app: App): SettingsWindow | null {
	const setting: unknown = (app as unknown as { readonly setting?: unknown }).setting;
	if (typeof setting !== 'object' || setting === null) return null;
	const candidate = setting as Partial<SettingsWindow>;
	return typeof candidate.open === 'function' && typeof candidate.openTabById === 'function' ? (candidate as SettingsWindow) : null;
}

/**
 * Opens Obsidian's settings on the tab of the plugin `pluginId`. `null` when this Obsidian has
 * no settings window with those methods, checked at run time because `app.setting` is not in
 * the public API: the signpost then hides its settings plank.
 */
export function createOpenSettings(app: App, pluginId: string): (() => void) | null {
	const setting = settingsWindow(app);
	if (!setting) return null;
	return () => {
		setting.open();
		setting.openTabById(pluginId);
	};
}
