import { useCallback, useEffect, useRef, useState } from 'react';
import type { CampaignSnapshot, LinkHabitToCampaign, LinkTaskToCampaign, SyncCampaigns } from '../../application';
import type { Clock } from '../../ports';
import { useT } from '../i18n';
import { CampaignBoard } from '../organisms/CampaignBoard';
import type { Sending } from '../organisms/CampaignCard';
import { CampaignList } from '../organisms/CampaignList';
import { campaignHomeCardView } from '../presenters/campaignHomeView';
import { campaignListView } from '../presenters/campaignView';
import { linkOutcomeView, type LinkOutcomeView } from '../presenters/linkOutcomeView';

/** What the campaigns panel needs from the application layer; built in `src/composition`. */
export interface CampaignsDeps {
	readonly syncCampaigns: Pick<SyncCampaigns, 'execute' | 'reload'>;
	readonly linkTask: Pick<LinkTaskToCampaign, 'execute'>;
	readonly linkHabit: Pick<LinkHabitToCampaign, 'execute'>;
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
	 * Given on the home screen: the panel draws the compact cards (game-ui S7), each opening the
	 * campaigns screen on its campaign through this. Without it, the full panel with its tasks,
	 * habits and send buttons.
	 */
	readonly onOpenCampaign?: (path: string) => void;
}

/**
 * Container of the campaigns (S5, S6): syncs when it mounts and whenever `syncKey` changes
 * (the home's "Sincronizar"), and sends a task to Habitica on request. It never polls (S4).
 */
export function CampaignsPanel({ deps, syncKey, hidden = false, onOpenCampaign }: CampaignsPanelProps) {
	const [snapshot, setSnapshot] = useState<CampaignSnapshot>(deps.campaignSnapshot);
	const [sending, setSending] = useState<Sending | null>(null);
	const [message, setMessage] = useState<(LinkOutcomeView & { readonly path: string }) | null>(null);
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
		async (path: string, kind: Sending['kind'], title: string): Promise<void> => {
			setSending({ kind, title });
			setMessage(null);
			const outcome = await (kind === 'habit' ? deps.linkHabit.execute(path, title) : deps.linkTask.execute(path, title));
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

	if (hidden) return null;
	const view = campaignListView(snapshot, { today: deps.clock.today(), defaultStaleAfterDays: deps.staleAfterDays(), t });
	if (onOpenCampaign) return <CampaignBoard list={view} cards={view.cards.map((card) => campaignHomeCardView(card, t))} onOpen={onOpenCampaign} />;
	return (
		<CampaignList
			view={view}
			sending={sending}
			message={message}
			onOpen={deps.openNote}
			onSend={(path, taskTitle) => void send(path, 'task', taskTitle)}
			onSendHabit={(path, habitTitle) => void send(path, 'habit', habitTitle)}
		/>
	);
}
