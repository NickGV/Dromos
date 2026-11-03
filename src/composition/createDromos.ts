import type { Plugin } from 'obsidian';
import { createTranslator } from '../i18n';
import {
	createObsidianHttp,
	HabiticaClient,
	HabiticaGameTaskSource,
	HabiticaTagCatalog,
	HabiticaTaskCreator,
	HabiticaTaskSource,
	HabiticaTaskStatusSource,
	type HabiticaCredentials,
} from '../adapters/habitica';
import { createMarkdownRender, createOpenSettings, DromosSettingTab, renderIcon, isDesktopApp, LocalDeviceStore, obsidianNoteUri, PluginSettingsStore, showNotice, SystemClipboard, SystemClock } from '../adapters/obsidian';
import { VaultBriefingRepository, VaultCampaignRepository, VaultGameStateRepository, VaultLedgerRepository, VaultRulesRepository, VaultSkillRepository } from '../adapters/vault';
import { CampaignState, GameState, LinkHabitToCampaign, LinkTaskToCampaign, LoadHome, QuestState, RequestBriefing, SyncCampaigns, SyncGame, SyncQuests } from '../application';
import type { HomeScreenDeps } from '../ui/containers/HomeScreen';
import { rebuildMessage } from '../ui/presenters/rebuildView';

/** What the plugin registers, built once per plugin load. */
export interface Dromos {
	readonly home: HomeScreenDeps;
	readonly settingTab: DromosSettingTab;
	/** Recomputes the notes from the ledger and answers with a toast; the open view follows. */
	readonly rebuildGame: () => Promise<void>;
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

	const settingsListeners = new Set<() => void>();
	const gameListeners = new Set<() => void>();
	const clock = new SystemClock();
	const state = new QuestState();
	const rules = new VaultRulesRepository(plugin.app, () => settings.vaultFolder);
	const repository = new VaultGameStateRepository(plugin.app, () => settings.vaultFolder, rules);
	const habitica = new HabiticaClient(createObsidianHttp(), credentials);
	const source = new HabiticaTaskSource(habitica, clock);
	const campaignState = new CampaignState();
	const campaignRepository = new VaultCampaignRepository(plugin.app);
	const vaultFolder = (): string => settings.vaultFolder;
	const sendDeps = {
		repository: campaignRepository,
		creator: new HabiticaTaskCreator(habitica),
		tags: new HabiticaTagCatalog(habitica),
		// Sent to the user's own Habitica account inside the task's notes.
		noteLink: (path: string) => obsidianNoteUri(plugin.app.vault.getName(), path),
	};
	const gameState = new GameState();
	const syncGame = new SyncGame({
		skills: new VaultSkillRepository(plugin.app, vaultFolder),
		ledger: new VaultLedgerRepository(plugin.app, vaultFolder, () => clock.today()),
		characters: repository,
		campaigns: campaignRepository,
		rules,
		source: new HabiticaGameTaskSource(habitica),
		clock,
		state: gameState,
		hasCredentials,
	});

	return {
		home: {
			loadHome: new LoadHome({ repository, briefings: new VaultBriefingRepository(plugin.app, vaultFolder), state }),
			syncQuests: new SyncQuests({ source, clock, state, hasCredentials }),
			syncGame,
			gameSnapshot: () => gameState.snapshot(),
			dismissGameEvents: () => gameState.dismissEvents(),
			takeGameAnnouncements: () => gameState.takeAnnouncements(),
			notify: showNotice,
			renderMarkdown: createMarkdownRender(plugin.app),
			renderIcon,
			// The job runs in OpenCode on the desktop: on a phone there is nowhere to paste the command.
			requestBriefing: isDesktopApp() ? new RequestBriefing(new SystemClipboard()) : null,
			// The signpost's settings plank opens this plugin's tab; hidden where Obsidian has no settings window.
			openSettings: createOpenSettings(plugin.app, plugin.manifest.id),
			questSnapshot: () => state.snapshot(),
			clock,
			// Per-device marks (the letter last opened) in Obsidian's local storage, never in the vault or data.json.
			deviceStore: new LocalDeviceStore(plugin.app),
			translator: () => createTranslator(settings.language),
			language: () => settings.language,
			subscribeSettings: (onChange) => {
				settingsListeners.add(onChange);
				return () => void settingsListeners.delete(onChange);
			},
			subscribeGame: (onChange) => {
				gameListeners.add(onChange);
				return () => void gameListeners.delete(onChange);
			},
			campaigns: {
				syncCampaigns: new SyncCampaigns({
					repository: campaignRepository,
					source: new HabiticaTaskStatusSource(habitica),
					clock,
					state: campaignState,
					hasCredentials,
				}),
				linkTask: new LinkTaskToCampaign(sendDeps),
				linkHabit: new LinkHabitToCampaign(sendDeps),
				campaignSnapshot: () => campaignState.snapshot(),
				staleAfterDays: () => settings.staleAfterDays,
				openNote: (path) => {
					const file = plugin.app.vault.getFileByPath(path);
					if (file) void plugin.app.workspace.getLeaf('tab').openFile(file);
				},
				clock,
			},
		},
		rebuildGame: async () => {
			const outcome = await syncGame.rebuild();
			showNotice(rebuildMessage(outcome, createTranslator(settings.language)));
			gameListeners.forEach((listener) => listener());
		},
		settingTab: new DromosSettingTab(plugin.app, plugin, store, (next) => {
			settings = next;
			settingsListeners.forEach((listener) => listener());
		}),
	};
}
