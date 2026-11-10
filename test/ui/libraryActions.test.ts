import { describe, expect, it } from 'vitest';
import type { CampaignSnapshot, LibraryState } from '../../src/application';
import type { ReflectionText } from '../../src/ports';
import { reflectionLoader, runBookAction, runHabitSend } from '../../src/ui/containers/libraryActions';
import { aBook } from '../fakes/books';

const after: LibraryState = { kind: 'loaded', books: [aBook({ status: 'active' })], resources: [] };

describe('runBookAction (M7 S5)', () => {
	it('runs the state action on the book, then reads the books again and answers with them', async () => {
		const calls: string[] = [];
		const state = await runBookAction(
			(path) => {
				calls.push(`act:${path}`);
				return Promise.resolve();
			},
			'Bibliotheke/Klara.md',
			{
				execute: () => {
					calls.push('load');
					return Promise.resolve(after);
				},
			},
		);

		expect(calls).toEqual(['act:Bibliotheke/Klara.md', 'load']);
		expect(state).toBe(after);
	});

	it('waits for the action to settle before reading', async () => {
		const calls: string[] = [];
		let settle: () => void = () => undefined;
		const pending = runBookAction(
			() =>
				new Promise<void>((resolve) => {
					settle = resolve;
				}),
			'a.md',
			{
				execute: () => {
					calls.push('load');
					return Promise.resolve(after);
				},
			},
		);
		await Promise.resolve();
		expect(calls).toEqual([]);

		settle();
		await pending;
		expect(calls).toEqual(['load']);
	});

	it('still reads the books again when the action rejects, so the screen shows what is true', async () => {
		const state = await runBookAction(() => Promise.reject(new Error('offline')), 'a.md', { execute: () => Promise.resolve(after) });

		expect(state).toBe(after);
	});
});

describe('reflectionLoader: the text of the open card (M7 S5)', () => {
	const textOf = (about: string): ReflectionText => ({ about, kept: '', changes: '', connects: '' });

	/** A reader whose reads settle by hand, in any order. */
	function manualReader() {
		const pending: { path: string; settle: (text: ReflectionText | null) => void; fail: (error: Error) => void }[] = [];
		const reader = {
			execute: (path: string) =>
				new Promise<ReflectionText | null>((resolve, reject) => {
					pending.push({ path, settle: resolve, fail: reject });
				}),
		};
		return { reader, pending };
	}

	/** Lets the reads that settled hand their text over: each one is a single `then` away. */
	const settled = async (): Promise<void> => {
		for (let tick = 0; tick < 3; tick += 1) await Promise.resolve();
	};

	it('reads the text of the path and hands it over with that path', async () => {
		const delivered: [string, ReflectionText | null][] = [];
		const loader = reflectionLoader({ execute: (path) => Promise.resolve(textOf(path)) }, (path, text) => delivered.push([path, text]));

		loader.load('a.md');
		await settled();

		expect(delivered).toEqual([['a.md', textOf('a.md')]]);
	});

	it('drops a slow read once a later one started, so an old card never replaces the text of the open one', async () => {
		const delivered: string[] = [];
		const { reader, pending } = manualReader();
		const loader = reflectionLoader(reader, (path) => delivered.push(path));

		loader.load('a.md');
		loader.load('b.md');
		pending[1]?.settle(textOf('b'));
		pending[0]?.settle(textOf('a'));
		await settled();

		expect(delivered).toEqual(['b.md']);
	});

	it('hands nothing over after stop, as for a screen that closed', async () => {
		const delivered: string[] = [];
		const { reader, pending } = manualReader();
		const loader = reflectionLoader(reader, (path) => delivered.push(path));

		loader.load('a.md');
		loader.stop();
		pending[0]?.settle(textOf('a'));
		await settled();

		expect(delivered).toEqual([]);
	});

	it('hands over null when the read rejects, so the card keeps its labels', async () => {
		const delivered: [string, ReflectionText | null][] = [];
		const { reader, pending } = manualReader();
		const loader = reflectionLoader(reader, (path, text) => delivered.push([path, text]));

		loader.load('a.md');
		pending[0]?.fail(new Error('disk'));
		await settled();

		expect(delivered).toEqual([['a.md', null]]);
	});

	it('loads the takeaway of a resource card the same way, a slow read of another card dropped (M8 S6)', async () => {
		const delivered: [string, string | null][] = [];
		const pending: { path: string; settle: (text: string | null) => void }[] = [];
		const loader = reflectionLoader<string>({ execute: (path) => new Promise<string | null>((resolve) => pending.push({ path, settle: resolve })) }, (path, text) => delivered.push([path, text]));

		loader.load('old.md');
		loader.load('new.md');
		pending[0]?.settle('viejo');
		pending[1]?.settle('');
		await settled();

		expect(delivered).toEqual([['new.md', '']]);
	});
});

describe('runHabitSend: "Send to Habitica" beside the desk (ADR-017, S2)', () => {
	const reloaded: CampaignSnapshot = { campaigns: [], areas: [], issues: [], lastSyncedAt: null, status: { kind: 'synced' } };

	it('sends the habit, then re-reads the vault with no Habitica request and answers with the new snapshot', async () => {
		const calls: string[] = [];
		const snapshot = await runHabitSend(
			(areaPath, title) => {
				calls.push(`send:${areaPath}|${title}`);
				return Promise.resolve();
			},
			'Archeion.md',
			'Leer 10 minutos',
			{
				reload: () => {
					calls.push('reload');
					return Promise.resolve(reloaded);
				},
			},
		);

		expect(calls).toEqual(['send:Archeion.md|Leer 10 minutos', 'reload']);
		expect(snapshot).toBe(reloaded);
	});

	it('still re-reads when the send rejects, so the screen shows what the note holds', async () => {
		const snapshot = await runHabitSend(() => Promise.reject(new Error('offline')), 'Archeion.md', 'Leer', { reload: () => Promise.resolve(reloaded) });

		expect(snapshot).toBe(reloaded);
	});
});
