import { useCallback, useEffect, useRef, useState } from 'react';
import type { CampaignSnapshot, LinkExistingTask, LinkHabitToCampaign, LinkTaskToCampaign, OpenTodo, SyncCampaigns } from '../../application';
import type { Clock } from '../../ports';
import { useT } from '../i18n';
import { CampaignBoard } from '../organisms/CampaignBoard';
import { CampaignScreen, type Sending } from '../organisms/CampaignScreen';
import { ScreenHeader } from '../organisms/ScreenHeader';
import { campaignHomeCardView } from '../presenters/campaignHomeView';
import { campaignScreenView, groupToggleKey, taskToggleKey } from '../presenters/campaignScreenView';
import { toggled } from '../presenters/toggled';
import { campaignListView } from '../presenters/campaignView';
import { linkExistingOutcomeView, noChoicesView } from '../presenters/linkExistingView';
import { linkOutcomeView, type LinkOutcomeView } from '../presenters/linkOutcomeView';

/** What the campaigns panel needs from the application layer; built in `src/composition`. */
/**
 * Shows `todos` and resolves with the one picked, or `null` when closed without a choice
 * (link-existing-todo S3). Built in `src/composition` on Obsidian's search list.
 */
export type TodoPicker = (todos: readonly OpenTodo[], labels: { readonly placeholder: string; readonly empty: string }) => Promise<OpenTodo | null>;

export interface CampaignsDeps {
	/** `openTodos` tells whether the last sync listed the open to-dos a task can be linked to. */
	readonly syncCampaigns: Pick<SyncCampaigns, 'execute' | 'reload' | 'openTodos'>;
	/** `execute` sends a task for the first time; `resend` sends again one Habitica confirmed deleted (ADR-021). */
	readonly linkTask: Pick<LinkTaskToCampaign, 'execute' | 'resend'>;
	/** The same for a daily. */
	readonly linkHabit: Pick<LinkHabitToCampaign, 'execute' | 'resend'>;
	/** "Vincular existente": the to-dos a task can take, and the link itself, with no Habitica request (issue #11). */
	readonly linkExisting: Pick<LinkExistingTask, 'choices' | 'execute'>;
	readonly pickTodo: TodoPicker;
	/** The session's campaigns right now; reads `syncing` as soon as `syncCampaigns.execute()` returns. */
	readonly campaignSnapshot: () => CampaignSnapshot;
	/** The `staleAfterDays` setting, read on every render so a change applies at once. */
	readonly staleAfterDays: () => number;
	/** Opens a note in another tab. */
	readonly openNote: (path: string) => void;
	readonly clock: Clock;
}

export interface CampaignsPanelProps {
	readonly deps: CampaignsDeps;
	readonly syncKey: number;
	/**
	 * Draws nothing while true, but stays mounted: a screen without campaigns keeps the panel's
	 * state, and showing it again spends no Habitica request (game-ui S1).
	 */
	readonly hidden?: boolean;
	/**
	 * Given on the home screen: the panel draws the compact cards (game-ui S7), folded but for the
	 * open ones (home-fit S1), each opening the campaigns screen on its campaign.
	 */
	readonly home?: CampaignsHomeProps;
	/**
	 * Given on the campaigns screen (game-ui S8): the panel draws the header card, named after the
	 * campaign shown, then its tabs, tasks, habits and send buttons. Choosing a tab only asks the
	 * screen to change `selected`: it spends no request.
	 */
	readonly screen?: CampaignsScreenProps;
}

export interface CampaignsHomeProps {
	/** The paths of the campaigns whose cards are open; the home screen keeps them on the device. */
	readonly open: ReadonlySet<string>;
	/** Opens or folds the card of the campaign at `path`. */
	readonly onToggle: (path: string) => void;
	/** Opens the campaigns screen on the campaign at `path`. */
	readonly onOpen: (path: string) => void;
}

export interface CampaignsScreenProps {
	/** The campaign to show, or `null` for the first one. */
	readonly selected: string | null;
	readonly onSelect: (path: string) => void;
}

/** Numbers the open views, so each one's campaign cards have their own ids in the window (aria-controls). */
let campaignsCount = 0;

/**
 * Container of the campaigns (S5, S6): syncs when it mounts and whenever `syncKey` changes
 * (the home's "Sincronizar"), and sends a task to Habitica on request, or again once Habitica
 * confirmed it deleted (ADR-021), or links it to an open to-do picked from the sync's list
 * (link-existing-todo S3). It never polls (S4).
 */
