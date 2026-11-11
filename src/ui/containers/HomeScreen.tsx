import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { BriefingState, CharacterState, GameEvent, GameSnapshot, HomeSnapshot, LoadHome, QuestSnapshot, RequestBriefing, SyncGame, SyncQuests } from '../../application';
import type { Language, Translator } from '../../i18n';
import type { Clock, DeviceStore } from '../../ports';
import type { IconRender } from '../atoms/Icon';
import { LevelRibbon } from '../atoms/LevelRibbon';
import type { MarkdownRender } from '../atoms/MarkdownBlock';
import { SyncButton } from '../atoms/SyncButton';
import { I18nProvider } from '../i18n';
import { OfflineBand } from '../molecules/OfflineBand';
import { PlaqueSkills } from '../molecules/PlaqueSkills';
import type { DromosScreen } from '../molecules/Signpost';
import { StatusBanner } from '../molecules/StatusBanner';
import { BriefingPanel } from '../organisms/BriefingPanel';
import { CharacterPanel, type CharacterPanelState } from '../organisms/CharacterPanel';
import { Chronicle } from '../organisms/Chronicle';
import { ChronicleScreen } from '../organisms/ChronicleScreen';
import { LevelUpPanel } from '../organisms/LevelUpPanel';
import { QuestList } from '../organisms/QuestList';
import { Scene } from '../organisms/Scene';
import { ScreenHeader } from '../organisms/ScreenHeader';
import { SkillsScreen } from '../organisms/SkillsScreen';
import { briefingRequestMessage, briefingView } from '../presenters/briefingView';
import { characterCardView } from '../presenters/characterCardView';
import { chronicleView } from '../presenters/chronicleView';
import { dayPeriod } from '../presenters/dayPeriod';
import { historyView } from '../presenters/historyView';
import { ceremonyView, gameNotices } from '../presenters/levelUpView';
import { plaqueSkillsView } from '../presenters/plaqueSkillsView';
import { questListView, questPanelView, type QuestFilter } from '../presenters/questListView';
import { toggled } from '../presenters/toggled';
import { heldProgress, visitCardView, type VisitDelta } from '../presenters/sinceVisitView';
import { skillsPageView, skillsScreenView } from '../presenters/skillsView';
import { agoText, minutesSince, syncBannerView } from '../presenters/syncBanner';
import { walkerView } from '../presenters/walkerView';
import { openLetter, storedLetterMark } from './briefingLetter';
import { storedOpenCampaigns, toggleCampaign } from './campaignFold';
import { CampaignsPanel, type CampaignsDeps } from './CampaignsPanel';
import { noteSeen, settleVisit, storedLastSeen } from './lastVisit';
import { LibraryPanel, type LibraryDeps } from './LibraryPanel';
import { ReadingDeskPanel } from './ReadingDeskPanel';
import { ShopPanel, type ShopDeps } from './ShopPanel';
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
	/** This device's own small state: the mark of the last letter of Esdras opened here (game-ui S13), and what it last saw of the game (S15). */
	readonly deviceStore: DeviceStore;
	readonly campaigns: CampaignsDeps;
	/** The library screen (M7 S5): the books, the card and its actions. */
	readonly library: LibraryDeps;
	/** The Shop screen (M10 S4): the gold, the rewards and buying them. */
	readonly shop: ShopDeps;
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
 * Since the last visit on this device (game-ui S15): `waiting` until the open sync settles, then
 * what changed, `null` on a first visit or when nothing did. It stays so until the next open.
 */
type Visit = { readonly kind: 'waiting' } | { readonly kind: 'settled'; readonly delta: VisitDelta | null };

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

/** Numbers the open views, so each one's letter has its own ids in the window (aria-controls). */
let viewCount = 0;

