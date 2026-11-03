/**
 * Small state kept on this device only (game-ui S13): what the user has already seen here, such as
 * the letter of Esdras last opened. It is never written to a vault note nor to `data.json`, so each
 * device keeps its own. Values must survive `JSON.stringify`; what JSON drops is dropped.
 */
export interface DeviceStore {
	/** The value written under `key` on this device, or `null` when there is none. */
	read(key: string): unknown;
	/** Keeps `value` under `key` on this device; `null` clears it. Never throws. */
	write(key: string, value: unknown): void;
}
