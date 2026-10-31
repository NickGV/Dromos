import { describe, expect, it } from 'vitest';
import { PluginSettingsStore, type PluginDataHost } from '../../../src/adapters/obsidian/PluginSettingsStore';
import { DEFAULT_SETTINGS, type Settings } from '../../../src/ports';

/** Stands in for the Obsidian plugin: keeps `data.json` in memory. */
class FakePlugin implements PluginDataHost {
	saved: unknown[] = [];

	constructor(public data: unknown) {}

	loadData(): Promise<unknown> {
		return Promise.resolve(this.data);
	}

	saveData(data: unknown): Promise<void> {
		this.saved.push(data);
		this.data = data;
		return Promise.resolve();
	}
}

const STORED: Settings = {
	habiticaUserId: 'user-123',
	habiticaApiToken: 'token-abc',
	vaultFolder: 'Notas/Dromos',
	staleAfterDays: 21,
	language: 'es',
};

describe('PluginSettingsStore.load', () => {
	it('returns the defaults on first run, when data.json does not exist', async () => {
		expect(await new PluginSettingsStore(new FakePlugin(null)).load()).toEqual(DEFAULT_SETTINGS);
		expect(await new PluginSettingsStore(new FakePlugin(undefined)).load()).toEqual(DEFAULT_SETTINGS);
	});

	it('returns every stored field', async () => {
		expect(await new PluginSettingsStore(new FakePlugin({ ...STORED })).load()).toEqual(STORED);
	});

	it('fills fields that were never saved from the defaults', async () => {
		const store = new PluginSettingsStore(new FakePlugin({ habiticaUserId: 'user-123' }));
		expect(await store.load()).toEqual({ ...DEFAULT_SETTINGS, habiticaUserId: 'user-123' });
	});

	it('uses the default for any field that is not a string', async () => {
		const store = new PluginSettingsStore(
			new FakePlugin({ habiticaUserId: 42, habiticaApiToken: null, vaultFolder: ['Dromos'] }),
		);
		expect(await store.load()).toEqual(DEFAULT_SETTINGS);
	});

	it('uses the defaults when data.json is not an object', async () => {
		for (const data of ['text', 7, true, ['user-123']]) {
			expect(await new PluginSettingsStore(new FakePlugin(data)).load()).toEqual(DEFAULT_SETTINGS);
		}
	});

	it('ignores unknown stored fields', async () => {
		const store = new PluginSettingsStore(new FakePlugin({ ...STORED, extra: 'x' }));
		expect(await store.load()).toEqual(STORED);
	});

	it('returns the vault folder without trailing slashes, and the default when blank', async () => {
		const trailing = new PluginSettingsStore(new FakePlugin({ vaultFolder: ' Notas/Dromos/ ' }));
		expect((await trailing.load()).vaultFolder).toBe('Notas/Dromos');
		const blank = new PluginSettingsStore(new FakePlugin({ vaultFolder: '' }));
		expect((await blank.load()).vaultFolder).toBe('Dromos');
	});
});

describe('PluginSettingsStore.save', () => {
	it('writes exactly the three settings to the plugin data', async () => {
		const plugin = new FakePlugin(null);
		const extended = { ...STORED, extra: 'not a setting' } as Settings;
		await new PluginSettingsStore(plugin).save(extended);
		expect(plugin.saved).toEqual([STORED]);
	});

	it('round-trips through load', async () => {
		const plugin = new FakePlugin(null);
		const store = new PluginSettingsStore(plugin);
		await store.save(STORED);
		expect(await store.load()).toEqual(STORED);
	});
});

describe('PluginSettingsStore: staleAfterDays', () => {
	it('defaults to 14 days and keeps a stored positive whole number', async () => {
		expect(DEFAULT_SETTINGS.staleAfterDays).toBe(14);
		expect((await new PluginSettingsStore(new FakePlugin({ staleAfterDays: 30 })).load()).staleAfterDays).toBe(30);
	});

	it('falls back to the default for anything else', async () => {
		for (const bad of [0, -3, 2.5, '14', null, Number.NaN]) {
			expect((await new PluginSettingsStore(new FakePlugin({ staleAfterDays: bad })).load()).staleAfterDays).toBe(14);
		}
	});

	it('saves it with the other settings', async () => {
		const plugin = new FakePlugin(null);

		await new PluginSettingsStore(plugin).save(STORED);

		expect(plugin.saved[0]).toMatchObject({ staleAfterDays: 21 });
	});
});

describe('PluginSettingsStore: language', () => {
	it('defaults to English and keeps a stored supported language', async () => {
		expect(DEFAULT_SETTINGS.language).toBe('en');
		expect((await new PluginSettingsStore(new FakePlugin({})).load()).language).toBe('en');
		expect((await new PluginSettingsStore(new FakePlugin({ language: 'es' })).load()).language).toBe('es');
	});

	it('falls back to English for an unknown value, so an old or edited data.json never breaks the view', async () => {
		for (const bad of ['fr', '', 'ES', 1, null]) {
			expect((await new PluginSettingsStore(new FakePlugin({ language: bad })).load()).language).toBe('en');
		}
	});

	it('saves it with the other settings', async () => {
		const plugin = new FakePlugin(null);

		await new PluginSettingsStore(plugin).save(STORED);

		expect(plugin.saved[0]).toMatchObject({ language: 'es' });
	});
});