/**
 * The only UI component that calls `application/` (S8). On mount and on
 * "Sincronizar" it reads the character (LoadHome, no network), renders it with
 * the session's quests, then runs one SyncQuests: it renders the `syncing`
 * snapshot first and the outcome when the sync settles. The game sync runs next to it and,
 * when it finishes, the character is read again because the sync rewrites its note. Each run
 * also bumps `syncKey`, which makes the campaigns panel sync too. No polling (S7).
 *
 * It holds the screens of the view (game-ui S1): home, campaigns, skills, the library (M7 S5), the
 * Chronicle (M9 S3) and the Shop (M10 S4), under one scene with a signpost and the character's plaque (home-header S2), which
 * shows on every screen with the skills nearest to unlocking (S3). Changing screen, campaign tab
 * or skill spends no
 * request: they are only state here, and the campaigns panel stays mounted in its slot on every
 * screen. The library reads the vault each time its screen opens; the habits beside its desk follow
 * the campaigns' sync through `syncKey`.
 * A character level in the game events runs the level-up ceremony (game-ui S4): its timing lives
 * here, and the plaque, the ribbon and the panel are drawn from the step it is at.
 *
 * Since the last visit (game-ui S15): the record this device kept is read once on open. While the
 * open sync runs, the bar and the walker wait where that record left them; once it settles and
 * the character is read again, they move to the new values and a line under the bar says what
 * changed, which a live region announces once. The new record is written then, and after every
 * later sync while the view stays open.
 *
 * The world reacts (game-ui S17): the scene's sky follows the hour of the clock, read on every
 * render, so the periodic re-render turns it with no timer of its own, and a campfire burns once
 * every daily is done. On home, the chronicle lists the last deeds of the ledger (S18); its "View
 * history" opens the Chronicle screen (M9 S3) on the current week, which "← Path" leaves for home.
 *
 * Home (home-header S1) holds Esdras's letter and today's quests in its first column, the
 * campaigns, the small reading desk (the books being read, the library's cards) and the chronicle
 * in its second; narrow panes stack them in that order, under the level-up panel when there is one.
 */
