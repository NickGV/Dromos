import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { BuyOffer, BuyReward, LoadShop, PurchaseOutcome, ShopSnapshot } from '../../application';
import type { Language } from '../../i18n';
import { useT } from '../i18n';
import { ShopConfirm } from '../organisms/ShopConfirm';
import { ShopScreen } from '../organisms/ShopScreen';
import type { DayPeriod } from '../presenters/dayPeriod';
import { offerKey, purchaseConfirmView, purchaseMessage, rewardKey } from '../presenters/shopView';
import { NO_CHOICE, stallView, type ShopTab, type StallChoice, type WareTab } from '../presenters/stallView';
import type { CardModal } from './LibraryPanel';
import { askToConfirm, buyAfterConfirming, shopAfter, type OpenCard } from './shopActions';

/** What the Shop needs from the application layer; built in `src/composition`. */
export interface ShopDeps {
	/** Reads the gold and the rewards from Habitica; never rejects. */
	readonly loadShop: Pick<LoadShop, 'execute'>;
	/** Buys a reward in Habitica; never rejects. Called only after the purchase is confirmed. */
	readonly buyReward: Pick<BuyReward, 'execute'>;
	/** Buys one of Esdras's offers through Habitica (M10 S2); never rejects. Called only after the purchase is confirmed. */
	readonly buyOffer: Pick<BuyOffer, 'execute'>;
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
	/** The time of day the stall's sky shows (M10 S6). */
	readonly period?: DayPeriod;
}

/**
 * Container of the Shop screen (M10 S1, S2, S4, S6): reads the gold, the rewards, Esdras's offers and
 * the purse when the screen opens and on each Sync, never on a timer. It keeps which tab is open and
 * which ware is chosen in each, for this visit only; choosing a tile only shows it in the detail
 * panel, and on a phone, where the panel is under the tiles, brings the panel into view. Buy, a
 * reward's or an offer's, opens the confirmation; only its primary choice buys, and one purchase
 * runs at a time. When the card closes, the focus goes back to Buy. The outcome is a toast; the shop
 * then shows the gold Habitica returned, the purchase in the purse and the offer gone, with no
 * request, or is read again when that cannot be told. Leaving the screen closes an open
 * confirmation, which buys nothing.
 */
export function ShopPanel({ deps, language, syncKey, period = 'day' }: ShopPanelProps) {
	const t = useT();
	const idPrefix = `dromos-shop-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
	const [shop, setShop] = useState<ShopSnapshot | null>(null);
	const [busy, setBusy] = useState<string | null>(null);
	const [choice, setChoice] = useState<StallChoice>(NO_CHOICE);
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
		const next = shop ? shopAfter(shop, outcome) : null;
		if (next === null) void reload();
		else setShop((current) => (current ? shopAfter(current, outcome) : current));
	};

	const buy = (key: string): void => {
		const gold = shop?.gold ?? null;
		const reward = shop?.rewards?.find((candidate) => rewardKey(candidate.id) === key);
		const offer = shop?.offers.find((candidate) => offerKey(candidate.id) === key);
		const item = reward ? { name: reward.name, price: reward.price } : offer ? { name: offer.offer, price: offer.price } : null;
		if (acting.current || gold === null || item === null) return;
		acting.current = true;
		const trigger = buttonFor(body.current, key);
		const confirm = purchaseConfirmView(item, gold, t);
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
				return reward ? deps.buyReward.execute(reward, gold) : offer ? deps.buyOffer.execute(offer, gold) : Promise.resolve(null);
			},
		).then((outcome) => {
			acting.current = false;
			if (mounted.current) setBusy(null);
			settle(outcome);
		});
	};

	const pickTab = (tab: ShopTab): void => setChoice((current) => ({ ...current, tab }));

	const choose = (tab: WareTab, key: string): void => {
		setChoice((current) => ({ ...current, chosen: { ...current.chosen, [tab]: key } }));
		// Drawn under the tiles on a phone, the panel comes into view once React has drawn the ware in it:
		// a click's update is committed before the next task.
		const view = body.current?.ownerDocument.defaultView;
		view?.setTimeout(() => showDetail(body.current, tab), 0);
	};

	return (
		<div className="dromos-shop-frame" ref={body}>
			<ShopScreen view={stallView(shop, busy, choice, t)} period={period} onBuy={buy} onTab={pickTab} onChoose={choose} idPrefix={idPrefix} />
		</div>
	);
}

/**
 * Brings the detail panel of `tab` into view when it is drawn under its tiles (a phone) and not
 * whole on screen; beside the tiles it is already in view. Smooth unless motion is reduced.
 */
function showDetail(root: HTMLElement | null, tab: WareTab): void {
	const panel = root?.querySelector<HTMLElement>(`.dromos-stall-panel.is-${tab}`);
	const tiles = panel?.querySelector<HTMLElement>('.dromos-wares');
	const detail = panel?.querySelector<HTMLElement>('.dromos-ware-detail');
	if (!tiles || !detail || detail.getBoundingClientRect().top <= tiles.getBoundingClientRect().top + 1) return;
	const reduce = detail.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
	detail.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
}

/** The buy button of the item `key` inside `root`, to give it the focus back. */
function buttonFor(root: HTMLElement | null, key: string): HTMLElement | null {
	return Array.from(root?.querySelectorAll<HTMLElement>('[data-shop-key]') ?? []).find((element) => element.dataset.shopKey === key) ?? null;
}
