import { useCallback, useEffect, useRef, useState } from 'react';
import type { HomeSnapshot, LoadHome, QuestSnapshot, SyncQuests } from '../../application';
import type { Clock } from '../../ports';
import { SyncButton } from '../atoms/SyncButton';
import { StatusBanner } from '../molecules/StatusBanner';
import { CharacterPanel, type CharacterPanelState } from '../organisms/CharacterPanel';
import { QuestList } from '../organisms/QuestList';
import { characterCardView } from '../presenters/characterCardView';
import { questListView } from '../presenters/questListView';
import { syncBannerView } from '../presenters/syncBanner';
import { CampaignsPanel, type CampaignsDeps } from './CampaignsPanel';

/** What the home screen needs from the application layer; built in `src/composition`. */
export interface HomeScreenDeps {
	readonly loadHome: Pick<LoadHome, 'execute'>;
	readonly syncQuests: Pick<SyncQuests, 'execute'>;
	/** The session's quests right now; reads `syncing` as soon as `syncQuests.execute()` returns. */
	readonly questSnapshot: () => QuestSnapshot;
	readonly clock: Clock;
	readonly campaigns: CampaignsDeps;
}

type CharacterState = HomeSnapshot['character'] | { readonly kind: 'loading' } | { readonly kind: 'unreadable' };

/** Re-render period that keeps "Sincronizado hace N min" current. Local only: it sends no request. */
const CLOCK_TICK_MS = 30_000;

/**
 * The only UI component that calls `application/` (S8). On mount and on
 * "Sincronizar" it reads the character (LoadHome, no network), renders it with
 * the session's quests, then runs one SyncQuests: it renders the `syncing`
 * snapshot first and the outcome when the sync settles. Each run also bumps `syncKey`,
 * which makes the campaigns panel sync too. No polling (S7).
 */
export function HomeScreen({ deps }: { readonly deps: HomeScreenDeps }) {
	const [character, setCharacter] = useState<CharacterState>({ kind: 'loading' });
	const [quests, setQuests] = useState<QuestSnapshot>(deps.questSnapshot);
	const [syncKey, setSyncKey] = useState(0);
	const mounted = useRef(false);
	useClockTick();

	const refresh = useCallback(async (): Promise<void> => {
		const home = await loadHomeOrNull(deps.loadHome);
		if (!mounted.current) return;
		setCharacter(home ? home.character : { kind: 'unreadable' });
		// Starting the sync first means this render already shows `syncing` next to the session's last quests.
		setSyncKey((key) => key + 1);
		const pending = deps.syncQuests.execute();
		setQuests(deps.questSnapshot());
		const synced = await pending;
		if (mounted.current) setQuests(synced);
	}, [deps]);

	useEffect(() => {
		mounted.current = true;
		void refresh();
		return () => {
			mounted.current = false;
		};
	}, [refresh]);

	return (
		<main className="dromos-home">
			<div className="dromos-toolbar">
				<StatusBanner {...syncBannerView(quests, deps.clock.now())} />
				<SyncButton syncing={quests.status.kind === 'syncing'} onSync={() => void refresh()} />
			</div>
			<CharacterPanel state={panelState(character)} />
			<QuestList view={questListView(quests.quests, deps.clock.today())} />
			<CampaignsPanel deps={deps.campaigns} syncKey={syncKey} />
		</main>
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

function panelState(character: CharacterState): CharacterPanelState {
	return character.kind === 'found' ? { kind: 'found', view: characterCardView(character.character) } : character;
}

function useClockTick(): void {
	const [, setTick] = useState(0);
	useEffect(() => {
		const id = window.setInterval(() => setTick((tick) => tick + 1), CLOCK_TICK_MS);
		return () => window.clearInterval(id);
	}, []);
}