export function HomeScreen({ deps, initialScreen = 'home' }: { readonly deps: HomeScreenDeps; readonly initialScreen?: DromosScreen }) {
	const [character, setCharacter] = useState<CharacterShown>({ kind: 'loading' });
	// `null` until the first read: saying Esdras has not written would be a guess.
	const [briefing, setBriefing] = useState<BriefingState | null>(null);
	const [quests, setQuests] = useState<QuestSnapshot>(deps.questSnapshot);
	const [game, setGame] = useState<GameSnapshot>(deps.gameSnapshot);
	const [syncKey, setSyncKey] = useState(0);
	const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
	// The week the Chronicle screen shows; `null` is the current one, which every opening shows first (M9 S2).
	const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
	const [place, setPlace] = useState<Place>({ screen: initialScreen, campaign: null });
	// The letter folds on every open of the view and stays as it was while the screen changes (S13).
	const [letterOpen, setLetterOpen] = useState(false);
	// Today's quests fold to 4 rows on every open of the view (missions S3, home-fit S3).
	const [questsExpanded, setQuestsExpanded] = useState(false);
	// The chronicle folds to its three newest deeds on every open of the view (home-fit S2).
	const [chronicleExpanded, setChronicleExpanded] = useState(false);
	const [openMissions, setOpenMissions] = useState<ReadonlySet<string>>(() => new Set());
	const [questFilter, setQuestFilter] = useState<QuestFilter>('all');
	const [readMark, setReadMark] = useState<unknown>(() => storedLetterMark(deps.deviceStore));
	// The campaign cards of home fold to one row; the ones left open are remembered on this device (home-fit S1).
	const [openCampaigns, setOpenCampaigns] = useState<ReadonlySet<string>>(() => storedOpenCampaigns(deps.deviceStore));
	const [letterId] = useState(() => `dromos-letter-${(viewCount += 1)}`);
	const [chronicleId] = useState(() => `dromos-chronicle-${(viewCount += 1)}`);
	const [lastSeen] = useState(() => storedLastSeen(deps.deviceStore));
	const [visit, setVisit] = useState<Visit>({ kind: 'waiting' });
	const visitSettled = useRef(false);
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
	const openHistory = useCallback((): void => {
		setSelectedWeek(null);
		go('chronicle');
	}, [go]);
	const goHome = useCallback((): void => go('home'), [go]);
	const selectCampaign = useCallback((path: string): void => setPlace((current) => ({ ...current, campaign: path })), []);
	const toggleCampaignCard = (path: string): void => setOpenCampaigns(toggleCampaign(deps.deviceStore, openCampaigns, path));
	// Closing the panel takes its button away: the focus goes back to the character's name, on the plaque.
	const dismissEvents = useCallback((): void => {
		deps.dismissGameEvents();
		setGame(deps.gameSnapshot());
		frame.current?.querySelector<HTMLElement>('[data-screen-heading]')?.focus({ preventScroll: true });
	}, [deps]);
	// A medallion of the plaque opens the Skills screen on its skill (S3), as the home row did.
	const openSkill = useCallback(
		(skillId: string): void => {
			setSelectedSkill(skillId);
			go('skills');
		},
		[go],
	);
	const { requestBriefing } = deps;
	const onRequestBriefing = requestBriefing
		? (): void => {
				void requestBriefing.execute().then((request) => deps.notify(briefingRequestMessage(request, deps.translator())));
			}
		: null;
	// Opening the letter marks it read on this device, which takes the wax seal off.
	const toggleLetter = (): void => {
		if (!letterOpen) {
			const mark = openLetter(briefing, deps.deviceStore);
			if (mark) setReadMark(mark);
		}
		setLetterOpen(!letterOpen);
	};
	// The fold button at the letter's end: the focus goes back to the top toggle and the panel's head
	// comes into view, as the letter rolls up under it.
	const foldLetter = (): void => {
		setLetterOpen(false);
		const toggle = main.current?.querySelector<HTMLElement>(`#${letterId}-toggle`);
		toggle?.focus({ preventScroll: true });
		toggle?.closest('.dromos-briefing')?.querySelector('.dromos-briefing-head')?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
	};
	const announce = useCallback((): void => {
		gameNotices(deps.takeGameAnnouncements(), deps.translator()).forEach((message) => deps.notify(message));
	}, [deps]);

	// A read after a sync that fails keeps what is on screen: that note was readable a moment ago.
	const showLaterRead = useCallback((home: HomeSnapshot): void => {
		if (home.character.kind !== 'unreadable') setCharacter(home.character);
		if (home.briefing.kind !== 'unreadable') setBriefing(home.briefing);
	}, []);

	// The first settled sync of this open tells what changed since the record; every one keeps the new record.
	const seeVisit = useCallback((): void => {
		const snapshot = deps.gameSnapshot();
		if (visitSettled.current) {
			noteSeen(deps.deviceStore, snapshot, deps.clock);
			return;
		}
		visitSettled.current = true;
		setVisit({ kind: 'settled', delta: settleVisit(deps.deviceStore, lastSeen, snapshot, deps.clock) });
	}, [deps, lastSeen]);

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
		try {
			const updated = await deps.loadHome.execute();
			if (mounted.current) showLaterRead(updated);
		} finally {
			// After the character is read again, so the bar and the walker set off once, to the new values.
			if (mounted.current) seeVisit();
		}
	}, [deps, announce, showLaterRead, seeVisit]);

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
				if (visitSettled.current) noteSeen(deps.deviceStore, deps.gameSnapshot(), deps.clock);
				void deps.loadHome.execute().then((updated) => {
					if (mounted.current) showLaterRead(updated);
				});
			}),
		[deps, announce, showLaterRead],
	);

	const home = screen === 'home';
	const offline = quests.status.kind === 'offline';
	const questPanel = questPanelView(questListView(quests.quests, deps.clock.today(), t, game.questPrices), t, { expanded: questsExpanded, openMissions, filter: questFilter });
	const chronicle = home ? chronicleView(game.deeds, deps.clock.today(), t, { expanded: chronicleExpanded }) : null;
	const banner = syncBannerView(quests, deps.clock.now(), t);
	const language = deps.language();
	// A character level opens the panel once the ribbon unfurls; skill events alone open it at once.
	const showCeremony = home && ceremony !== null && (ceremony.level === null || phase === 'final');
	const characterCeremony = ceremony?.level != null ? { level: ceremony.level, phase } : null;
	const standing = character.kind === 'found' ? character.character : null;
	const motion = canAnimate();
	// While the open sync runs the bar and the walker wait at the record's place, if they may move later.
	const held = visit.kind === 'waiting' && motion && standing ? heldProgress(lastSeen, standing) : null;
	const cardVisit = visitCardView({ delta: visit.kind === 'settled' ? visit.delta : null, held, ceremony: characterCeremony?.phase ?? null, motion }, t);
	const walker = walkerView(standing, characterCeremony === null ? (held?.fraction ?? null) : null, characterCeremony);
	const plaqueSkills = plaqueSkillsView(skills, t);
	return (
		<I18nProvider t={t}>
			{/* `lang` on the frame covers the signpost; the one on <main> stays for the content. */}
			<div className="dromos-frame" lang={language} ref={frame}>
				{offline ? <OfflineBand text={offlineBandText(quests, deps.clock.now(), t)} /> : null}
				{/* The scene and, after it, the character's plaque (S2): the stylesheet sets the plaque in the scene's
				    corner on wide panes and under it on narrow ones. Keyboard order: the signpost, the plaque, the screen. */}
				<div className="dromos-header">
					<Scene
						screen={screen}
						offline={offline}
						onGo={go}
						onSettings={deps.openSettings}
						ribbon={showCeremony && ceremony.ribbon ? <LevelRibbon kicker={ceremony.ribbon.kicker} title={ceremony.ribbon.title} /> : null}
						walker={walker.fraction}
						gateLabel={walker.gateLevel === null ? null : t('character.level', { level: walker.gateLevel })}
						period={dayPeriod(deps.clock.now())}
						campfire={questPanel.dayComplete}
					/>
					<CharacterPanel
						state={panelState(character, t)}
						ceremony={characterCeremony?.phase ?? null}
						visit={cardVisit}
						heading={home}
						skills={plaqueSkills ? <PlaqueSkills view={plaqueSkills} onOpen={openSkill} renderIcon={deps.renderIcon} /> : null}
						footer={
							<div className="dromos-sync-line">
								{/* While offline the band above the scene says it (S10), so the line shows only Sync (game-ui S14);
								    the banner stays mounted and quiet, so its live region only changes text (S12). */}
								<StatusBanner {...banner} quiet={offline} />
								<SyncButton syncing={quests.status.kind === 'syncing'} onSync={() => void refresh()} />
							</div>
						}
					/>
				</div>
				<main className={`dromos-home is-${screen}`} lang={language} ref={main} tabIndex={-1}>
					{/* Every slot keeps its place on every screen, so React keeps the campaigns panel mounted: the two
					    columns of home (S1) are drawn on every screen, the campaigns panel always first in the second.
					    Off home and on narrow panes the stylesheet lets their content flow as the screen's own. */}
					{screen === 'skills' ? <ScreenHeader title={t('screen.skills')} /> : null}
					{showCeremony ? <LevelUpPanel view={ceremony} onDismiss={dismissEvents} renderIcon={deps.renderIcon} /> : null}
					<div className="dromos-home-column is-start">
						{home && briefing ? (
							<BriefingPanel
								view={briefingView(briefing, deps.clock.today(), skills.locked, t, readMark)}
								renderMarkdown={deps.renderMarkdown}
								onRequest={onRequestBriefing}
								renderIcon={deps.renderIcon}
								open={letterOpen}
								letterId={letterId}
								onToggle={toggleLetter}
								onFold={foldLetter}
							/>
						) : null}
						{home ? (
							<QuestList view={questPanel} onToggleMore={() => setQuestsExpanded((current) => !current)} onToggleSubtasks={(questId) => setOpenMissions((current) => toggled(current, questId))} onFilter={setQuestFilter} />
						) : null}
					</div>
					<div className="dromos-home-column is-end">
						{/* On the campaigns screen the panel draws the header card too: it alone knows the campaign's name. */}
						<CampaignsPanel
							deps={deps.campaigns}
							syncKey={syncKey}
							hidden={screen === 'skills' || screen === 'library' || screen === 'chronicle' || screen === 'shop'}
							home={home ? { open: openCampaigns, onToggle: toggleCampaignCard, onOpen: (path) => setPlace({ screen: 'campaigns', campaign: path }) } : undefined}
							screen={screen === 'campaigns' ? { selected: place.campaign, onSelect: selectCampaign } : undefined}
						/>
						{home ? <ReadingDeskPanel deps={deps.library} language={language} /> : null}
						{chronicle ? <Chronicle view={chronicle} listId={chronicleId} onToggleMore={() => setChronicleExpanded((current) => !current)} onOpenHistory={openHistory} /> : null}
					</div>
					{screen === 'skills' ? (
						<SkillsScreen page={skills} view={skillsScreenView(skills, selectedSkill, t)} onSelect={setSelectedSkill} renderIcon={deps.renderIcon} />
					) : null}
					{/* The Chronicle draws its own header card, which leads back to the path (M9 S3). */}
					{screen === 'chronicle' ? <ChronicleScreen view={historyView(game.history, selectedWeek, deps.clock.today(), t)} onSelectWeek={setSelectedWeek} onBack={goHome} /> : null}
					{/* The library draws its own header card: on a shelf it names the shelf and leads back. */}
					{screen === 'library' ? (
						<LibraryPanel deps={deps.library} language={language} period={dayPeriod(deps.clock.now())} syncKey={syncKey} />
					) : null}
					{/* The Shop draws its own header card and its stall, the gold on its plaque (M10 S4, S6); it reads Habitica on open and on Sync. */}
					{screen === 'shop' ? <ShopPanel deps={deps.shop} language={language} syncKey={syncKey} period={dayPeriod(deps.clock.now())} /> : null}
				</main>
				{/* Outside the screens, so it is never mounted again: it announces the line of the visit once. */}
				<p className="dromos-visually-hidden dromos-since-news" role="status">
					{cardVisit.line ?? ''}
				</p>
			</div>
		</I18nProvider>
	);
}

