import { describe, expect, it } from 'vitest';
import type { LibraryState } from '../../src/application';
import { runBookAction } from '../../src/ui/containers/libraryActions';
import { aBook } from '../fakes/books';

const after: LibraryState = { kind: 'loaded', books: [aBook({ status: 'active' })] };

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
