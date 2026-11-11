import type { PurchaseOutcome, ShopSnapshot, ShopStatus } from '../../application';
import { canAfford, goldShort, wholeGold, type PurseEntry, type Reward } from '../../domain';
import { plural, type Translator } from '../../i18n';
import { dayMonth } from './dates';
import { waitText } from './syncBanner';

/** The gold in the header card: the whole number shown, and the sentence a screen reader hears. */
export interface ShopGoldView {
	readonly amount: string;
	/** "Your gold: 124 gold". */
	readonly label: string;
}

/** A line under the header card: why nothing can be bought, or that the shop is being read. */
export interface ShopNoteView {
	readonly text: string;
	readonly tone: 'quiet' | 'warning' | 'error';
}

/** The buy button of one item. A held one keeps its focus (aria-disabled) and takes no click. */
export interface ShopBuyView {
	readonly text: string;
	/** "Buy Coffee out for 20 gold": what it buys and its price, in words. */
	readonly ariaLabel: string;
	readonly enabled: boolean;
	/** Why it cannot be bought, shown beside it and given as its description; `null` when it can, or the shop is busy. */
	readonly reason: string | null;
	/** This item is being bought now. */
	readonly busy: boolean;
}

/** One thing for sale. */
export interface ShopItemView {
	/** `reward:<id>`: what the screen hands back when its button is clicked. */
	readonly key: string;
	readonly name: string;
	readonly notes: string | null;
	/** The whole price, "20". */
	readonly price: string;
	/** The price in words, "20 gold". */
	readonly priceLabel: string;
	readonly buy: ShopBuyView;
}

export interface ShopSectionView {
	readonly title: string;
	readonly rows: readonly ShopItemView[];
	/** Said in place of the rows when there are none; `null` otherwise. */
	readonly empty: string | null;
}

/** One purchase of the purse: its day, what it was, and the gold it took. */
export interface PurchaseRowView {
	readonly key: string;
	/** "11 Nov". */
	readonly date: string;
	readonly what: string;
	/** "−20". */
	readonly gold: string;
	/** "20 gold spent". */
	readonly goldLabel: string;
}

/** The last purchases (M10 S3, S4). */
export interface PurchasesView {
	readonly title: string;
	readonly rows: readonly PurchaseRowView[];
	/** Said in place of the rows when there are none; `null` otherwise. */
	readonly empty: string | null;
	/** How many rows of the purse could not be read, and where; `null` when every row could. */
	readonly unreadable: string | null;
}

/** The Shop screen (M10 S1, S4). */
export interface ShopView {
	readonly title: string;
	/** `null` while the shop is read, or when Habitica could not be. */
	readonly gold: ShopGoldView | null;
	readonly note: ShopNoteView | null;
	/** `null` when nothing could be read. */
	readonly rewards: ShopSectionView | null;
	/** `null` while the shop is read; shown offline too, since the purse is in the vault. */
	readonly purchases: PurchasesView | null;
}

/** The key the screen hands back for the reward with Habitica id `id`. */
export function rewardKey(id: string): string {
	return `reward:${id}`;
}

/** "20 gold", "1 moneda de oro": a whole amount of gold in words. */
export function goldText(gold: number, t: Translator): string {
	return plural(t, 'shop.gold', wholeGold(gold));
}

/**
 * The Shop screen from what the last read found (M10 S1): `shop` is `null` while it is read. `busy`
 * is the key of the item being bought, which holds every other button meanwhile. A reward dearer
 * than the gold cannot be bought and says how much is missing; offline or without credentials no
 * button is drawn at all, and a note says why.
 */
export function shopView(shop: ShopSnapshot | null, busy: string | null, t: Translator): ShopView {
	const title = t('screen.shop');
	if (shop === null) return { title, gold: null, note: { text: t('shop.loading'), tone: 'quiet' }, rewards: null, purchases: null };
	const purchases = purchasesView(shop, t);
	if (shop.status.kind !== 'ready' || shop.gold === null || shop.rewards === null) return { title, gold: null, note: statusNote(shop.status, t), rewards: null, purchases };
	const { gold } = shop;
	return {
		title,
		gold: { amount: String(wholeGold(gold)), label: t('shop.gold.aria', { gold: goldText(gold, t) }) },
		note: null,
		rewards: {
			title: t('shop.rewards.title'),
			rows: shop.rewards.map((reward) => itemView(rewardKey(reward.id), reward, gold, busy, t)),
			empty: shop.rewards.length === 0 ? t('shop.rewards.empty') : null,
		},
		purchases,
	};
}

