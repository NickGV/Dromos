import type { Plugin } from 'obsidian';
import {
	createObsidianHttp,
	HabiticaClient,
	HabiticaTaskCreator,
	HabiticaTaskSource,
	HabiticaTaskStatusSource,
	type HabiticaCredentials,
} from '../adapters/habitica';
import { DromosSettingTab, obsidianNoteUri, PluginSettingsStore, SystemClock } from '../adapters/obsidian';
import { VaultCampaignRepository, VaultGameStateRepository } from '../adapters/vault';
import { CampaignState, LinkTaskToCampaign, LoadHome, QuestState, SyncCampaigns, SyncQuests } from '../application';
import type { HomeScreenDeps } from '../ui/containers/HomeScreen';

/** What the plugin registers, built once per plugin load. */
export interface Dromos {
	readonly home: HomeScreenDeps;
	readonly settingTab: DromosSettingTab;
}

/**
 * Composition root: loads the settings and wires the adapters into the use cases.
 * One `QuestState` and one `CampaignState` live for the whole plugin session (D1, D3). The settings tab
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
	const habitica = new HabiticaClient(createObsidianHttp(), credentials);
	const source = new HabiticaTaskSource(habitica, clock);
	const campaignState = new CampaignState();
	const campaignRepository = new VaultCampaignRepository(plugin.app);

	return {
		home: {
			loadHome: new LoadHome({ repository, state }),
			syncQuests: new SyncQuests({ source, clock, state, hasCredentials }),
			questSnapshot: () => state.snapshot(),
			clock,
			campaigns: {
				syncCampaigns: new SyncCampaigns({
					repository: campaignRepository,
					source: new HabiticaTaskStatusSource(habitica),
					clock,
					state: campaignState,
					hasCredentials,
				}),
				linkTask: new LinkTaskToCampaign({
					repository: campaignRepository,
					creator: new HabiticaTaskCreator(habitica),
					// Sent to the user's own Habitica account inside the to-do's notes.
					noteLink: (path) => obsidianNoteUri(plugin.app.vault.getName(), path),
				}),
				campaignSnapshot: () => campaignState.snapshot(),
				staleAfterDays: () => settings.staleAfterDays,
				openNote: (path) => {
					const file = plugin.app.vault.getFileByPath(path);
					if (file) void plugin.app.workspace.getLeaf('tab').openFile(file);
				},
				clock,
			},
		},
		settingTab: new DromosSettingTab(plugin.app, plugin, store, (next) => {
			settings = next;
		}),
	};
}
