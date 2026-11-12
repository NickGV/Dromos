import type { Plugin } from 'obsidian';
import { createTranslator } from '../i18n';
import {
	createObsidianHttp,
	HabiticaClient,
	HabiticaGameTaskSource,
	HabiticaGoldAccount,
	HabiticaRewardCatalog,
	HabiticaTagCatalog,
	HabiticaTaskCreator,
	HabiticaTaskSource,
	HabiticaTaskStatusSource,
	type HabiticaCredentials,
} from '../adapters/habitica';
import { createMarkdownRender, createOpenCardModal, createOpenSettings, DromosSettingTab, renderIcon, isDesktopApp, linksOpenInObsidian, LocalDeviceStore, obsidianNoteLink, PluginSettingsStore, showNotice, SystemClipboard, SystemClock } from '../adapters/obsidian';
import {
	notePathIn,
	purseNotePath,
	shopNotePath,
	titlesNotePath,
	VaultBookRepository,
	VaultBriefingRepository,
	VaultCampaignRepository,
	VaultGameStateRepository,
	VaultLedgerRepository,
	VaultOfferRepository,
	VaultPurseRepository,
	VaultResourceRepository,
	VaultRulesRepository,
	VaultSkillRepository,
	VaultTitleRepository,
} from '../adapters/vault';
import { BuyOffer, BuyReward, CampaignState, ChooseTitle, FinishReading, GameState, LinkHabitToArea, LinkHabitToCampaign, LinkTaskToCampaign, LoadAvatar, LoadHome, LoadLibrary, LoadShop, LoadTitles, MarkResourceFinished, PayLevelBonus, QuestState, ReadReflection, ReadTakeaway, RequestBriefing, StartReading, SyncCampaigns, SyncGame, SyncQuests } from '../application';
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
	// The Shop (M10, ADR-019): Habitica's gold and the user's own rewards, read on open and on Sync.
	const goldAccount = new HabiticaGoldAccount(habitica);
	const rewardCatalog = new HabiticaRewardCatalog(habitica);
	// The purse (M10 S3): every purchase and level bonus, written once Habitica confirms it.
	const purse = new VaultPurseRepository(plugin.app, notePathIn(vaultFolder, purseNotePath), () => clock.today());
	// Esdras's offers (M10 S2): Shop.md, which only Esdras writes; Dromos reads it with the shop.
	const offers = new VaultOfferRepository(plugin.app, notePathIn(vaultFolder, shopNotePath));
	// The titles Esdras grants (ADR-020): Titles.md, which only Esdras writes; Dromos reads it on open and after each sync.
	const titles = new VaultTitleRepository(plugin.app, notePathIn(vaultFolder, titlesNotePath));
	// Per-device marks (the letter last opened, the levels whose bonus this device still owes) in Obsidian's local storage, never in the vault or data.json.
	const deviceStore = new LocalDeviceStore(plugin.app);
	const gameState = new GameState();
	const skills = new VaultSkillRepository(plugin.app, vaultFolder);
	const ledger = new VaultLedgerRepository(plugin.app, vaultFolder, () => clock.today());
	const syncGame = new SyncGame({
		skills,
		ledger,
		characters: repository,
		campaigns: campaignRepository,
		rules,
		source: new HabiticaGameTaskSource(habitica),
		clock,
		state: gameState,
		hasCredentials,
		// The gold of each new level (M10 S3), paid after a sync's notes are written, never twice.
		bonus: new PayLevelBonus({ gold: goldAccount, purse, rules, clock, hasCredentials, store: deviceStore }),
	});

	return {
		home: {
			loadHome: new LoadHome({ repository, briefings: new VaultBriefingRepository(plugin.app, vaultFolder), state }),
			syncQuests: new SyncQuests({ source, clock, state, hasCredentials }),
			syncGame,
			gameSnapshot: () => gameState.snapshot(),
			// The figure on the plaque and the road (M11 S1) and the stage card it opens (stage-card S1): the same notes the game reads, no request.
			loadAvatar: new LoadAvatar({ characters: repository, skills, ledger, campaigns: campaignRepository, books, rules, clock }),
			openCard: createOpenCardModal(plugin.app),
			// The titles (titles S5): read from the vault, no request; choosing one writes only `title` in Character.md.
			loadTitles: new LoadTitles({ titles }),
			chooseTitle: new ChooseTitle({ titles, characters: repository }),
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
			deviceStore,
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
				// With the Web viewer taking external links, a card's link closes the card so the page opens as a tab (M8 S9).
				linksOpenInObsidian: () => linksOpenInObsidian(plugin.app),
				habits: {
					snapshot: () => campaignState.snapshot(),
					sync: syncCampaigns,
					send: async (areaPath, title) => showNotice(linkOutcomeView(await linkAreaHabit.execute(areaPath, title), createTranslator(settings.language)).message),
				},
				openCard: createOpenCardModal(plugin.app),
				openNote,
				clock,
			},
			// The Shop (M10 S1, S4): a purchase is confirmed in a card first, and its outcome is a toast.
			shop: {
				loadShop: new LoadShop({ gold: goldAccount, rewards: rewardCatalog, tags: sendDeps.tags, purse, offers, store: deviceStore, clock, hasCredentials }),
				buyReward: new BuyReward({ rewards: rewardCatalog, gold: goldAccount, purse, clock, hasCredentials }),
				buyOffer: new BuyOffer({ rewards: rewardCatalog, gold: goldAccount, purse, store: deviceStore, clock, hasCredentials }),
				openCard: createOpenCardModal(plugin.app),
				notify: showNotice,
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
