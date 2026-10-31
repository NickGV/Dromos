/** An `obsidian://` link that opens `path` in the vault named `vaultName`. */
export function obsidianNoteUri(vaultName: string, path: string): string {
	return `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(path)}`;
}
