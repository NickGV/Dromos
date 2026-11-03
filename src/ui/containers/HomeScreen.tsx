import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { BriefingState, CharacterState, GameEvent, GameSnapshot, HomeSnapshot, LoadHome, QuestSnapshot, RequestBriefing, SyncGame, SyncQuests } from '../../application';
import type { Language, Translator } from '../../i18n';
import type { Clock } from '../../ports';
import type { IconRender } from '../atoms/Icon';
import { LevelRibbon } from '../atoms/LevelRibbon';
import type { MarkdownRender } from '../atoms/MarkdownBlock';
import { SyncButton } from '../atoms/SyncButton';
import { I18nProvider } from '../i18n';
import { OfflineBand } from '../molecules/OfflineBand';
import type { DromosScreen } from '../molecules/Signpost';
import { StatusBanner } from '../molecules/StatusBanner';
import { BriefingPanel } from '../organisms/BriefingPanel';
import { CharacterPanel, type CharacterPanelState } from '../organisms/CharacterPanel';
import { LevelUpPanel } from '../organisms/LevelUpPanel';
import { QuestList } from '../organisms/QuestList';
import { Scene } from '../organisms/Scene';
import { ScreenHeader, type ScreenHeaderCharacter } from '../organisms/ScreenHeader';
import { SkillsRow } from '../organisms/SkillsRow';
import { SkillsScreen } from '../organisms/SkillsScreen';
import { briefingRequestMessage, briefingView } from '../presenters/briefingView';
import { characterCardView } from '../presenters/characterCardView';
import { ceremonyView, unlockNotices } from '../presenters/levelUpView';
import { questListView, questPanelView } from '../presenters/questListView';
import { skillRingView, skillsPageView, skillsScreenView } from '../presenters/skillsView';
import { agoText, minutesSince, syncBannerView } from '../presenters/syncBanner';
import { CampaignsPanel, type CampaignsDeps } from './CampaignsPanel';
import { useCeremonyPhase } from './useCeremonyPhase';

/** What the home screen needs from the application layer; built in `src/composition`. */
export interface HomeScreenDeps {
	readonly loadHome: Pick<LoadHome, 'execute'>;
	readonly syncQuests: Pick<SyncQuests, 'execute'>;
	/** The game sync: ledger, unlocks and the derived fields of the notes. Never rejects. */
	readonly syncGame: Pick<SyncGame, 'execute'>;
	/** The session's game state right now; reads `syncing` as soon as `syncGame.execute()` returns. */
	readonly gameSnapshot: () => GameSnapshot;
	/** The level-up ceremony was closed. */
	readonly dismissGameEvents: () => void;
	/** The game events not toasted yet; each one comes out once. */
	readonly takeGameAnnouncements: () => readonly GameEvent[];
	/** Shows a brief toast. */
	readonly notify: (message: string) => void;
	/** Renders the text of the briefing as a note. */
	readonly renderMarkdown: MarkdownRender;
	/** Draws a line icon of the host app. */
	readonly renderIcon: IconRender;
	/** Copies the command of the job; `null` where it cannot be run, and the button does not show. */
	readonly requestBriefing: Pick<RequestBriefing, 'execute'> | null;
	/** Opens the plugin's own settings tab; `null` where it cannot be opened, and the signpost has no settings plank. */
	readonly openSettings: (() => void) | null;
	/** The session's quests right now; reads `syncing` as soon as `syncQuests.execute()` returns. */
	readonly questSnapshot: () => QuestSnapshot;
	readonly clock: Clock;
	readonly campaigns: CampaignsDeps;
	/** The translator for the language chosen in the settings; read on every render. */
	readonly translator: () => Translator;
	/** The interface language, for the `lang` of the screen; read on every render. */
	readonly language: () => Language;
	/** Calls `onChange` whenever the settings change, so the open view re-renders (a language switch applies at once). Returns the unsubscribe function. */
	readonly subscribeSettings: (onChange: () => void) => () => void;
	/** Calls `onChange` when something other than this screen changed the game (the rebuild command). Returns the unsubscribe function. */
	readonly subscribeGame: (onChange: () => void) => () => void;
}

type CharacterShown = CharacterState | { readonly kind: 'loading' };

/**
 * Where the view is: the screen on show, and the campaign the campaigns screen shows, which a
 * home card or a tab chose (game-ui S7, S8); `null` shows the first one.
 */
interface Place {
	readonly screen: DromosScreen;
	readonly campaign: string | null;
}

/** Re-render period that keeps "Sincronizado hace N min" current. Local only: it sends no request. */
const CLOCK_TICK_MS = 30_000;

