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

/** Vault path of the rules note under the given folder setting, for example `Dromos/Rules.md`. */
export function rulesNotePath(folder: string): string {
	return `${normalizeVaultFolder(folder)}/Rules.md`;
}

export function skillsFolderPath(folder: string): string {
	return `${normalizeVaultFolder(folder)}/Skills`;
}

/** Vault path of one skill note, for example `Dromos/Skills/lector.md`; the file name is the skill id. */
export function skillNotePath(folder: string, skillId: string): string {
	return `${skillsFolderPath(folder)}/${skillId}.md`;
}

export function ledgerFolderPath(folder: string): string {
	return `${normalizeVaultFolder(folder)}/Ledger`;
}

/** Vault path of the ledger note of a `YYYY-MM` month, for example `Dromos/Ledger/2026-11.md`. */
export function ledgerNotePath(folder: string, month: string): string {
	return `${ledgerFolderPath(folder)}/${month}.md`;
}
