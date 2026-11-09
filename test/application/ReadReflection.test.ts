import { describe, expect, it } from 'vitest';
import { ReadReflection } from '../../src/application';
import type { ReflectionText } from '../../src/ports';
import { aBook } from '../fakes/books';
import { EMPTY_REFLECTION_TEXT, InMemoryBookRepository } from '../fakes/InMemoryBookRepository';

const PATH = '03 - Areas/Bibliotheke/Klara y el Sol - Kazuo Ishiguro.md';
const WRITTEN: ReflectionText = { about: 'Una AA que observa.', kept: '### Cita\n\n> Algo.', changes: '', connects: '- [[Esperanza]]' };

function repositoryWith(text: ReflectionText): InMemoryBookRepository {
	const books = new InMemoryBookRepository([aBook({ path: PATH })]);
	books.reflections.set(PATH, text);
	return books;
}

describe('ReadReflection (M7 S5)', () => {
	it('answers the text of each part, as the repository reads it', async () => {
		expect(await new ReadReflection({ books: repositoryWith(WRITTEN) }).execute(PATH)).toEqual(WRITTEN);
	});

	it('reads the note again on every call, so a reflection written since shows', async () => {
		const books = repositoryWith(EMPTY_REFLECTION_TEXT);
		const read = new ReadReflection({ books });
		await read.execute(PATH);
		books.reflections.set(PATH, WRITTEN);

		expect(await read.execute(PATH)).toEqual(WRITTEN);
	});

	it('answers null when there is no book at that path', async () => {
		expect(await new ReadReflection({ books: repositoryWith(WRITTEN) }).execute('Inbox/Otro.md')).toBeNull();
	});

	it('answers null instead of rejecting when the note cannot be read', async () => {
		const books = repositoryWith(WRITTEN);
		books.failReadsWith = new Error('disk');

		expect(await new ReadReflection({ books }).execute(PATH)).toBeNull();
	});
});
