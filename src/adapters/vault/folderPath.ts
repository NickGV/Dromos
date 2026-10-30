import { DEFAULT_SETTINGS } from '../../ports';

/** File name of the character note inside the Dromos folder (S1). */
export const CHARACTER_NOTE_NAME = 'Character.md';

/** Cleans the folder setting: drops surrounding whitespace and trailing slashes; blank falls back to the default folder. */
export function normalizeVaultFolder(folder: string): string {
	const cleaned = folder.replace(/[\s/]+$/, '').trim();
	return cleaned === '' ? DEFAULT_SETTINGS.vaultFolder : cleaned;
}

/** Vault path of `Character.md` under the given folder setting, for example `Dromos/Character.md`. */
export function characterNotePath(folder: string): string {
	return `${normalizeVaultFolder(folder)}/${CHARACTER_NOTE_NAME}`;
}
