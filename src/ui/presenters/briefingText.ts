// Plain-text views of what Esdras writes (game-ui S13, S14). Pure: no DOM, no markdown renderer.

/** A run of the mission's why: plain text, or a span Esdras wrote in backticks. */
export interface TextSegment {
	readonly text: string;
	readonly code: boolean;
}

/** Reading speed for the "N min" of the folded letter. */
const WORDS_PER_MINUTE = 200;
/** Longest excerpt handed to the panel; it shows two lines of it. */
const EXCERPT_LENGTH = 240;

// A backtick run, then the code (at least one character, not ending in a backtick), then a run of
// the same length that no further backtick follows: CommonMark's code span, without lookbehinds.
const CODE_SPAN = /(`+)(?!`)([\s\S]*?[^`])\1(?!`)/;

/**
 * The text split at its code spans. Only backticks become code: anything else, HTML included, stays
 * plain text for React to escape. An unmatched backtick stays as it is.
 */
export function codeSegments(text: string): readonly TextSegment[] {
	const segments: TextSegment[] = [];
	const pattern = new RegExp(CODE_SPAN.source, 'g');
	let last = 0;
	for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
		if (match.index > last) segments.push({ text: text.slice(last, match.index), code: false });
		segments.push({ text: trimOneSpace(match[2] ?? ''), code: true });
		last = match.index + match[0].length;
	}
	if (last < text.length) segments.push({ text: text.slice(last), code: false });
	return segments;
}

// CommonMark: one space at each end is padding when both are there and the code is not all spaces.
function trimOneSpace(code: string): string {
	return code.length > 2 && code.startsWith(' ') && code.endsWith(' ') && code.trim() !== '' ? code.slice(1, -1) : code;
}

/**
 * The words of a note as a reader sees them, on one line: headings, emphasis, code ticks, links,
 * embeds, comments, callout and list markers, rules and footnote marks taken out. A link shows its
 * alias, else what was written between the brackets.
 */
export function plainText(markdown: string): string {
	const lines = markdown
		.replace(/%%[\s\S]*?%%/g, ' ')
		.split('\n')
		.map(plainLine);
	return lines.join(' ').replace(/\s+/g, ' ').trim();
}

function plainLine(line: string): string {
	const text = line
		.replace(/^\s*(?:[-*_]\s*){3,}$/, '')
		.replace(/^\s*(?:>\s*)+/, '')
		.replace(/^\[![^\]]*\][+-]?\s*/, '')
		.replace(/^\s*#{1,6}\s+/, '')
		.replace(/^\s*(?:[-*+]|\d+[.)])\s+(?:\[.\]\s+)?/, '');
	return inlinePlain(text);
}

function inlinePlain(text: string): string {
	return text
		.replace(/!\[\[[^\]]*\]\]/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2')
		.replace(/\[\[([^\]]*)\]\]/g, '$1')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/\[\^[^\]]*\]/g, '')
		.replace(/<\/?[a-zA-Z][^>]*>/g, ' ')
		.replace(new RegExp(CODE_SPAN.source, 'g'), '$2')
		.replace(/\*\*(\S(?:.*?\S)?)\*\*/g, '$1')
		.replace(/(^|\W)__(\S(?:.*?\S)?)__(?=\W|$)/g, '$1$2')
		.replace(/\*(\S(?:.*?\S)?)\*/g, '$1')
		.replace(/(^|\W)_(\S(?:.*?\S)?)_(?=\W|$)/g, '$1$2')
		.replace(/~~(.+?)~~/g, '$1')
		.replace(/==(.+?)==/g, '$1');
}

/** The first words of the letter as plain text, cut at a word with an ellipsis; `null` when nothing is written. */
export function excerptOf(markdown: string, maxLength: number = EXCERPT_LENGTH): string | null {
	const text = plainText(markdown);
	if (text === '') return null;
	if (text.length <= maxLength) return text;
	const cut = text.slice(0, maxLength);
	const space = cut.lastIndexOf(' ');
	return `${(space > 0 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/** Minutes to read the letter at 200 words a minute, rounded up, never under one. */
export function readingMinutes(markdown: string): number {
	const words = plainText(markdown)
		.split(' ')
		.filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
	return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/** FNV-1a over the UTF-16 code units, as eight hex digits: enough to tell one letter from the next. */
export function shortHash(text: string): string {
	let hash = 0x811c9dc5;
	for (let index = 0; index < text.length; index += 1) {
		hash ^= text.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193);
	}
	return (hash >>> 0).toString(16).padStart(8, '0');
}