/**
 * The only UI component that calls `application/` (S8). On mount and on
 * "Sincronizar" it reads the character (LoadHome, no network), renders it with
 * the session's quests, then runs one SyncQuests: it renders the `syncing`
 * snapshot first and the outcome when the sync settles. The game sync runs next to it and,
 * when it finishes, the character is read again because the sync rewrites its note. Each run
 * also bumps `syncKey`, which makes the campaigns panel sync too. No polling (S7).
 *
 * It holds the three screens of the view (game-ui S1): home, campaigns and skills, under one
 * scene with a signpost. Changing screen, campaign tab or skill spends no request: they are only
 * state here, and the campaigns panel stays mounted in its slot on every screen.
 * A character level in the game events runs the level-up ceremony (game-ui S4): its timing lives
 * here, and the card, the ribbon and the panel are drawn from the step it is at.
 */
export function HomeScreen({ deps, initialScreen = 'home' }: { readonly deps: HomeScreenDeps; readonly initialScreen?: DromosScreen }) {
	const [character, setCharacter] = useState<CharacterShown>({ kind: 'loading' });
	// `null` until the first read: saying Esdras has not written would be a guess.
	const [briefing, setBriefing] = useState<BriefingState | null>(null);
	const [quests, setQuests] = useState<QuestSnapshot>(deps.questSnapshot);
	const [game, setGame] = useState<GameSnapshot>(deps.gameSnapshot);
	const [syncKey, setSyncKey] = useState(0);
	const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
	const [place, setPlace] = useState<Place>({ screen: initialScreen, campaign: null });
	const { screen } = place;
	const mounted = useRef(false);
	const frame = useRef<HTMLDivElement>(null);
	const main = useRef<HTMLElement>(null);
	useScreenFocus(screen, frame, main);
	useClockTick();
	useSettingsChange(deps.subscribeSettings);
	const t = deps.translator();
	const skills = skillsPageView(game, t);
	const ceremony = ceremonyView(game.events, [...skills.earned, ...skills.locked], t);
	const phase = useCeremonyPhase(ceremony?.level ?? null);
	const go = useCallback((next: DromosScreen): void => setPlace((current) => ({ ...current, screen: next })), []);
	const selectCampaign = useCallback((path: string): void => setPlace((current) => ({ ...current, campaign: path })), []);
	// Closing the panel takes its button away: the focus goes back to the character's name.
	const dismissEvents = useCallback((): void => {
		deps.dismissGameEvents();
		setGame(deps.gameSnapshot());
		main.current?.querySelector<HTMLElement>('[data-screen-heading]')?.focus({ preventScroll: true });
	}, [deps]);
	const { requestBriefing } = deps;
	const onRequestBriefing = requestBriefing
		? (): void => {
				void requestBriefing.execute().then((request) => deps.notify(briefingRequestMessage(request, deps.translator())));
			}
		: null;
	const announce = useCallback((): void => {
		unlockNotices(deps.takeGameAnnouncements(), deps.translator()).forEach((message) => deps.notify(message));
	}, [deps]);

	// A read after a sync that fails keeps what is on screen: that note was readable a moment ago.
	const showLaterRead = useCallback((home: HomeSnapshot): void => {
		if (home.character.kind !== 'unreadable') setCharacter(home.character);
		if (home.briefing.kind !== 'unreadable') setBriefing(home.briefing);
	}, []);

	const refresh = useCallback(async (): Promise<void> => {
		const home = await deps.loadHome.execute();
		if (!mounted.current) return;
		setCharacter(home.character);
		setBriefing(home.briefing);
		// Starting the sync first means this render already shows `syncing` next to the session's last quests.
		setSyncKey((key) => key + 1);
		const pending = deps.syncQuests.execute();
		const gamePending = deps.syncGame.execute();
		setQuests(deps.questSnapshot());
		setGame(deps.gameSnapshot());
		const synced = await pending;
		if (mounted.current) setQuests(synced);
		await gamePending;
		// The state as it is now: a rebuild or a closed banner may have changed it since the sync ended.
		if (mounted.current) {
			setGame(deps.gameSnapshot());
			announce();
		}
		const updated = await deps.loadHome.execute();
		if (mounted.current) showLaterRead(updated);
	}, [deps, announce, showLaterRead]);

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
				void deps.loadHome.execute().then((updated) => {
					if (mounted.current) showLaterRead(updated);
				});
			}),
		[deps, announce, showLaterRead],
	);

	const home = screen === 'home';
	const offline = quests.status.kind === 'offline';
	const banner = syncBannerView(quests, deps.clock.now(), t);
	const language = deps.language();
	// A character level opens the panel once the ribbon unfurls; skill events alone open it at once.
	const showCeremony = home && ceremony !== null && (ceremony.level === null || phase === 'final');
	return (
		<I18nProvider t={t}>
			{/* `lang` on the frame covers the signpost; the one on <main> stays for the content. */}
			<div className="dromos-frame" lang={language} ref={frame}>
				{offline ? <OfflineBand text={offlineBandText(quests, deps.clock.now(), t)} /> : null}
				<Scene
					screen={screen}
					offline={offline}
					onGo={go}
					onSettings={deps.openSettings}
					ribbon={showCeremony && ceremony.ribbon ? <LevelRibbon kicker={ceremony.ribbon.kicker} title={ceremony.ribbon.title} /> : null}
				/>
				<main className={`dromos-home is-${screen}`} lang={language} ref={main} tabIndex={-1}>
					{/* Every slot keeps its place on every screen, so React keeps the campaigns panel mounted. */}
					{home ? (
						<CharacterPanel
							state={panelState(character, t)}
							ceremony={ceremony?.level != null ? phase : null}
							footer={
								<div className="dromos-sync-line">
									{/* While offline the band above the scene says it (S10), so the line stays quiet. */}
									<StatusBanner {...banner} prominent={banner.prominent && !offline} />
									<SyncButton syncing={quests.status.kind === 'syncing'} onSync={() => void refresh()} />
								</div>
							}
						/>
					) : screen === 'skills' ? (
						<ScreenHeader title={t('screen.skills')} character={headerCharacter(character, t)} />
					) : null}
					{showCeremony ? <LevelUpPanel view={ceremony} onDismiss={dismissEvents} renderIcon={deps.renderIcon} /> : null}
					{home && briefing ? (
						<BriefingPanel view={briefingView(briefing, deps.clock.today(), skills.locked, t)} renderMarkdown={deps.renderMarkdown} onRequest={onRequestBriefing} renderIcon={deps.renderIcon} />
					) : null}
					{home ? <QuestList view={questPanelView(questListView(quests.quests, deps.clock.today(), t, game.questPrices), t)} /> : null}
					{/* On the campaigns screen the panel draws the header card too: it alone knows the campaign's name. */}
					<CampaignsPanel
						deps={deps.campaigns}
						syncKey={syncKey}
						hidden={screen === 'skills'}
						onOpenCampaign={home ? (path) => setPlace({ screen: 'campaigns', campaign: path }) : undefined}
						screen={screen === 'campaigns' ? { selected: place.campaign, onSelect: selectCampaign, character: headerCharacter(character, t) } : undefined}
					/>
					{home ? (
						<SkillsRow
							page={skills}
							rings={[...skills.earned, ...skills.locked].map((card) => skillRingView(card, t))}
							onOpen={(skillId) => {
								setSelectedSkill(skillId);
								go('skills');
							}}
							renderIcon={deps.renderIcon}
						/>
					) : null}
					{screen === 'skills' ? (
						<SkillsScreen page={skills} view={skillsScreenView(skills, selectedSkill, deps.clock.today(), t)} onSelect={setSelectedSkill} renderIcon={deps.renderIcon} />
					) : null}
				</main>
			</div>
		</I18nProvider>
	);
}

