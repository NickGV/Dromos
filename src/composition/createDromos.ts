import type { Plugin } from 'obsidian';
import { createObsidianHttp, HabiticaClient, HabiticaTaskSource, type HabiticaCredentials } from '../adapters/habitica';
import { DromosSettingTab, PluginSettingsStore, SystemClock } from '../adapters/obsidian';
import { VaultGameStateRepository } from '../adapters/vault';
import { LoadHome, QuestState, SyncQuests } from '../application';
import type { HomeScreenDeps } from '../ui/containers/HomeScreen';

/** What the plugin registers, built once per plugin load. */
export interface Dromos {
	readonly home: HomeScreenDeps;
	readonly settingTab: DromosSettingTab;
}

/**
 * Composition root: loads the settings and wires the adapters into the use cases.
 * One `QuestState` lives for the whole plugin session (D1, D3). The settings tab
 * only replaces the live settings: nothing syncs from there, because it fires on
 * every keystroke and Habitica allows 30 requests per minute; new values apply on
 * the next open or "Sincronizar".
 */
export async function createDromos(plugin: Plugin): Promise<Dromos> {
	const store = new PluginSettingsStore(plugin);
	let settings = await store.load();
	const credentials = (): HabiticaCredentials => ({
		userId: settings.habiticaUserId.trim(),
		apiToken: settings.habiticaApiToken.trim(),
	});
	const hasCredentials = (): boolean => {
		const { userId, apiToken } = credentials();
		return userId !== '' && apiToken !== '';
	};

	const clock = new SystemClock();
	const state = new QuestState();
	const repository = new VaultGameStateRepository(plugin.app, () => settings.vaultFolder);
	const source = new HabiticaTaskSource(new HabiticaClient(createObsidianHttp(), credentials), clock);

	return {
		home: {
			loadHome: new LoadHome({ repository, state }),
			syncQuests: new SyncQuests({ source, clock, state, hasCredentials }),
			questSnapshot: () => state.snapshot(),
			clock,
		},
		settingTab: new DromosSettingTab(plugin.app, plugin, store, (next) => {
			settings = next;
		}),
	};
}
