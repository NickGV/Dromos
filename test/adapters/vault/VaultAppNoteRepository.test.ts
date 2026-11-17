import { describe, expect, it, vi } from 'vitest';
import { buildAppNotes } from '../../../src/adapters/vault/appNoteMapper';
import { VaultAppNoteRepository } from '../../../src/adapters/vault/VaultAppNoteRepository';
import { fakeVaultApp, type FakeCache } from '../../fakes/fakeVaultApp';

function repositoryOver(app: object): VaultAppNoteRepository {
	return new VaultAppNoteRepository(app as ConstructorParameters<typeof VaultAppNoteRepository>[0]);
}

function read(notes: Readonly<Record<string, FakeCache>>) {
	return repositoryOver(fakeVaultApp(notes)).read();
}

const KAIROS_13 = {
	type: 'kairos-day',
	date: '2026-11-13',
	kairos_version: '1.0',
	screen_minutes: 3,
	unlocks: 99,
	notifications: 106,
	gold_spent: 0,
	gold_earned: 0,
	focus_minutes: 0,
	first_app: 'com.sec.android.app.clockpackage',
	under_limit: ['Instagram', 'RVX', 'YouTube'],
	exceeded: [],
};

const CHESHBON_W46 = { type: 'cheshbon-spending-note', period: '2026-W46', start: '2026-11-09', end: '2026-11-15', spent: 412300, income: 0, net: -412300, currency: 'COP', generated_at: '2026-11-16T06:00:00-05:00' };

// app-reports S3: Dromos reads only frontmatter, by `type`, never by folder.
describe('VaultAppNoteRepository: the notes Kairos and Cheshbon write, by type (S3)', () => {
	it('reads a `kairos-day` note and a `cheshbon-spending-note`, only the keys the card needs', async () => {
		const notes = await read({ 'Kairos/2026-11-13.md': { frontmatter: KAIROS_13 }, 'Cheshbon/2026-W46.md': { frontmatter: CHESHBON_W46 } });

		expect(notes).toEqual({
			kairos: [{ date: '2026-11-13', screenMinutes: 3, underLimit: ['Instagram', 'RVX', 'YouTube'], exceeded: [] }],
			cheshbon: [{ period: '2026-W46', start: '2026-11-09', end: '2026-11-15', spent: 412300, income: 0, net: -412300 }],
		});
	});

	it('reads them in any folder, and never an untyped note in Kairos/ or Cheshbon/', async () => {
		const { type: _type, ...untyped } = KAIROS_13;
		const notes = await read({
			'Kairos/2026-11-12.md': { frontmatter: { ...untyped, date: '2026-11-12' } },
			'Cheshbon/2026-W45.md': { frontmatter: { ...CHESHBON_W46, type: undefined, period: '2026-W45' } },
			'Elsewhere/today.md': { frontmatter: { ...KAIROS_13, date: '2026-11-14' } },
			'Kairos/2026-11-11.md': { frontmatter: { ...KAIROS_13, type: 'daily', date: '2026-11-11' } },
			'Kairos/not cached yet.md': null,
		});

		expect(notes.kairos.map((day) => day.date)).toEqual(['2026-11-14']);
		expect(notes.cheshbon).toEqual([]);
	});

	it('never writes, renames, moves or reads the body of a note it reads', async () => {
		const app = fakeVaultApp({ 'Kairos/2026-11-13.md': { frontmatter: KAIROS_13 }, 'Cheshbon/2026-W46.md': { frontmatter: CHESHBON_W46 } });
		const writes = {
			processFrontMatter: vi.spyOn(app.fileManager, 'processFrontMatter'),
			cachedRead: vi.spyOn(app.vault, 'cachedRead'),
			read: vi.fn(),
			modify: vi.fn(),
			process: vi.fn(),
			create: vi.fn(),
			rename: vi.fn(),
			delete: vi.fn(),
			trash: vi.fn(),
			renameFile: vi.fn(),
		};
		const watched = {
			vault: { ...app.vault, read: writes.read, modify: writes.modify, process: writes.process, create: writes.create, rename: writes.rename, delete: writes.delete, trash: writes.trash },
			metadataCache: app.metadataCache,
			fileManager: { ...app.fileManager, renameFile: writes.renameFile },
		};

		await repositoryOver(watched).read();

		for (const [name, spy] of Object.entries(writes)) expect(spy, name).not.toHaveBeenCalled();
		expect(app.savedFrontmatter('Kairos/2026-11-13.md')).toEqual(KAIROS_13);
	});
});