function panelState(character: CharacterShown, t: Translator): CharacterPanelState {
	return character.kind === 'found' ? { kind: 'found', view: characterCardView(character.character, t) } : character;
}

/** The character as the header card of the other screens names it, or `null` while there is none. */
function headerCharacter(character: CharacterShown, t: Translator): ScreenHeaderCharacter | null {
	if (character.kind !== 'found') return null;
	const view = characterCardView(character.character, t);
	return { name: view.name, title: view.title, level: character.character.level, xpText: view.xp.text };
}

/** "Last known state · 2 h ago", with the time of the last quests fetched this session when there is one. */
function offlineBandText(quests: QuestSnapshot, now: Date, t: Translator): string {
	return quests.lastSyncedAt ? t('offline.band', { ago: agoText(minutesSince(quests.lastSyncedAt, now), t) }) : t('offline.band.never');
}

/**
 * After a change of screen (not on the first paint), scrolls the view back to the top and moves
 * the focus to the new screen's heading, or to `<main>` while that heading is not drawn yet.
 */
function useScreenFocus(screen: DromosScreen, frame: RefObject<HTMLElement>, main: RefObject<HTMLElement>): void {
	const shown = useRef(screen);
	useEffect(() => {
		if (shown.current === screen) return;
		shown.current = screen;
		const scroller = frame.current?.closest<HTMLElement>('.dromos-root');
		if (scroller) scroller.scrollTop = 0;
		const heading = main.current?.querySelector<HTMLElement>('[data-screen-heading]') ?? main.current;
		heading?.focus({ preventScroll: true });
	}, [screen, frame, main]);
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
