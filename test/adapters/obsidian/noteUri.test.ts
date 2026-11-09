import { describe, expect, it } from 'vitest';
import { obsidianNoteLink, obsidianNoteUri } from '../../../src/adapters/obsidian/noteUri';

describe('obsidianNoteUri', () => {
	it('builds a link that opens the note in its vault', () => {
		expect(obsidianNoteUri('Logos', '02 - Projects/Kairos/README.md')).toBe(
			'obsidian://open?vault=Logos&file=02%20-%20Projects%2FKairos%2FREADME.md',
		);
	});

	it('encodes characters that would break the link', () => {
		expect(obsidianNoteUri('Mi bóveda & más', 'A#B?.md')).toBe('obsidian://open?vault=Mi%20b%C3%B3veda%20%26%20m%C3%A1s&file=A%23B%3F.md');
	});

	it('encodes parentheses, which would end a Markdown link early', () => {
		expect(obsidianNoteUri('logos', 'Notas (2026).md')).toBe('obsidian://open?vault=logos&file=Notas%20%282026%29.md');
	});
});

describe('obsidianNoteLink: the link in the notes of a Habitica task', () => {
	it('is a Markdown link, because Habitica makes only web and mail addresses clickable on their own', () => {
		expect(obsidianNoteLink('Abrir en Obsidian', 'logos', '03 - Areas/Bibliotheke/Archeion - Bibliotheke.md')).toBe(
			'[Abrir en Obsidian](obsidian://open?vault=logos&file=03%20-%20Areas%2FBibliotheke%2FArcheion%20-%20Bibliotheke.md)',
		);
	});

	it('escapes brackets in its text, so the link stays whole', () => {
		expect(obsidianNoteLink('Open [note]', 'logos', 'A.md')).toBe('[Open \\[note\\]](obsidian://open?vault=logos&file=A.md)');
	});
});
