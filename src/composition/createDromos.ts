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
import { createMarkdownRender, createOpenCardModal, createOpenSettings, DromosSettingTab, renderIcon, isDesktopApp, LocalDeviceStore, obsidianNoteLink, PluginSettingsStore, showNotice, SystemClipboard, SystemClock } from '../adapters/obsidian';
import { VaultBookRepository, VaultBriefingRepository, VaultCampaignRepository, VaultGameStateRepository, VaultLedgerRepository, VaultResourceRepository, VaultRulesRepository, VaultSkillRepository } from '../adapters/vault';
import { CampaignState, FinishReading, GameState, LinkHabitToArea, LinkHabitToCampaign, LinkTaskToCampaign, LoadHome, LoadLibrary, MarkResourceFinished, QuestState, ReadReflection, ReadTakeaway, RequestBriefing, StartReading, SyncCampaigns, SyncGame, SyncQuests } from '../application';
import type { Settings } from '../ports';
import type { HomeScreenDeps } from '../ui/containers/HomeScreen';
import { linkOutcomeView } from '../ui/presenters/linkOutcomeView';
import { readingOutcomeView, readingTodo } from '../ui/presenters/readingView';
import { resourceOutcomeView } from '../ui/presenters/resourceCardView';
import { rebuildMessage } from '../ui/presenters/rebuildView';

/** What the plugin registers, built once per plugin load. */
export interface Dromos {
	readonly home: HomeScreenDeps;
	readonly settingTab: DromosSettingTab;
	/** Recomputes the notes from the ledger and answers with a toast; the open view follows. */
	readonly rebuildGame: () => Promise<void>;
	/** The live settings: reflects every change saved from the settings tab. */
	readonly settings: () => Settings;
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
		// Sent to the user's own Habitica account inside the task's notes, as a Markdown link Habitica makes clickable.
		noteLink: (path: string) => obsidianNoteLink(createTranslator(settings.language)('link.openInObsidian'), plugin.app.vault.getName(), path),
	};
	const books = new VaultBookRepository(plugin.app);
	// The archive's resources (ADR-018): read with the books; Dromos writes only `finished`.
	const resources = new VaultResourceRepository(plugin.app);
	const startReading = new StartReading({
		repository: books,
		creator: sendDeps.creator,
		tags: sendDeps.tags,
		clock,
		readingTodo: (book) => readingTodo(book, createTranslator(settings.language), sendDeps.noteLink),
	});
	const finishReading = new FinishReading({ repository: books, clock });
	// "Marcar como leído" on a resource of the archive (M8 S6): writes only `finished`, no request, no XP.
	const markResourceFinished = new MarkResourceFinished({ repository: resources, clock });
	// One campaigns sync for the session: it also brings the streaks of the areas' reading habits (ADR-017).
	const syncCampaigns = new SyncCampaigns({
		repository: campaignRepository,
		areas: campaignRepository,
		source: new HabiticaTaskStatusSource(habitica),
		clock,
		state: campaignState,
		hasCredentials,
	});
	const linkAreaHabit = new LinkHabitToArea(sendDeps);
	// One renderer for the briefing and the book card: both draw note text as Obsidian does.
	const renderMarkdown = createMarkdownRender(plugin.app);
	// Opens a note in another tab; the campaigns' "Open note" and the book card's "Abrir la nota".
	const openNote = (path: string): void => {
		const file = plugin.app.vault.getFileByPath(path);
		if (file) void plugin.app.workspace.getLeaf('tab').openFile(file);
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
			renderMarkdown,
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
				syncCampaigns,
				linkTask: new LinkTaskToCampaign(sendDeps),
				linkHabit: new LinkHabitToCampaign(sendDeps),
				campaignSnapshot: () => campaignState.snapshot(),
				staleAfterDays: () => settings.staleAfterDays,
				openNote,
				clock,
			},
			// "Empezar a leer", "Terminar" (M7 S3, S4), a resource's "Marcar como leído" (M8 S6) and a habit's "Enviar a Habitica" (ADR-017) toast their outcome; the screen reads again after.
			library: {
				loadLibrary: new LoadLibrary({ books, resources }),
				readReflection: new ReadReflection({ books }),
				renderMarkdown,
				startReading: async (path) => showNotice(readingOutcomeView(await startReading.execute(path), createTranslator(settings.language)).message),
				finishReading: async (path) => showNotice(readingOutcomeView(await finishReading.execute(path), createTranslator(settings.language)).message),
				readTakeaway: new ReadTakeaway({ resources }),
				markResourceFinished: async (path) => showNotice(resourceOutcomeView(await markResourceFinished.execute(path), createTranslator(settings.language)).message),
				habits: {
					snapshot: () => campaignState.snapshot(),
					sync: syncCampaigns,
					send: async (areaPath, title) => showNotice(linkOutcomeView(await linkAreaHabit.execute(areaPath, title), createTranslator(settings.language)).message),
				},
				openCard: createOpenCardModal(plugin.app),
				openNote,
				clock,
			},
		},
		settings: () => settings,
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
