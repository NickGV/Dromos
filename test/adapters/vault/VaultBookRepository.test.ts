import { describe, expect, it } from 'vitest';
import { VaultBookRepository } from '../../../src/adapters/vault/VaultBookRepository';
import { fakeVaultApp, type FakeCache } from '../../fakes/fakeVaultApp';
import { templateMetadata, writtenMetadata } from '../../fakes/noteMetadata';

function repository(notes: Readonly<Record<string, FakeCache>>): VaultBookRepository {
	return new VaultBookRepository(fakeVaultApp(notes) as unknown as ConstructorParameters<typeof VaultBookRepository>[0]);
}

describe('VaultBookRepository: the books, read through the metadata cache (S1, S2)', () => {
	it('lists every `type: book` note, whatever its folder, and nothing else', async () => {
		const books = await repository({
			'03 - Areas/Bibliotheke/Klara y el Sol - Kazuo Ishiguro.md': { frontmatter: { type: 'book', title: 'Klara y el Sol', status: 'completed', shelf: 'Ficción' }, ...templateMetadata() },
			'Inbox/Confesiones - Agustín.md': { frontmatter: { type: 'book', title: 'Confesiones', status: 'planning' }, ...templateMetadata() },
			'04 - Resources/The Green Mile.md': { frontmatter: { type: 'resource', title: 'The Green Mile' }, ...templateMetadata() },
			'Inbox/No frontmatter.md': { ...templateMetadata() },
		}).list();

		expect(books.map((book) => [book.title, book.path])).toEqual([
			['Confesiones', 'Inbox/Confesiones - Agustín.md'],
			['Klara y el Sol', '03 - Areas/Bibliotheke/Klara y el Sol - Kazuo Ishiguro.md'],
		]);
	});

	it('reads the reflection from the cached headings and sections', async () => {
		const [empty, written] = await repository({
			'a.md': { frontmatter: { type: 'book', title: 'A', status: 'completed' }, ...templateMetadata() },
			'b.md': { frontmatter: { type: 'book', title: 'B', status: 'completed' }, ...writtenMetadata() },
		}).list();

		expect(empty?.reflection.map((section) => section.written)).toEqual([false, false, false, false]);
		expect(written?.reflection.map((section) => section.written)).toEqual([true, true, true, true]);
	});

	it('a cache entry without headings or sections reads as an empty reflection, without throwing', async () => {
		const [book] = await repository({ 'a.md': { frontmatter: { type: 'book', title: 'A' } } }).list();

		expect(book?.reflection.map((section) => section.written)).toEqual([false, false, false, false]);
	});

	it('skips a note the cache has not read yet; the next read sees it', async () => {
		expect(await repository({ 'a.md': null }).list()).toEqual([]);
	});
});
