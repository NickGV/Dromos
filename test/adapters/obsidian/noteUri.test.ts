import { describe, expect, it } from 'vitest';
import { obsidianNoteUri } from '../../../src/adapters/obsidian/noteUri';

describe('obsidianNoteUri', () => {
	it('builds a link that opens the note in its vault', () => {
		expect(obsidianNoteUri('Logos', '02 - Projects/Kairos/README.md')).toBe(
			'obsidian://open?vault=Logos&file=02%20-%20Projects%2FKairos%2FREADME.md',
		);
	});

	it('encodes characters that would break the link', () => {
		expect(obsidianNoteUri('Mi bóveda & más', 'A#B?.md')).toBe('obsidian://open?vault=Mi%20b%C3%B3veda%20%26%20m%C3%A1s&file=A%23B%3F.md');
	});
});
