/**
 * A title Esdras granted for a big, rare feat (titles S1, ADR-020): a row of `<Dromos folder>/Titles.md`,
 * which only Esdras writes and never deletes from. The character's `title` is chosen among them.
 */
export interface Title {
	/** Lowercase letters, digits and hyphens, unique in the note. */
	readonly id: string;
	/** The title as it is read, and as `title` in `Character.md` holds it once chosen. */
	readonly title: string;
	/** The feat, in one sentence; `null` when the row left it empty. */
	readonly feat: string | null;
	/** The local day it was granted, `YYYY-MM-DD`. */
	readonly granted: string;
	/** Why Esdras granted it, in his voice; `null` when the row left it empty. */
	readonly why: string | null;
}

const TITLE_ID = /^[a-z0-9-]+$/;

/** Whether `id` can name a title: lowercase letters, digits and hyphens only. */
export function isTitleId(id: string): boolean {
	return TITLE_ID.test(id);
}

/**
 * The titles, newest grant first (titles S5). Two titles of the same day keep the later row of the
 * note first, since Esdras adds rows at its end. The list given is left as it was.
 */
export function newestFirst(titles: readonly Title[]): Title[] {
	return titles
		.map((title, index) => ({ title, index }))
		.sort((a, b) => (a.title.granted === b.title.granted ? b.index - a.index : a.title.granted < b.title.granted ? 1 : -1))
		.map(({ title }) => title);
}

/** Whether `title` is, exactly, the text of one of the granted titles: the only value Dromos may write in `title` (ADR-020). */
export function isGrantedTitle(titles: readonly Title[], title: string): boolean {
	return title !== '' && titles.some((granted) => granted.title === title);
}
