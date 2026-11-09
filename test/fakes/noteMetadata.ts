/** A block of a note: a heading with its level, or any other section type of Obsidian's parser. */
export type Block = { readonly heading: string; readonly level: number } | { readonly type: string };

interface Position {
	readonly start: { readonly line: number; readonly col: number; readonly offset: number };
	readonly end: { readonly line: number; readonly col: number; readonly offset: number };
}

/** The `headings` and `sections` of a note's `CachedMetadata`, without importing `obsidian`. */
export interface NoteMetadata {
	readonly headings: { readonly heading: string; readonly level: number; readonly position: Position }[];
	readonly sections: { readonly type: string; readonly position: Position }[];
}

export const heading = (level: number, text: string): Block => ({ heading: text, level });
export const block = (type: string): Block => ({ type });

/**
 * The metadata the cache would hold for `blocks`, in order: one block every two lines (a
 * blank line between). Headings are listed in `sections` too, as Obsidian lists them.
 */
export function metadataOf(...blocks: Block[]): NoteMetadata {
	const headings: NoteMetadata['headings'] = [];
	const sections: NoteMetadata['sections'] = [];
	blocks.forEach((entry, index) => {
		const line = index * 2;
		const position: Position = { start: { line, col: 0, offset: 0 }, end: { line, col: 0, offset: 0 } };
		if ('heading' in entry) {
			headings.push({ heading: entry.heading, level: entry.level, position });
			sections.push({ type: 'heading', position });
		} else {
			sections.push({ type: entry.type, position });
		}
	});
	return { headings, sections };
}

/**
 * The cache's `headings` for the whole text of a note, frontmatter included: every ATX heading line
 * (`#` to `######`, then a space) with its level and its 0-based line, as Obsidian lists them. It
 * knows nothing of code blocks or setext headings, which the notes of these tests do not have.
 */
export function headingsOf(text: string): NoteMetadata['headings'] {
	return text.split(/\r?\n/).flatMap((line, index) => {
		const match = /^(#{1,6})[ \t]+(.*?)[ \t]*$/.exec(line);
		if (!match) return [];
		const position: Position = { start: { line: index, col: 0, offset: 0 }, end: { line: index, col: line.length, offset: 0 } };
		return [{ heading: match[2] ?? '', level: (match[1] ?? '').length, position }];
	});
}

/** The shape of `Templates/book.md`: frontmatter, a title, the guide callout, and four empty sections. */
export function templateMetadata(): NoteMetadata {
	return metadataOf(
		block('yaml'),
		heading(1, 'Klara y el Sol - Kazuo Ishiguro'),
		block('callout'),
		heading(2, 'De qué trata'),
		heading(2, 'Qué me quedó'),
		heading(2, 'Qué cambia en mí'),
		heading(2, 'Con qué lo conecto'),
	);
}

/** A note with the four sections, each followed by one paragraph. */
export function writtenMetadata(): NoteMetadata {
	return metadataOf(
		block('yaml'),
		heading(1, 'Klara y el Sol - Kazuo Ishiguro'),
		block('callout'),
		heading(2, 'De qué trata'),
		block('paragraph'),
		heading(2, 'Qué me quedó'),
		block('blockquote'),
		heading(2, 'Qué cambia en mí'),
		block('list'),
		heading(2, 'Con qué lo conecto'),
		block('list'),
	);
}
