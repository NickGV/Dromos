/** The hosts of a YouTube link Obsidian embeds; `youtu.be` is read on its own. */
const HOSTS: ReadonlySet<string> = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com']);

/** The paths that carry the video's id after them: `/shorts/<id>`, `/embed/<id>`, `/live/<id>`. */
const ID_PATHS: ReadonlySet<string> = new Set(['shorts', 'embed', 'live']);

/** A YouTube video id: eleven letters, digits, `-` or `_`. */
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * The id of the YouTube video `url` links to (M8 S8), or `null` when it links to no single video:
 * another site, a playlist, a channel, or an address that is not `http` or `https`.
 */
export function youtubeVideoId(url: string): string | null {
	let link: URL;
	try {
		link = new URL(url);
	} catch {
		return null;
	}
	if (link.protocol !== 'https:' && link.protocol !== 'http:') return null;
	const [, first, second] = link.pathname.split('/');
	const host = link.hostname.toLowerCase();
	let id: string | null | undefined = null;
	if (host === 'youtu.be') id = first;
	else if (HOSTS.has(host)) id = link.pathname === '/watch' ? link.searchParams.get('v') : first !== undefined && ID_PATHS.has(first) ? second : null;
	return id !== null && id !== undefined && VIDEO_ID.test(id) ? id : null;
}

/**
 * The Markdown that makes Obsidian play the video as it does in a note. Obsidian's own embed then
 * goes around YouTube's Error 153; the link is rebuilt from the id, so nothing else of `url` reaches it.
 */
export function youtubeEmbed(id: string): string {
	return `![](https://www.youtube.com/watch?v=${id})`;
}