function panelState(character: CharacterShown, t: Translator): CharacterPanelState {
	return character.kind === 'found' ? { kind: 'found', view: characterCardView(character.character, t) } : character;
}

/** "Last known state · 2 h ago", with the time of the last quests fetched this session when there is one. */
function offlineBandText(quests: QuestSnapshot, now: Date, t: Translator): string {
	return quests.lastSyncedAt ? t('offline.band', { ago: agoText(minutesSince(quests.lastSyncedAt, now), t) }) : t('offline.band.never');
}

/**
 * After a change of screen (not on the first paint), scrolls the view back to the top and moves
 * the focus to the new screen's heading, or to `<main>` while that heading is not drawn yet. The
 * frame is searched, not `<main>`: on home the heading is the name on the plaque, outside it, and
 * on the other screens the plaque marks none, so the header card's title is the first.
 */
function useScreenFocus(screen: DromosScreen, frame: RefObject<HTMLElement>, main: RefObject<HTMLElement>): void {
	const shown = useRef(screen);
	useEffect(() => {
		if (shown.current === screen) return;
		shown.current = screen;
		const scroller = frame.current?.closest<HTMLElement>('.dromos-root');
		if (scroller) scroller.scrollTop = 0;
		const heading = frame.current?.querySelector<HTMLElement>('[data-screen-heading]') ?? main.current;
		heading?.focus({ preventScroll: true });
	}, [screen, frame, main]);
}

/** Whether the bar and the walker may move: not under reduced motion, nor where nothing runs (server rendering). */
function canAnimate(): boolean {
	return typeof window !== 'undefined' && !prefersReducedMotion();
}

function prefersReducedMotion(): boolean {
	return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
