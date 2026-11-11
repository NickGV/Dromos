import { describe, expect, it } from 'vitest';
import { purseNotePath } from '../../../src/adapters/vault/folderPath';
import { VaultPurseRepository } from '../../../src/adapters/vault/VaultPurseRepository';
import type { PurseEntry } from '../../../src/domain';

const level3: PurseEntry = { date: '2026-11-11', kind: 'bonus', what: 'Level 3', gold: 30, level: 3, offer: null };
const coffee: PurseEntry = { date: '2026-11-11', kind: 'purchase', what: 'Coffee', gold: -20, level: null, offer: null };

/** The slice of the vault the purse uses: notes by path, read from disk, processed in one step, created, folders. */
function fakeVault(notes: Record<string, string> = {}, folders: string[] = []) {
	const files = new Map(Object.entries(notes));
	const made = new Set(folders);
	const calls: string[] = [];
	const file = (path: string) => (files.has(path) ? { path } : null);
	return {
		calls,
		text: (path: string) => files.get(path),
		app: {
			vault: {
				getFileByPath: file,
				getFolderByPath: (path: string) => (made.has(path) ? { path } : null),
				read: (note: { path: string }) => {
					calls.push(`read ${note.path}`);
					return Promise.resolve(files.get(note.path) ?? '');
				},
				cachedRead: (note: { path: string }) => {
					calls.push(`cachedRead ${note.path}`);
					return Promise.resolve(files.get(note.path) ?? '');
				},
				process: (note: { path: string }, change: (text: string) => string) => {
					calls.push(`process ${note.path}`);
					files.set(note.path, change(files.get(note.path) ?? ''));
					return Promise.resolve(files.get(note.path) ?? '');
				},
				create: (path: string, text: string) => {
					calls.push(`create ${path}`);
					files.set(path, text);
					return Promise.resolve({ path });
				},
				createFolder: (path: string) => {
					calls.push(`createFolder ${path}`);
					made.add(path);
					return Promise.resolve();
				},
			},
		},
	};
}

const repository = (vault: ReturnType<typeof fakeVault>, folder = 'Dromos') => new VaultPurseRepository(vault.app as unknown as ConstructorParameters<typeof VaultPurseRepository>[0], () => purseNotePath(folder), () => '2026-11-11');

describe('VaultPurseRepository (M10 S3)', () => {
	it('reads <folder>/Purse.md from disk, not from the cache, so a row just synced counts', async () => {
		const vault = fakeVault({ 'Dromos/Purse.md': '| date | kind | what | gold | level | offer |\n|---|---|---|---|---|---|\n| 2026-11-11 | bonus | Level 3 | 30 | 3 |  |\n' });

		const purse = await repository(vault).read();

		expect(purse.entries).toEqual([level3]);
		expect(vault.calls).toEqual(['read Dromos/Purse.md']);
	});

	it('reads an empty purse when the note does not exist', async () => {
		expect(await repository(fakeVault()).read()).toEqual({ entries: [], unreadable: [] });
	});

	it('reports the unreadable rows with the note path', async () => {
		const vault = fakeVault({ 'Dromos/Purse.md': '| date | kind | what | gold | level | offer |\n|---|---|---|---|---|---|\n| nope | bonus | x | 1 | 1 |  |\n' });

		expect((await repository(vault).read()).unreadable).toEqual([{ path: 'Dromos/Purse.md', line: 3, text: '| nope | bonus | x | 1 | 1 |  |' }]);
	});

	it('creates the note, with its folder, on the first entry', async () => {
		const vault = fakeVault();

		await repository(vault, 'Game/').append([coffee]);

		expect(vault.calls).toEqual(['createFolder Game', 'create Game/Purse.md']);
		expect(vault.text('Game/Purse.md')).toBe('---\ntype: dromos-purse\ncreated: 2026-11-11\n---\n\n# Purse\n\n| date | kind | what | gold | level | offer |\n|---|---|---|---|---|---|\n| 2026-11-11 | purchase | Coffee | -20 |  |  |\n');
	});

	it('adds to the note in one step when it exists, never rewriting what is there', async () => {
		const vault = fakeVault({ 'Dromos/Purse.md': '---\ntype: dromos-purse\n---\n\n| date | kind | what | gold | level | offer |\n|---|---|---|---|---|---|\n| 2026-11-11 | bonus | Level 3 | 30 | 3 |  |\n\nMine.\n' }, ['Dromos']);

		await repository(vault).append([coffee]);

		expect(vault.calls).toEqual(['process Dromos/Purse.md']);
		expect(vault.text('Dromos/Purse.md')).toBe('---\ntype: dromos-purse\n---\n\n| date | kind | what | gold | level | offer |\n|---|---|---|---|---|---|\n| 2026-11-11 | bonus | Level 3 | 30 | 3 |  |\n| 2026-11-11 | purchase | Coffee | -20 |  |  |\n\nMine.\n');
	});

	it('writes appends one after another, so two at once never create the note twice', async () => {
		const vault = fakeVault({}, ['Dromos']);
		const purse = repository(vault);

		await Promise.all([purse.append([level3]), purse.append([coffee])]);

		expect(vault.calls).toEqual(['create Dromos/Purse.md', 'process Dromos/Purse.md']);
		expect((await purse.read()).entries).toEqual([level3, coffee]);
	});
});