export function CampaignsPanel({ deps, syncKey, hidden = false, home, screen }: CampaignsPanelProps) {
	const [snapshot, setSnapshot] = useState<CampaignSnapshot>(deps.campaignSnapshot);
	const [sending, setSending] = useState<Sending | null>(null);
	const [message, setMessage] = useState<(LinkOutcomeView & { readonly path: string }) | null>(null);
	// The phase panels the reader expanded, by `groupToggleKey` (missions S3).
	const [expandedGroups, setExpandedGroups] = useState<ReadonlySet<string>>(() => new Set());
	// The missions whose subtasks the reader opened, by `taskToggleKey` (missions S5).
	const [openMissions, setOpenMissions] = useState<ReadonlySet<string>>(() => new Set());
	const [idPrefix] = useState(() => `dromos-campaigns-${(campaignsCount += 1)}`);
	const mounted = useRef(false);
	const t = useT();

	const sync = useCallback(async (): Promise<void> => {
		const pending = deps.syncCampaigns.execute();
		setSnapshot(deps.campaignSnapshot());
		const synced = await pending;
		if (mounted.current) setSnapshot(synced);
	}, [deps]);

	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);

	// `syncKey` 0 is before the home screen started its first run, which bumps it: waiting for
	// that bump avoids a second sync (and its requests) right when the view opens.
	useEffect(() => {
		if (syncKey > 0) void sync();
	}, [sync, syncKey]);

	const send = useCallback(
		async (path: string, kind: Sending['kind'], title: string, again = false): Promise<void> => {
			setSending({ kind, title });
			setMessage(null);
			const link = kind === 'habit' ? deps.linkHabit : deps.linkTask;
			const outcome = await (again ? link.resend(path, title) : link.execute(path, title));
			if (!mounted.current) return;
			setMessage({ ...linkOutcomeView(outcome, t), path });
			// Keep "Enviando…" until the list is refreshed, so the button never flashes back. Only
			// the note changed, so re-read the vault: it spends no Habitica request.
			const reloaded = await deps.syncCampaigns.reload();
			if (mounted.current) setSnapshot(reloaded);
			if (mounted.current) setSending(null);
		},
		[deps, sync, t],
	);

	const linkFromList = useCallback(
		async (path: string, title: string): Promise<void> => {
			setMessage(null);
			const choices = await deps.linkExisting.choices();
			if (!mounted.current) return;
			if (choices === null || choices.length === 0) {
				setMessage({ ...noChoicesView(choices, t), path });
				return;
			}
			const picked = await deps.pickTodo(choices, { placeholder: t('link.existing.placeholder'), empty: t('link.existing.noMatch') });
			if (picked === null || !mounted.current) return;
			setSending({ kind: 'link', title });
			const outcome = await deps.linkExisting.execute(path, title, picked.habiticaId);
			if (!mounted.current) return;
			setMessage({ ...linkExistingOutcomeView(outcome, picked.title, t), path });
			// As after a send: the note changed, so re-read the vault. The sync already holds the
			// picked to-do's state, so the task shows it at once, with no Habitica request.
			const reloaded = await deps.syncCampaigns.reload();
			if (mounted.current) setSnapshot(reloaded);
			if (mounted.current) setSending(null);
		},
		[deps, t],
	);

	if (hidden) return null;
	const view = campaignListView(snapshot, { today: deps.clock.today(), defaultStaleAfterDays: deps.staleAfterDays(), canLink: deps.syncCampaigns.openTodos() !== null, t });
	if (home) {
		const cards = view.cards.map((card) => campaignHomeCardView(card, t));
		return <CampaignBoard list={view} cards={cards} open={home.open} idPrefix={idPrefix} onToggle={home.onToggle} onOpen={home.onOpen} />;
	}
	if (!screen) return null;
	const page = campaignScreenView(view, screen.selected, t, expandedGroups, openMissions);
	const shown = page.campaign?.path ?? null;
	return (
		<>
			<ScreenHeader title={page.title} />
			<CampaignScreen
				view={page}
				sending={sending}
				message={message !== null && message.path === shown ? message : null}
				onSelect={screen.onSelect}
				onOpenNote={deps.openNote}
				onSend={(taskTitle) => {
					if (shown !== null) void send(shown, 'task', taskTitle);
				}}
				onSendHabit={(habitTitle) => {
					if (shown !== null) void send(shown, 'habit', habitTitle);
				}}
				onResend={(taskTitle) => {
					if (shown !== null) void send(shown, 'task', taskTitle, true);
				}}
				onLinkExisting={(taskTitle) => {
					if (shown !== null) void linkFromList(shown, taskTitle);
				}}
				onResendHabit={(habitTitle) => {
					if (shown !== null) void send(shown, 'habit', habitTitle, true);
				}}
				onToggleGroup={(groupKey) => {
					if (shown !== null) setExpandedGroups((current) => toggled(current, groupToggleKey(shown, groupKey)));
				}}
				onToggleMission={(taskTitle) => {
					if (shown !== null) setOpenMissions((current) => toggled(current, taskToggleKey(shown, taskTitle)));
				}}
			/>
		</>
	);
}
