import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameEvent, GameSnapshot, HomeSnapshot, LoadHome, QuestSnapshot, SyncGame, SyncQuests } from '../../application';
import type { Translator } from '../../i18n';
import type { Clock } from '../../ports';
import { SyncButton } from '../atoms/SyncButton';
import { I18nProvider } from '../i18n';
import { LevelUpBanner } from '../molecules/LevelUpBanner';
import { StatusBanner } from '../molecules/StatusBanner';
import { CharacterPanel, type CharacterPanelState } from '../organisms/CharacterPanel';
import { QuestList } from '../organisms/QuestList';
import { SkillsPanel } from '../organisms/SkillsPanel';
import { characterCardView } from '../presenters/characterCardView';
import { levelUpBannerView, unlockNotices } from '../presenters/levelUpView';
import { questListView } from '../presenters/questListView';
import { skillsPageView } from '../presenters/skillsView';
import { syncBannerView } from '../presenters/syncBanner';
import { CampaignsPanel, type CampaignsDeps } from './CampaignsPanel';

/** What the home screen needs from the application layer; built in `src/composition`. */
export interface HomeScreenDeps {
	readonly loadHome: Pick<LoadHome, 'execute'>;
	readonly syncQuests: Pick<SyncQuests, 'execute'>;
	/** The game sync: ledger, unlocks and the derived fields of the notes. Never rejects. */
	readonly syncGame: Pick<SyncGame, 'execute'>;
	/** The session's game state right now; reads `syncing` as soon as `syncGame.execute()` returns. */
	readonly gameSnapshot: () => GameSnapshot;
	/** The level-up banner was closed. */
	readonly dismissGameEvents: () => void;
	/** The game events not toasted yet; each one comes out once. */
	readonly takeGameAnnouncements: () => readonly GameEvent[];
	/** Shows a brief toast. */
	readonly notify: (message: string) => void;
	/** The session's quests right now; reads `syncing` as soon as `syncQuests.execute()` returns. */
	readonly questSnapshot: () => QuestSnapshot;
	readonly clock: Clock;
	readonly campaigns: CampaignsDeps;
	/** The translator for the language chosen in the settings; read on every render. */
	readonly translator: () => Translator;
	/** Calls `onChange` whenever the settings change, so the open view re-renders (a language switch applies at once). Returns the unsubscribe function. */
	readonly subscribeSettings: (onChange: () => void) => () => void;
	/** Calls `onChange` when something other than this screen changed the game (the rebuild command). Returns the unsubscribe function. */
	readonly subscribeGame: (onChange: () => void) => () => void;
}

type CharacterState = HomeSnapshot['character'] | { readonly kind: 'loading' } | { readonly kind: 'unreadable' };

/** Re-render period that keeps "Sincronizado hace N min" current. Local only: it sends no request. */
const CLOCK_TICK_MS = 30_000;

/**
 * The only UI component that calls `application/` (S8). On mount and on
 * "Sincronizar" it reads the character (LoadHome, no network), renders it with
 * the session's quests, then runs one SyncQuests: it renders the `syncing`
 * snapshot first and the outcome when the sync settles. The game sync runs next to it and,
 * when it finishes, the character is read again because the sync rewrites its note. Each run
 * also bumps `syncKey`, which makes the campaigns panel sync too. No polling (S7).
 */
export function HomeScreen({ deps }: { readonly deps: HomeScreenDeps }) {
	const [character, setCharacter] = useState<CharacterState>({ kind: 'loading' });
	const [quests, setQuests] = useState<QuestSnapshot>(deps.questSnapshot);
	const [game, setGame] = useState<GameSnapshot>(deps.gameSnapshot);
	const [syncKey, setSyncKey] = useState(0);
	const mounted = useRef(false);
	useClockTick();
	useSettingsChange(deps.subscribeSettings);
	const t = deps.translator();
	const dismissEvents = useCallback((): void => {
		deps.dismissGameEvents();
		setGame(deps.gameSnapshot());
	}, [deps]);
	const levelUp = levelUpBannerView(game.events, t);
	const announce = useCallback((): void => {
		unlockNotices(deps.takeGameAnnouncements(), deps.translator()).forEach((message) => deps.notify(message));
	}, [deps]);

	const refresh = useCallback(async (): Promise<void> => {
		const home = await loadHomeOrNull(deps.loadHome);
		if (!mounted.current) return;
		setCharacter(home ? home.character : { kind: 'unreadable' });
		// Starting the sync first means this render already shows `syncing` next to the session's last quests.
		setSyncKey((key) => key + 1);
		const pending = deps.syncQuests.execute();
		const gamePending = deps.syncGame.execute();
		setQuests(deps.questSnapshot());
		setGame(deps.gameSnapshot());
		const synced = await pending;
		if (mounted.current) setQuests(synced);
		const played = await gamePending;
		if (mounted.current) {
			setGame(played);
			announce();
		}
		const updated = await loadHomeOrNull(deps.loadHome);
		if (mounted.current && updated) setCharacter(updated.character);
	}, [deps, announce]);

	useEffect(() => {
		mounted.current = true;
		void refresh();
		return () => {
			mounted.current = false;
		};
	}, [refresh]);

	useEffect(
		() =>
			deps.subscribeGame(() => {
				setGame(deps.gameSnapshot());
				announce();
				void loadHomeOrNull(deps.loadHome).then((updated) => {
					if (mounted.current && updated) setCharacter(updated.character);
				});
			}),
		[deps, announce],
	);

	return (
		<I18nProvider t={t}>
		<main className="dromos-home">
			<div className="dromos-toolbar">
				<StatusBanner {...syncBannerView(quests, deps.clock.now(), t)} />
				<SyncButton syncing={quests.status.kind === 'syncing'} onSync={() => void refresh()} />
			</div>
			{levelUp ? <LevelUpBanner view={levelUp} onDismiss={dismissEvents} /> : null}
			<CharacterPanel state={panelState(character, t)} />
			<QuestList view={questListView(quests.quests, deps.clock.today(), t)} />
			<CampaignsPanel deps={deps.campaigns} syncKey={syncKey} />
			<SkillsPanel view={skillsPageView(game, t)} />
		</main>
		</I18nProvider>
	);
}

// A failed vault read must not stop the quests from syncing.
async function loadHomeOrNull(loadHome: HomeScreenDeps['loadHome']): Promise<HomeSnapshot | null> {
	try {
		return await loadHome.execute();
	} catch {
		return null;
	}
}

function panelState(character: CharacterState, t: Translator): CharacterPanelState {
	return character.kind === 'found' ? { kind: 'found', view: characterCardView(character.character, t) } : character;
}

function useClockTick(): void {
	const [, setTick] = useState(0);
	useEffect(() => {
		const id = window.setInterval(() => setTick((tick) => tick + 1), CLOCK_TICK_MS);
		return () => window.clearInterval(id);
	}, []);
}

function useSettingsChange(subscribe: HomeScreenDeps['subscribeSettings']): void {
	const [, setVersion] = useState(0);
	useEffect(() => subscribe(() => setVersion((version) => version + 1)), [subscribe]);
}
