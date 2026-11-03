import type { DeviceStore } from '../../ports';

/** Obsidian's vault-scoped local storage. Public since 1.8.7, after this plugin's `minAppVersion`. */
interface VaultLocalStorage {
	loadLocalStorage(key: string): unknown;
	saveLocalStorage(key: string, data: unknown): void;
}

/** Every key this plugin keeps on the device starts with it, so none can clash with another plugin's. */
const PREFIX = 'dromos:';

function vaultLocalStorage(app: object): VaultLocalStorage | null {
	const candidate = app as Partial<Record<keyof VaultLocalStorage, unknown>>;
	return typeof candidate.loadLocalStorage === 'function' && typeof candidate.saveLocalStorage === 'function' ? (app as VaultLocalStorage) : null;
}

/**
 * The device store on Obsidian's `app.loadLocalStorage` / `app.saveLocalStorage`, checked at run
 * time because an older Obsidian has neither. Without them, or when they throw, values live in
 * memory for the session: a mark is then forgotten on the next start, never sent anywhere else.
 * Memory keeps the JSON text, so a value reads back the same from either place.
 */
export class LocalDeviceStore implements DeviceStore {
	private readonly storage: VaultLocalStorage | null;
	private readonly memory = new Map<string, string>();

	constructor(app: object) {
		this.storage = vaultLocalStorage(app);
	}

	read(key: string): unknown {
		const fullKey = PREFIX + key;
		if (this.storage) {
			try {
				const stored = this.storage.loadLocalStorage(fullKey);
				if (stored !== null && stored !== undefined) return stored;
			} catch {
				// Storage refused: what this session wrote is still in memory.
			}
		}
		const json = this.memory.get(fullKey);
		return json === undefined ? null : (JSON.parse(json) as unknown);
	}

	write(key: string, value: unknown): void {
		const fullKey = PREFIX + key;
		const json = value === null || value === undefined ? undefined : JSON.stringify(value);
		if (json === undefined) this.memory.delete(fullKey);
		else this.memory.set(fullKey, json);
		if (!this.storage) return;
		try {
			this.storage.saveLocalStorage(fullKey, json === undefined ? null : (JSON.parse(json) as unknown));
		} catch {
			// A full or refused storage keeps the value in memory for this session.
		}
	}
}
