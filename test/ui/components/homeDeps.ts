import type { CampaignSnapshot, GameSnapshot, QuestSnapshot } from '../../../src/application';
import { createTranslator, type Language } from '../../../src/i18n';
import type { CampaignsDeps } from '../../../src/ui/containers/CampaignsPanel';
import type { HomeScreenDeps } from '../../../src/ui/containers/HomeScreen';
import type { LibraryDeps } from '../../../src/ui/containers/LibraryPanel';
import type { ShopDeps } from '../../../src/ui/containers/ShopPanel';
import { InMemoryDeviceStore } from '../../fakes/InMemoryDeviceStore';

export const noop = (): void => undefined;
export const renderNothing = (): (() => void) => noop;
const never = <T>(): Promise<T> => new Promise<T>(noop);

const clock = { today: () => '2026-11-03', now: () => new Date('2026-11-03T14:00:00Z') };

export const IDLE_QUESTS: QuestSnapshot = { quests: null, lastSyncedAt: null, status: { kind: 'idle' } };
export const IDLE_GAME: GameSnapshot = { status: { kind: 'idle' }, lastSyncedAt: null, character: null, skills: null, events: [], invalidSkills: [], unreadable: [], invalidRules: null };
export const IDLE_CAMPAIGNS: CampaignSnapshot = { campaigns: null, areas: null, issues: [], lastSyncedAt: null, status: { kind: 'idle' } };

/**
 * Dependencies for rendering `HomeScreen` on the server: effects never run there, so the
 * screen shows its first render (the character loading) with the snapshots given here.
 */
export function homeDeps(
	options: { readonly language?: Language; readonly quests?: QuestSnapshot; readonly game?: GameSnapshot; readonly campaigns?: CampaignSnapshot; readonly openSettings?: (() => void) | null } = {},
): HomeScreenDeps {
	const language = options.language ?? 'en';
	const quests = options.quests ?? IDLE_QUESTS;
	const game = options.game ?? IDLE_GAME;
	const campaigns: CampaignsDeps = {
		syncCampaigns: { execute: never, reload: never },
		linkTask: { execute: never },
		linkHabit: { execute: never },
		campaignSnapshot: () => options.campaigns ?? IDLE_CAMPAIGNS,
		staleAfterDays: () => 14,
		openNote: noop,
		clock,
	};
	const library: LibraryDeps = {
		loadLibrary: { execute: never },
		readReflection: { execute: never },
		readTakeaway: { execute: never },
		renderMarkdown: renderNothing,
		openCard: () => ({ show: noop, close: noop }),
		openNote: noop,
		habits: { snapshot: () => options.campaigns ?? IDLE_CAMPAIGNS, sync: { execute: never, reload: never }, send: never },
		clock,
	};
	const shop: ShopDeps = {
		loadShop: { execute: never },
		buyReward: { execute: never },
		openCard: () => ({ show: noop, close: noop }),
		notify: noop,
	};
	return {
		loadHome: { execute: never },
		syncQuests: { execute: never },
		syncGame: { execute: never },
		gameSnapshot: () => game,
		dismissGameEvents: noop,
		takeGameAnnouncements: () => [],
		notify: noop,
		renderMarkdown: renderNothing,
		renderIcon: noop,
		requestBriefing: null,
		openSettings: options.openSettings ?? null,
		questSnapshot: () => quests,
		clock,
		deviceStore: new InMemoryDeviceStore(),
		campaigns,
		library,
		shop,
		translator: () => createTranslator(language),
		language: () => language,
		subscribeSettings: () => noop,
		subscribeGame: () => noop,
	};
}
