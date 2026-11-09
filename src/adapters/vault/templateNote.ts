/**
 * The vault's templates folder, as Obsidian's Templates plugin is set in the Logos vault
 * (`.obsidian/templates.json`). Its notes carry the frontmatter of the notes they create
 * (`Templates/book.md` says `type: book`), so they are never books or areas.
 */
export const TEMPLATES_FOLDER = 'Templates';

/** True for a note inside the templates folder at the vault's root, subfolders included. */
export function isTemplatePath(path: string): boolean {
	return path.startsWith(`${TEMPLATES_FOLDER}/`);
}