function purchasesView(shop: ShopSnapshot, t: Translator): PurchasesView {
	return {
		title: t('shop.purchases.title'),
		rows: shop.purchases.map((entry, index) => purchaseRow(entry, String(index), t)),
		empty: shop.purchases.length === 0 ? t('shop.purchases.empty') : null,
		unreadable: unreadableText(shop.purseUnreadable, t),
	};
}

function purchaseRow(entry: PurseEntry, key: string, t: Translator): PurchaseRowView {
	const spent = wholeGold(Math.abs(entry.gold));
	return { key, date: dayMonth(entry.date, t), what: entry.what, gold: `${entry.gold > 0 ? '+' : '−'}${spent}`, goldLabel: plural(t, 'shop.spent', spent) };
}

/** "1 row of Dromos/Purse.md could not be read (line 9).", or `null` when every row could. */
export function unreadableText(lines: readonly { readonly path: string; readonly line: number }[], t: Translator): string | null {
	const [first] = lines;
	if (!first) return null;
	return plural(t, 'shop.unreadable', lines.length, { path: first.path, lines: lines.map((line) => line.line).join(', ') });
}

function itemView(key: string, item: Pick<Reward, 'name' | 'notes' | 'price'>, gold: number, busy: string | null, t: Translator): ShopItemView {
	const priceLabel = goldText(item.price, t);
	const affordable = canAfford(gold, item.price);
	const here = busy === key;
	return {
		key,
		name: item.name,
		notes: item.notes,
		price: String(wholeGold(item.price)),
		priceLabel,
		buy: {
			text: t(here ? 'shop.buy.busy' : 'shop.buy'),
			ariaLabel: t('shop.buy.aria', { name: item.name, price: priceLabel }),
			enabled: affordable && busy === null,
			reason: affordable || busy !== null ? null : plural(t, 'shop.short', goldShort(gold, item.price)),
			busy: here,
		},
	};
}

function statusNote(status: ShopStatus, t: Translator): ShopNoteView {
	switch (status.kind) {
		case 'not-configured':
			return { text: t('shop.notConfigured'), tone: 'warning' };
		case 'offline':
			return { text: t('shop.offline'), tone: 'warning' };
		case 'rate-limited':
			return { text: t('shop.rateLimited', { wait: waitText(status.retryAfterSeconds, t) }), tone: 'warning' };
		case 'unauthorized':
			return { text: t('shop.unauthorized'), tone: 'error' };
		case 'error':
		case 'ready':
			return { text: t('shop.error'), tone: 'error' };
	}
}

/** The confirmation of a purchase (M10 S1): it names the item, its price and the gold left after it. */
export interface PurchaseConfirmView {
	/** The confirmation's accessible name. */
	readonly label: string;
	readonly title: string;
	readonly lines: readonly { readonly term: string; readonly value: string }[];
	/** The primary choice, which takes the focus. */
	readonly confirm: string;
	readonly cancel: string;
}

export function purchaseConfirmView(item: { readonly name: string; readonly price: number }, gold: number, t: Translator): PurchaseConfirmView {
	return {
		label: t('shop.confirm.aria'),
		title: t('shop.confirm.title', { name: item.name }),
		lines: [
			{ term: t('shop.confirm.price'), value: goldText(item.price, t) },
			{ term: t('shop.confirm.left'), value: goldText(gold - item.price, t) },
		],
		confirm: t('shop.confirm.buy'),
		cancel: t('shop.confirm.cancel'),
	};
}

/**
 * The toast after a purchase (M10 S1): what was bought and the gold Habitica returned, or why
 * nothing was. Without an answer from Habitica it cannot say whether the gold was taken, so it
 * says to look. `null` for a click that came while another purchase ran.
 */
export function purchaseMessage(outcome: PurchaseOutcome, t: Translator): string | null {
	switch (outcome.kind) {
		case 'busy':
			return null;
		case 'not-configured':
			return t('shop.failed.notConfigured');
		case 'bought': {
			const bought = outcome.gold === null ? t('shop.bought.noGold', { name: outcome.reward.name }) : t('shop.bought', { name: outcome.reward.name, gold: goldText(outcome.gold, t) });
			return outcome.recorded ? bought : `${bought} ${t('shop.unrecorded')}`;
		}
		case 'too-dear':
			return t('shop.tooDear', { name: outcome.reward.name, price: goldText(outcome.reward.price, t), gold: goldText(outcome.gold, t) });
		case 'failed':
			switch (outcome.status.kind) {
				case 'offline':
					return t('shop.failed.offline');
				case 'unauthorized':
					return t('shop.failed.unauthorized');
				case 'rate-limited':
					return t('shop.failed.rateLimited', { wait: waitText(outcome.status.retryAfterSeconds, t) });
				case 'error':
					return t('shop.failed.error');
			}
	}
}