describe('buildAppNotes: one note per Kairos day and per Cheshbon period (S3)', () => {
	it('counts a copy of a Kairos day once, preferring the note named exactly after its date', () => {
		const notes = buildAppNotes([
			{ path: 'Kairos/2026-11-13 (1).md', frontmatter: { ...KAIROS_13, screen_minutes: 300 } },
			{ path: 'Kairos/2026-11-13.md', frontmatter: KAIROS_13 },
			{ path: 'Kairos/2026-11-14 (1).md', frontmatter: { ...KAIROS_13, date: '2026-11-14', screen_minutes: 7 } },
			{ path: 'Kairos/2026-11-14 (2).md', frontmatter: { ...KAIROS_13, date: '2026-11-14', screen_minutes: 9 } },
		]);

		expect(notes.kairos.map((day) => [day.date, day.screenMinutes])).toEqual([
			['2026-11-13', 3],
			['2026-11-14', 7],
		]);
	});

	it('counts a copy of a Cheshbon period once, preferring the note that is not a numbered copy', () => {
		const notes = buildAppNotes([
			{ path: 'Cheshbon/2026-W46 (1).md', frontmatter: { ...CHESHBON_W46, spent: 1 } },
			{ path: 'Cheshbon/2026-W46.md', frontmatter: CHESHBON_W46 },
			{ path: 'Cheshbon/2026-11-16.md', frontmatter: { ...CHESHBON_W46, period: '2026-11-16', start: '2026-11-16', end: '2026-11-16' } },
		]);

		expect(notes.cheshbon.map((note) => [note.period, note.spent])).toEqual([
			['2026-11-16', 412300],
			['2026-W46', 412300],
		]);
	});

	it('skips a Kairos note without a valid `date` and a Cheshbon note without a valid `period`', () => {
		const notes = buildAppNotes([
			{ path: 'Kairos/a.md', frontmatter: { ...KAIROS_13, date: undefined } },
			{ path: 'Kairos/b.md', frontmatter: { ...KAIROS_13, date: '2026-02-30' } },
			{ path: 'Kairos/c.md', frontmatter: { ...KAIROS_13, date: 'yesterday' } },
			{ path: 'Cheshbon/a.md', frontmatter: { ...CHESHBON_W46, period: undefined } },
			{ path: 'Cheshbon/b.md', frontmatter: { ...CHESHBON_W46, period: 'November' } },
			{ path: 'Cheshbon/c.md', frontmatter: { ...CHESHBON_W46, period: '2025-W53' } },
		]);

		expect(notes).toEqual({ kairos: [], cheshbon: [] });
	});

	it('falls back to 0 for a missing or odd number and to an empty list for a value that is not a list, never NaN', () => {
		const notes = buildAppNotes([
			{ path: 'Kairos/2026-11-13.md', frontmatter: { type: 'kairos-day', date: '2026-11-13', screen_minutes: 'many', under_limit: 'Instagram', exceeded: { app: 'YouTube' } } },
			{ path: 'Kairos/2026-11-12.md', frontmatter: { type: 'kairos-day', date: '2026-11-12', screen_minutes: -4, exceeded: ['YouTube', 7, '', ' RVX '] } },
			{ path: 'Kairos/2026-11-11.md', frontmatter: { type: 'kairos-day', date: '2026-11-11', screen_minutes: '42' } },
			{ path: 'Cheshbon/2026-W46.md', frontmatter: { type: 'cheshbon-spending-note', period: '2026-W46', start: 'Monday', spent: null, income: '12.5', net: Number.NaN } },
		]);

		expect(notes.kairos).toEqual([
			{ date: '2026-11-11', screenMinutes: 42, underLimit: [], exceeded: [] },
			{ date: '2026-11-12', screenMinutes: 0, underLimit: [], exceeded: ['YouTube', 'RVX'] },
			{ date: '2026-11-13', screenMinutes: 0, underLimit: [], exceeded: [] },
		]);
		expect(notes.cheshbon).toEqual([{ period: '2026-W46', start: null, end: null, spent: 0, income: 0, net: 0 }]);
	});

	it('keeps a negative net and rounds a fractional amount to whole pesos', () => {
		const [note] = buildAppNotes([{ path: 'Cheshbon/2026-W46.md', frontmatter: { ...CHESHBON_W46, spent: 412300.4, income: '-5', net: '-412300' } }]).cheshbon;

		expect(note).toMatchObject({ spent: 412300, income: -5, net: -412300 });
	});
});
