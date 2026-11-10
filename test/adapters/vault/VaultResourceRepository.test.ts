import { describe, expect, it, vi } from 'vitest';
import type { Timers } from '../../../src/adapters/vault/cacheWait';
import { VaultResourceRepository } from '../../../src/adapters/vault/VaultResourceRepository';
import { fakeVaultApp, type FakeCache } from '../../fakes/fakeVaultApp';
import { block, heading, headingsOf, metadataOf } from '../../fakes/noteMetadata';

function repositoryOver(app: ReturnType<typeof fakeVaultApp>, timers?: Timers): VaultResourceRepository {
	return new VaultResourceRepository(app as unknown as ConstructorParameters<typeof VaultResourceRepository>[0], timers);
}

const PATH = '04 - Resources/Posts-Papers/Como pensar en modulos.md';
const SAVED = { type: 'resource', sourceType: 'post', title: 'Cómo pensar en módulos', status: 'seedling', url: 'https://martinfowler.com/a', saved: '2026-11-07', tags: ['architecture'] };
const BODY = '\n# Cómo pensar en módulos\n\nContexto.\n\n## Lo que me dejó\n';

describe('VaultResourceRepository: the archive, read through the metadata cache (M8 S3)', () => {
	it('lists the saved resources only, whatever their folder, the most recently saved first', async () => {
		const resources = await repositoryOver(
			fakeVaultApp({
				[PATH]: { frontmatter: SAVED, ...metadataOf(block('yaml'), heading(2, 'Lo que me dejó'), block('paragraph')) },
				'01 - Inbox/Nuevo.md': { frontmatter: { ...SAVED, title: 'Nuevo', saved: '2026-11-09' } },
				'04 - Resources/Viejo.md': { frontmatter: { type: 'resource', sourceType: 'post', title: 'Viejo' } },
				'03 - Areas/Bibliotheke/Klara.md': { frontmatter: { type: 'book', title: 'Klara', saved: '2026-11-07' } },
				'Templates/resource.md': { frontmatter: SAVED },
				'Sin cache.md': null,
			}),
		).list();

		expect(resources.map((resource) => [resource.title, resource.takeawayWritten])).toEqual([
			['Nuevo', false],
			['Cómo pensar en módulos', true],
		]);
	});
});

describe('VaultResourceRepository: "Lo que me dejó", for the card (M8 S6)', () => {
	const TEXT = ['---', 'type: resource', '---', '', '# Cómo pensar en módulos', '', 'Contexto.', '', '## Lo que me dejó', '', 'Un módulo es una decisión.', '', '### Para Dromos', '', '- Separar el archivo.', ''].join('\n');
	const cached = (frontmatter: unknown): FakeCache => ({ frontmatter, headings: headingsOf(TEXT), sections: [] });

	it('reads the note and answers the text under the heading, sub-headings included', async () => {
		const app = fakeVaultApp({ [PATH]: cached(SAVED) }, { bodies: { [PATH]: TEXT } });

		expect(await repositoryOver(app).readTakeaway(PATH)).toBe('Un módulo es una decisión.\n\n### Para Dromos\n\n- Separar el archivo.');
	});

	it("answers '' for a resource with no such section", async () => {
		const text = '---\ntype: resource\n---\n\n# Título\n\nContexto.';
		const app = fakeVaultApp({ [PATH]: { frontmatter: SAVED, headings: headingsOf(text), sections: [] } }, { bodies: { [PATH]: text } });

		expect(await repositoryOver(app).readTakeaway(PATH)).toBe('');
	});

	it('answers null for a missing note, a note that is not a resource, or one not cached yet', async () => {
		const app = fakeVaultApp({ [PATH]: cached({ type: 'book' }), 'b.md': null }, { bodies: { [PATH]: TEXT }, failReadsWith: new Error('read') });

		expect(await repositoryOver(app).readTakeaway('otro.md')).toBeNull();
		expect(await repositoryOver(app).readTakeaway(PATH)).toBeNull();
		expect(await repositoryOver(app).readTakeaway('b.md')).toBeNull();
	});

	it('rejects when the note cannot be read', async () => {
		const app = fakeVaultApp({ [PATH]: cached(SAVED) }, { failReadsWith: new Error('disk') });

		await expect(repositoryOver(app).readTakeaway(PATH)).rejects.toThrow('disk');
	});
});

describe('VaultResourceRepository: "Marcar como leído" writes only `finished` (M8 S6)', () => {
	it('writes `finished` and keeps every other key and the body; the next list shows it', async () => {
		const app = fakeVaultApp({ [PATH]: { frontmatter: SAVED } }, { bodies: { [PATH]: BODY } });
		const resources = repositoryOver(app);

		expect(await resources.markFinished(PATH, { finished: '2026-11-10' })).toBe('done');

		expect(app.savedFrontmatter(PATH)).toEqual({ ...SAVED, finished: '2026-11-10' });
		expect(app.bodyOf(PATH)).toBe(BODY);
		expect((await resources.list())[0]?.finished).toBe('2026-11-10');
	});

	it('a missing note is not-found, a note that is not a resource is not-a-resource, a finished one keeps its date', async () => {
		const book = { type: 'book', title: 'Klara' };
		const finished = { ...SAVED, finished: '2026-11-09' };
		const app = fakeVaultApp({ 'book.md': { frontmatter: book }, [PATH]: { frontmatter: finished } });
		const resources = repositoryOver(app);

		expect(await resources.markFinished('otro.md', { finished: '2026-11-10' })).toBe('not-found');
		expect(await resources.markFinished('book.md', { finished: '2026-11-10' })).toBe('not-a-resource');
		expect(await resources.markFinished(PATH, { finished: '2026-11-10' })).toBe('already-finished');
		expect(app.savedFrontmatter('book.md')).toEqual(book);
		expect(app.savedFrontmatter(PATH)).toEqual(finished);
	});

	it('waits for the cache to show the write before resolving, so the next list already sees it', async () => {
		const app = fakeVaultApp({ [PATH]: { frontmatter: SAVED } }, { cacheFollowsWrites: false });
		const resources = repositoryOver(app, { set: () => 0, clear: () => undefined });
		let result: string | undefined;

		const writing = resources.markFinished(PATH, { finished: '2026-11-10' }).then((value) => (result = value));
		await vi.waitFor(() => expect(app.listenerCount()).toBe(1));
		expect(result).toBeUndefined();

		app.refreshCache(PATH);
		await writing;
		expect(result).toBe('done');
		expect((await resources.list())[0]?.finished).toBe('2026-11-10');
		expect(app.listenerCount()).toBe(0);
	});

	it('rejects when the note cannot be saved', async () => {
		const app = fakeVaultApp({ [PATH]: { frontmatter: SAVED } }, { failWritesWith: new Error('disk full') });

		await expect(repositoryOver(app).markFinished(PATH, { finished: '2026-11-10' })).rejects.toThrow('disk full');
	});
});
