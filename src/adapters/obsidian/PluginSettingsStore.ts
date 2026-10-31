import { DEFAULT_SETTINGS, type Settings, type SettingsStore } from '../../ports';
import { normalizeVaultFolder } from '../vault/folderPath';

/** The part of an Obsidian `Plugin` that reads and writes its `data.json`. */
export interface PluginDataHost {
	loadData(): Promise<unknown>;
	saveData(data: unknown): Promise<void>;
}

/**
 * Settings kept in the plugin's `data.json` (S3), the only place the Habitica
 * token is stored (ADR-007). Never logs any value.
 */
export class PluginSettingsStore implements SettingsStore {
	constructor(private readonly plugin: PluginDataHost) {}

	async load(): Promise<Settings> {
		return settingsFromData(await this.plugin.loadData());
	}

	async save(settings: Settings): Promise<void> {
		const { habiticaUserId, habiticaApiToken, vaultFolder, staleAfterDays } = settings;
		await this.plugin.saveData({ habiticaUserId, habiticaApiToken, vaultFolder, staleAfterDays });
	}
}

/** Merges stored data over `DEFAULT_SETTINGS`: a field that is missing or not a string keeps its default. */
function settingsFromData(data: unknown): Settings {
	const stored = typeof data === 'object' && data !== null && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
	return {
		habiticaUserId: textOr(stored.habiticaUserId, DEFAULT_SETTINGS.habiticaUserId),
		habiticaApiToken: textOr(stored.habiticaApiToken, DEFAULT_SETTINGS.habiticaApiToken),
		vaultFolder: normalizeVaultFolder(textOr(stored.vaultFolder, DEFAULT_SETTINGS.vaultFolder)),
		staleAfterDays: positiveIntegerOr(stored.staleAfterDays, DEFAULT_SETTINGS.staleAfterDays),
	};
}

function textOr(value: unknown, fallback: string): string {
	return typeof value === 'string' ? value : fallback;
}

function positiveIntegerOr(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : fallback;
}
