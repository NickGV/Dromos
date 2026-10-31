import { DEFAULT_STALE_AFTER_DAYS } from '../domain';
import { DEFAULT_LANGUAGE, type Language } from '../i18n';

/** Plugin settings (S3). The token lives only in the plugin's `data.json` (ADR-007). */
export interface Settings {
	readonly habiticaUserId: string;
	readonly habiticaApiToken: string;
	/** Vault folder holding Dromos notes, without a trailing slash. */
	readonly vaultFolder: string;
	/** Days without a completed task before an active campaign counts as stale (S7). */
	readonly staleAfterDays: number;
	/** Language of the interface; English by default. */
	readonly language: Language;
}

/** Values used for any setting that was never saved. */
export const DEFAULT_SETTINGS: Settings = {
	habiticaUserId: '',
	habiticaApiToken: '',
	vaultFolder: 'Dromos',
	staleAfterDays: DEFAULT_STALE_AFTER_DAYS,
	language: DEFAULT_LANGUAGE,
};

/** Persists settings. `load()` fills missing fields from `DEFAULT_SETTINGS`. */
export interface SettingsStore {
	load(): Promise<Settings>;
	save(settings: Settings): Promise<void>;
}
