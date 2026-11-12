import { describe, expect, it } from 'vitest';
import { titlesNotePath } from '../../../src/adapters/vault/folderPath';
import { VaultTitleRepository } from '../../../src/adapters/vault/VaultTitleRepository';

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

const repository = (vault: ReturnType<typeof fakeVault>, folder = 'Dromos') => new VaultTitleRepository(vault.app as unknown as ConstructorParameters<typeof VaultTitleRepository>[0], () => titlesNotePath(folder));
const TABLE = '| id | title | feat | granted | why |\n|---|---|---|---|---|\n';

describe('VaultTitleRepository (titles S3, ADR-020)', () => {
	it('reads <folder>/Titles.md by its path, whatever its type, and never writes it', async () => {
		const vault = fakeVault({ 'Dromos/Titles.md': `${TABLE}| corredor | Corredor | Empezar el camino. | 2026-11-01 | Un paso. |\n` });

		expect(await repository(vault).load()).toEqual({ titles: [{ id: 'corredor', title: 'Corredor', feat: 'Empezar el camino.', granted: '2026-11-01', why: 'Un paso.' }], unreadable: [] });
		expect(vault.calls).toEqual(['cachedRead Dromos/Titles.md']);
	});

	it('has no titles when the note does not exist', async () => {
		expect(await repository(fakeVault({})).load()).toEqual({ titles: [], unreadable: [] });
	});

	it('reports the rows it could not read with the note path', async () => {
		const vault = fakeVault({ 'Game/Titles.md': `${TABLE}| corredor | Corredor | Empezar. | someday | Un paso. |\n` });

		expect((await repository(vault, 'Game').load()).unreadable).toEqual([{ path: 'Game/Titles.md', line: 3, text: '| corredor | Corredor | Empezar. | someday | Un paso. |' }]);
	});
});
