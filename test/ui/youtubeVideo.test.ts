import { describe, expect, it } from 'vitest';
import { youtubeVideoId } from '../../src/ui/presenters/youtubeVideo';

const ID = 'dQw4w9WgXcQ';

describe('youtubeVideoId: which links are a YouTube video (M8 S8)', () => {
	it.each([
		['a watch link', `https://www.youtube.com/watch?v=${ID}`],
		['a watch link with other parameters before and after', `https://www.youtube.com/watch?feature=share&v=${ID}&t=30`],
		['a watch link without www', `https://youtube.com/watch?v=${ID}`],
		['a phone watch link', `https://m.youtube.com/watch?v=${ID}`],
		['a short link with the share parameter', `https://youtu.be/${ID}?si=AbCdEf`],
		['a short', `https://www.youtube.com/shorts/${ID}`],
		['an embed link', `https://www.youtube.com/embed/${ID}`],
		['a live link', `https://www.youtube.com/live/${ID}?si=x`],
		['a plain http link', `http://www.youtube.com/watch?v=${ID}`],
		['a host in capitals', `https://WWW.YouTube.com/watch?v=${ID}`],
	])('finds the video of %s', (_name, url) => {
		expect(youtubeVideoId(url)).toBe(ID);
	});

	it.each([
		['a page of another site', 'https://www.coalicionporelevangelio.org/video/noviazgo-no-creyente/'],
		['a playlist', 'https://www.youtube.com/playlist?list=PL590L5WQmH8fJ54F369BLDSqIwcs-TCfs'],
		['a channel', 'https://www.youtube.com/@coalicion'],
		['the home page', 'https://www.youtube.com/'],
		['a watch link without a video', 'https://www.youtube.com/watch?list=PL590L5WQmH8f'],
		['an id of the wrong length', 'https://www.youtube.com/watch?v=dQw4w9'],
		['an id with other characters', 'https://youtu.be/dQw4w9WgX%3C'],
		['a look-alike host', `https://notyoutube.com/watch?v=${ID}`],
		['a subdomain the embed does not know', `https://music.youtube.com/watch?v=${ID}`],
		['a link that is not a web address', `javascript:alert('https://youtu.be/${ID}')`],
		['text that is not a link', 'youtube'],
	])('finds no video in %s', (_name, url) => {
		expect(youtubeVideoId(url)).toBeNull();
	});
});
