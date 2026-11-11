import { describe, expect, it } from 'vitest';
import { shopNotePath } from '../../../src/adapters/vault/folderPath';
import { VaultOfferRepository } from '../../../src/adapters/vault/VaultOfferRepository';

function fakeVault(notes: Record<string, string>) {
	const calls: string[] = [];
	return {
		calls,
		app: {
			vault: {
				getFileByPath: (path: string) => (path in notes ? { path } : null),
				cachedRead: (file: { path: string }) => {
					calls.push(`cachedRead ${file.path}`);
					return Promise.resolve(notes[file.path] ?? '');
				},
			},
		},
	};
}

const repository = (vault: ReturnType<typeof fakeVault>, folder = 'Dromos') => new VaultOfferRepository(vault.app as unknown as ConstructorParameters<typeof VaultOfferRepository>[0], () => shopNotePath(folder));

describe('VaultOfferRepository (M10 S2)', () => {
	it('reads <folder>/Shop.md by its path, whatever its type, and never writes it', async () => {
		const vault = fakeVault({ 'Dromos/Shop.md': '| id | offer | price | why | until |\n|---|---|---|---|---|\n| walk | A long walk | 15 |  |  |\n' });

		expect(await repository(vault).load()).toEqual({ offers: [{ id: 'walk', offer: 'A long walk', price: 15, why: null, until: null }], unreadable: [] });
		expect(vault.calls).toEqual(['cachedRead Dromos/Shop.md']);
	});

	it('has no offers when the note does not exist', async () => {
		expect(await repository(fakeVault({})).load()).toEqual({ offers: [], unreadable: [] });
	});

	it('reports the rows it could not read with the note path', async () => {
		const vault = fakeVault({ 'Game/Shop.md': '| id | offer | price | why | until |\n|---|---|---|---|---|\n| walk | A long walk | free |  |  |\n' });

		expect((await repository(vault, 'Game').load()).unreadable).toEqual([{ path: 'Game/Shop.md', line: 3, text: '| walk | A long walk | free |  |  |' }]);
	});
});
