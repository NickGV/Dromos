import { useCallback, useEffect, useRef, useState } from 'react';
import type { BuyReward, LoadShop, PurchaseOutcome, ShopSnapshot } from '../../application';
import type { Language } from '../../i18n';
import { useT } from '../i18n';
import { ShopConfirm } from '../organisms/ShopConfirm';
import { ShopScreen } from '../organisms/ShopScreen';
import { purchaseConfirmView, purchaseMessage, rewardKey, shopView } from '../presenters/shopView';
import type { CardModal } from './LibraryPanel';
import { askToConfirm, buyAfterConfirming, type OpenCard } from './shopActions';

/** What the Shop needs from the application layer; built in `src/composition`. */
export interface ShopDeps {
	/** Reads the gold and the rewards from Habitica; never rejects. */
	readonly loadShop: Pick<LoadShop, 'execute'>;
	/** Buys a reward in Habitica; never rejects. Called only after the purchase is confirmed. */
	readonly buyReward: Pick<BuyReward, 'execute'>;
	/** Opens the confirmation in a card over the workspace. */
	readonly openCard: OpenCard;
	/** Shows a brief toast: what a purchase did. */
	readonly notify: (message: string) => void;
}

export interface ShopPanelProps {
	readonly deps: ShopDeps;
	/** The interface language, for the confirmation, which opens outside the view. */
	readonly language: Language;
	/** The home's sync counter: each bump after the first read, Sync was selected, and the shop is read again. */
	readonly syncKey: number;
}

/**
 * Container of the Shop screen (M10 S1, S4): reads the gold and the rewards when the screen opens
 * and on each Sync, never on a timer. A buy button opens the confirmation; only its primary choice
 * buys, and one purchase runs at a time. When the card closes, the focus goes back to the button
 * that opened it. The outcome is a toast, and the gold shown becomes the gold Habitica returned;
 * when its answer did not say, the shop is read again. Leaving the screen closes an open
 * confirmation, which buys nothing.
 */
export function ShopPanel({ deps, language, syncKey }: ShopPanelProps) {
	const t = useT();
	const [shop, setShop] = useState<ShopSnapshot | null>(null);
	const [busy, setBusy] = useState<string | null>(null);
	const acting = useRef(false);
	const mounted = useRef(false);
	const seenSyncKey = useRef(syncKey);
	const card = useRef<CardModal | null>(null);
	const body = useRef<HTMLDivElement>(null);

	const reload = useCallback(async (): Promise<void> => {
		const next = await deps.loadShop.execute();
		if (mounted.current) setShop(next);
	}, [deps]);

	useEffect(() => {
		mounted.current = true;
		void reload();
		return () => {
			mounted.current = false;
			card.current?.close();
		};
	}, [reload]);

	// Sync on the plaque reads the shop again, with the rest of the game.
	useEffect(() => {
		if (seenSyncKey.current === syncKey) return;
		seenSyncKey.current = syncKey;
		void reload();
	}, [syncKey, reload]);

	const settle = (outcome: PurchaseOutcome | null): void => {
		if (outcome === null || !mounted.current) return;
		const message = purchaseMessage(outcome, t);
		if (message) deps.notify(message);
		if (outcome.kind === 'bought' && outcome.gold === null) void reload();
		else if (outcome.kind === 'bought' || outcome.kind === 'too-dear') {
			const { gold } = outcome;
			if (gold !== null) setShop((current) => (current ? { ...current, gold } : current));
		}
	};

	const buy = (key: string): void => {
		const gold = shop?.gold ?? null;
		const reward = shop?.rewards?.find((candidate) => rewardKey(candidate.id) === key);
		if (acting.current || gold === null || !reward) return;
		acting.current = true;
		const trigger = buttonFor(body.current, key);
		const confirm = purchaseConfirmView(reward, gold, t);
		void buyAfterConfirming(
			async () => {
				const yes = await askToConfirm(deps.openCard, { label: confirm.label, lang: language, className: 'dromos-confirm-modal' }, (answer) => <ShopConfirm view={confirm} answer={answer} />, (opened) => (card.current = opened));
				card.current = null;
				// The card is closed: the focus goes back to the button that opened it.
				if (trigger?.isConnected) trigger.focus({ preventScroll: true });
				return yes;
			},
			() => {
				if (mounted.current) setBusy(key);
				return deps.buyReward.execute(reward, gold);
			},
		).then((outcome) => {
			acting.current = false;
			if (mounted.current) setBusy(null);
			settle(outcome);
		});
	};

	return (
		<div className="dromos-shop-frame" ref={body}>
			<ShopScreen view={shopView(shop, busy, t)} onBuy={buy} />
		</div>
	);
}

/** The buy button of the item `key` inside `root`, to give it the focus back. */
function buttonFor(root: HTMLElement | null, key: string): HTMLElement | null {
	return Array.from(root?.querySelectorAll<HTMLElement>('[data-shop-key]') ?? []).find((element) => element.dataset.shopKey === key) ?? null;
}
