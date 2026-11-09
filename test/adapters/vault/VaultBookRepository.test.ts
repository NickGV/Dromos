import { describe, expect, it, vi } from 'vitest';
import type { Timers } from '../../../src/adapters/vault/cacheWait';
import { VaultBookRepository } from '../../../src/adapters/vault/VaultBookRepository';
import { fakeVaultApp, type FakeCache } from '../../fakes/fakeVaultApp';
import { templateMetadata, writtenMetadata } from '../../fakes/noteMetadata';

function repository(notes: Readonly<Record<string, FakeCache>>): VaultBookRepository {
	return repositoryOver(fakeVaultApp(notes));
}

function repositoryOver(app: ReturnType<typeof fakeVaultApp>, timers?: Timers): VaultBookRepository {
	return new VaultBookRepository(app as unknown as ConstructorParameters<typeof VaultBookRepository>[0], timers);
}

/** Timers driven by hand: `advance` runs every handler that is due. */
function manualTimers() {
	let now = 0;
	let nextId = 1;
	const pending = new Map<number, { at: number; handler: () => void }>();
	const timers: Timers = {
		set: (handler, ms) => {
			pending.set(nextId, { at: now + ms, handler });
			return nextId++;
		},
		clear: (handle) => void pending.delete(handle as number),
	};
	const advance = (ms: number): void => {
		now += ms;
		for (const [id, timer] of [...pending]) {
			if (timer.at > now) continue;
			pending.delete(id);
			timer.handler();
		}
	};
	return { timers, pending, advance };
}

const PATH = '03 - Areas/Bibliotheke/Klara y el Sol - Kazuo Ishiguro.md';
const ID = '3f2a1c8e-0000-4000-8000-000000000001';
const BODY = '\n# Klara y el Sol\n\n## De qué trata\n\nUna AA que observa.\n\n## Qué me quedó\n';
const PLANNED = { type: 'book', title: 'Klara y el Sol', author: 'Kazuo Ishiguro', shelf: 'Ficción', status: 'planning', created: '2026-11-06', tags: ['book'] };

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

describe('VaultBookRepository: the state changes Dromos writes (S3, S4)', () => {
	it('startReading writes status active, started and habitica_id, and keeps every other key and the body', async () => {
		const app = fakeVaultApp({ [PATH]: { frontmatter: PLANNED, ...templateMetadata() } }, { bodies: { [PATH]: BODY } });

		expect(await repositoryOver(app).startReading(PATH, { started: '2026-11-09', habiticaId: ID })).toBe('done');

		expect(app.savedFrontmatter(PATH)).toEqual({ ...PLANNED, status: 'active', started: '2026-11-09', habitica_id: ID });
		expect(app.bodyOf(PATH)).toBe(BODY);
	});

	it('finishReading writes status completed and finished, and keeps every other key and the body', async () => {
		const reading = { ...PLANNED, status: 'active', started: '2026-11-01', habitica_id: ID };
		const app = fakeVaultApp({ [PATH]: { frontmatter: reading, ...templateMetadata() } }, { bodies: { [PATH]: BODY } });

		expect(await repositoryOver(app).finishReading(PATH, { finished: '2026-11-09' })).toBe('done');

		expect(app.savedFrontmatter(PATH)).toEqual({ ...reading, status: 'completed', finished: '2026-11-09' });
		expect(app.bodyOf(PATH)).toBe(BODY);
	});

	it('the next list shows the new state', async () => {
		const app = fakeVaultApp({ [PATH]: { frontmatter: PLANNED, ...templateMetadata() } });
		const books = repositoryOver(app);

		await books.startReading(PATH, { started: '2026-11-09', habiticaId: ID });

		expect((await books.list())[0]).toMatchObject({ status: 'active', started: '2026-11-09', habiticaId: ID });
	});

	it('a missing note is not-found and a note that is no longer a book is not-a-book; neither is written', async () => {
		const resource = { type: 'resource', title: 'The Green Mile', status: 'planning' };
		const app = fakeVaultApp({ 'Resources/The Green Mile.md': { frontmatter: resource } });
		const books = repositoryOver(app);

		expect(await books.startReading('Nowhere.md', { started: '2026-11-09', habiticaId: ID })).toBe('not-found');
		expect(await books.finishReading('Nowhere.md', { finished: '2026-11-09' })).toBe('not-found');
		expect(await books.startReading('Resources/The Green Mile.md', { started: '2026-11-09', habiticaId: ID })).toBe('not-a-book');
		expect(await books.finishReading('Resources/The Green Mile.md', { finished: '2026-11-09' })).toBe('not-a-book');
		expect(app.savedFrontmatter('Resources/The Green Mile.md')).toEqual(resource);
	});

	it('never overwrites the habitica_id of another to-do', async () => {
		const linked = { ...PLANNED, habitica_id: 'another-id' };
		const app = fakeVaultApp({ [PATH]: { frontmatter: linked } });

		expect(await repositoryOver(app).startReading(PATH, { started: '2026-11-09', habiticaId: ID })).toBe('already-linked');
		expect(app.savedFrontmatter(PATH)).toEqual(linked);
	});

	it('waits for the cache to show the write before resolving, so the next list already sees it', async () => {
		const app = fakeVaultApp({ [PATH]: { frontmatter: PLANNED } }, { cacheFollowsWrites: false });
		const { timers } = manualTimers();
		let result: string | undefined;

		const writing = repositoryOver(app, timers)
			.startReading(PATH, { started: '2026-11-09', habiticaId: ID })
			.then((value) => (result = value));
		await vi.waitFor(() => expect(app.listenerCount()).toBe(1));
		expect(result).toBeUndefined();

		app.refreshCache(PATH);
		await writing;
		expect(result).toBe('done');
		expect(app.listenerCount()).toBe(0);
	});

	it('stops waiting after three seconds when the cache never catches up; the note is written all the same', async () => {
		const app = fakeVaultApp({ [PATH]: { frontmatter: PLANNED } }, { cacheFollowsWrites: false });
		const { timers, advance } = manualTimers();
		let result: string | undefined;

		const writing = repositoryOver(app, timers)
			.finishReading(PATH, { finished: '2026-11-09' })
			.then((value) => (result = value));
		await vi.waitFor(() => expect(app.listenerCount()).toBe(1));
		advance(2999);
		await Promise.resolve();
		expect(result).toBeUndefined();

		advance(1);
		await writing;
		expect(result).toBe('done');
		expect(app.savedFrontmatter(PATH)).toMatchObject({ status: 'completed', finished: '2026-11-09' });
		expect(app.listenerCount()).toBe(0);
	});

	it('does not wait for the cache when nothing was written', async () => {
		const app = fakeVaultApp({ [PATH]: { frontmatter: { ...PLANNED, type: 'resource' } } }, { cacheFollowsWrites: false });
		const { timers, pending } = manualTimers();

		expect(await repositoryOver(app, timers).startReading(PATH, { started: '2026-11-09', habiticaId: ID })).toBe('not-a-book');
		expect(pending.size).toBe(0);
		expect(app.listenerCount()).toBe(0);
	});

	it('rejects when the note cannot be saved, so the caller can report it', async () => {
		const app = fakeVaultApp({ [PATH]: { frontmatter: PLANNED } }, { failWritesWith: new Error('EACCES') });

		await expect(repositoryOver(app).startReading(PATH, { started: '2026-11-09', habiticaId: ID })).rejects.toThrow('EACCES');
		await expect(repositoryOver(app).finishReading(PATH, { finished: '2026-11-09' })).rejects.toThrow('EACCES');
	});
});
