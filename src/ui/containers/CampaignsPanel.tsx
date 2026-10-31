import { useCallback, useEffect, useRef, useState } from 'react';
import type { CampaignSnapshot, LinkTaskToCampaign, SyncCampaigns } from '../../application';
import type { Clock } from '../../ports';
import { CampaignList } from '../organisms/CampaignList';
import { campaignListView } from '../presenters/campaignView';
import { linkOutcomeView, type LinkOutcomeView } from '../presenters/linkOutcomeView';

/** What the campaigns panel needs from the application layer; built in `src/composition`. */
export interface CampaignsDeps {
	readonly syncCampaigns: Pick<SyncCampaigns, 'execute' | 'reload'>;
	readonly linkTask: Pick<LinkTaskToCampaign, 'execute'>;
	/** The session's campaigns right now; reads `syncing` as soon as `syncCampaigns.execute()` returns. */
	readonly campaignSnapshot: () => CampaignSnapshot;
	/** The `staleAfterDays` setting, read on every render so a change applies at once. */
	readonly staleAfterDays: () => number;
	/** Opens a note in another tab. */
	readonly openNote: (path: string) => void;
	readonly clock: Clock;
}

/**
 * Container of the campaigns (S5, S6): syncs when it mounts and whenever `syncKey` changes
 * (the home's "Sincronizar"), and sends a task to Habitica on request. It never polls (S4).
 */
export function CampaignsPanel({ deps, syncKey }: { readonly deps: CampaignsDeps; readonly syncKey: number }) {
	const [snapshot, setSnapshot] = useState<CampaignSnapshot>(deps.campaignSnapshot);
	const [sendingTitle, setSendingTitle] = useState<string | null>(null);
	const [message, setMessage] = useState<(LinkOutcomeView & { readonly path: string }) | null>(null);
	const mounted = useRef(false);

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
		async (path: string, taskTitle: string): Promise<void> => {
			setSendingTitle(taskTitle);
			setMessage(null);
			const outcome = await deps.linkTask.execute(path, taskTitle);
			if (!mounted.current) return;
			setMessage({ ...linkOutcomeView(outcome), path });
			// Keep "Enviando…" until the list is refreshed, so the button never flashes back. Only
			// the note changed, so re-read the vault: it spends no Habitica request.
			const reloaded = await deps.syncCampaigns.reload();
			if (mounted.current) setSnapshot(reloaded);
			if (mounted.current) setSendingTitle(null);
		},
		[deps, sync],
	);

	const view = campaignListView(snapshot, { today: deps.clock.today(), defaultStaleAfterDays: deps.staleAfterDays() });
	return (
		<CampaignList
			view={view}
			sendingTitle={sendingTitle}
			message={message}
			onOpen={deps.openNote}
			onSend={(path, taskTitle) => void send(path, taskTitle)}
		/>
	);
}
