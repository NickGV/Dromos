/**
 * An `obsidian://` link that opens `path` in the vault named `vaultName`. Parentheses are encoded
 * too (`encodeURIComponent` leaves them), so the link can sit inside a Markdown link.
 */
export function obsidianNoteUri(vaultName: string, path: string): string {
	return `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(path).replace(/\(/g, '%28').replace(/\)/g, '%29')}`;
}

/**
 * The link to a note in the notes of a Habitica task: a Markdown link with `text`, because Habitica
 * makes only web and mail addresses clickable on their own, on the web and on Android alike, so a
 * bare `obsidian://` address stays plain text there.
 */
export function obsidianNoteLink(text: string, vaultName: string, path: string): string {
	return `[${text.replace(/[[\]\\]/g, '\\$&')}](${obsidianNoteUri(vaultName, path)})`;
}
