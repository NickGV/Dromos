import type { ShopSnapshot } from '../../application';
import { canAfford, goldShort, wholeGold } from '../../domain';
import { plural, type Translator } from '../../i18n';
import { goldText, shopView, type PurchasesView, type ShopBuyView, type ShopGoldView, type ShopItemView, type ShopNoteView } from './shopView';

/**
 * The drawn set of the stall's wares (M10 S6), cheaper to dearer: a basket of figs, a clay oil lamp,
 * a scroll, an amphora, a cloth of purple and a small chest. Habitica rewards carry no picture, so a
 * ware is drawn by its price among the wares on show.
 */
export const WARE_OBJECTS = ['figs', 'lamp', 'scroll', 'amphora', 'cloth', 'chest'] as const;
export type WareObject = (typeof WARE_OBJECTS)[number];

/**
 * The object drawn for a ware of `price` among `prices`, the prices of every ware on show, the
 * rewards' and the offers' together, so an amphora means the same in both tabs. The distinct whole
 * prices are ranked and spread over the six objects, the cheapest a basket of figs and the dearest a
 * chest; equal prices share an object. A lone price is a scroll, the middle of the set.
 */
export function wareObject(price: number, prices: readonly number[]): WareObject {
	const ladder = [...new Set([...prices, price].map(wholeGold))].sort((a, b) => a - b);
	const rank = ladder.indexOf(wholeGold(price));
	const top = WARE_OBJECTS.length - 1;
	const tier = ladder.length === 1 ? Math.floor(top / 2) : Math.round((rank * top) / (ladder.length - 1));
	return WARE_OBJECTS[tier] ?? 'scroll';
}

/** The tabs over the tiles: the user's Habitica rewards, Esdras's offers, the last purchases. */
export type ShopTab = 'rewards' | 'offers' | 'purchases';
/** A tab of tiles. */
export type WareTab = Exclude<ShopTab, 'purchases'>;

/** What the user picked: a tab, and the ware chosen in each tab of tiles. Local to the open Shop. */
export interface StallChoice {
	/** `null`, or a tab the shop does not show, opens the first one shown. */
	readonly tab: ShopTab | null;
	/** The key of the chosen ware in each tab; one missing, or gone since, chooses the first affordable. */
	readonly chosen: Readonly<Partial<Record<WareTab, string>>>;
}

/** Nothing picked yet: the Shop as it opens. */
export const NO_CHOICE: StallChoice = { tab: null, chosen: {} };

export interface StallTabView {
	readonly id: ShopTab;
	/** Its full title, "Habitica rewards", shown where it fits and always its accessible name. */
	readonly label: string;
	/** Shown on narrow panes, "Rewards"; the full title holds it, so the name still says what is seen. */
	readonly short: string;
	readonly selected: boolean;
}

/** One ware on the counter: a button that chooses it, never buys it. */
export interface WareTileView {
	readonly key: string;
	readonly name: string;
	/** The whole price, "20". */
	readonly price: string;
	readonly object: WareObject;
	/** Out of the gold's reach: drawn with a lock. Never offline, where the gold is unknown. */
	readonly locked: boolean;
	/** On a locked tile, how much gold is missing, "51 more"; `null` otherwise. */
	readonly missing: string | null;
	/** "Coffee out, 20 gold, can be bought": the ware, its price and whether it can be bought. */
	readonly ariaLabel: string;
	/** This is the ware in the detail panel. */
	readonly pressed: boolean;
}

/** The chosen ware, drawn large, with its words and Buy. */
export interface WareDetailView {
	readonly key: string;
	readonly name: string;
	readonly object: WareObject;
	/** A reward's notes, or Esdras's why; `null` when there are none. */
	readonly notes: string | null;
	/** An offer's last day, "Until 20 Nov"; `null` otherwise. */
	readonly until: string | null;
	readonly price: string;
	readonly priceLabel: string;
	/** The price and, when the gold reaches it, the gold left after it. */
	readonly lines: readonly { readonly term: string; readonly value: string }[];
	/** How much gold is missing, "You need 51 more gold", also while another purchase runs; `null` when it can be bought or the gold is unknown. */
	readonly reason: string | null;
	/** `null` when the shop cannot sell (offline, without credentials). */
	readonly buy: ShopBuyView | null;
}

/** A tab of tiles and its detail panel. */
export interface WaresView {
	readonly tab: WareTab;
	readonly tiles: readonly WareTileView[];
	/** `null` when there are no wares. */
	readonly detail: WareDetailView | null;
	/** The sentence said in place of the tiles and the detail when there are no wares. */
	readonly empty: string | null;
	/** The rows of `Shop.md` that could not be read. */
	readonly unreadable: string | null;
}

/** The Shop as a stall (M10 S6). */
export interface StallView {
	readonly title: string;
	/** The gold on the coin plaque; `null` while the shop is read, or when Habitica could not be. */
	readonly gold: ShopGoldView | null;
	readonly note: ShopNoteView | null;
	/** Habitica cannot be reached: the stall loses its color and holds still, as the landscape does. */
	readonly offline: boolean;
	/** The tab list's accessible name. */
	readonly tabsLabel: string;
	/** Empty while the shop is read; without the rewards when they could not be read. */
	readonly tabs: readonly StallTabView[];
	readonly rewards: WaresView | null;
	readonly offers: WaresView | null;
	readonly purchases: PurchasesView | null;
}

/**
 * The Shop as a stall of the era (M10 S6), from what the last read found (`shop`, `null` while it
 * is read) and what the user picked. The wares are the same as the list's (S1, S2): each a tile with
 * its drawn object, its name and its price, locked with the gold it lacks when the gold cannot reach
 * it. The tabs are those `shopView` has sections for, in order, the first one shown unless the user
 * picked another. In each tab of tiles one ware is chosen and shown in the detail panel with Buy:
 * the one the user chose there, else the first the gold reaches, else the first. `busy` is the key of
 * the ware being bought, which holds Buy on every other one.
 */
export function stallView(shop: ShopSnapshot | null, busy: string | null, choice: StallChoice, t: Translator): StallView {
	const list = shopView(shop, busy, t);
	const tabsLabel = t('shop.tabs.aria');
	const offline = shop?.status.kind === 'offline';
	if (shop === null || list.offers === null || list.purchases === null) return { title: list.title, gold: null, note: list.note, offline, tabsLabel, tabs: [], rewards: null, offers: null, purchases: null };
	// The gold Buy weighs against: only when the shop can sell, as the list's buttons.
	const gold = list.gold === null ? null : shop.gold;
	const rows = [...(list.rewards?.rows ?? []), ...list.offers.rows];
	const prices = rows.map((row) => row.cost);
	const wares = (tab: WareTab, section: { readonly rows: readonly ShopItemView[]; readonly empty: string | null }, unreadable: string | null): WaresView => {
		const tiles = section.rows.map((row) => tileView(row, prices, gold, t));
		const chosen = tiles.find((tile) => tile.key === choice.chosen[tab]) ?? tiles.find((tile) => !tile.locked) ?? tiles[0];
		const row = section.rows.find((candidate) => candidate.key === chosen?.key);
		return {
			tab,
			tiles: tiles.map((tile) => (tile.key === chosen?.key ? { ...tile, pressed: true } : tile)),
			detail: row ? detailView(row, prices, gold, t) : null,
			empty: tiles.length === 0 ? section.empty : null,
			unreadable,
		};
	};
	const rewards = list.rewards ? wares('rewards', list.rewards, null) : null;
	const offers = wares('offers', list.offers, list.offers.unreadable);
	const shown: readonly ShopTab[] = rewards ? ['rewards', 'offers', 'purchases'] : ['offers', 'purchases'];
	const selected = shown.find((tab) => tab === choice.tab) ?? shown[0];
	const labels: Record<ShopTab, string> = { rewards: t('shop.rewards.title'), offers: t('shop.offers.title'), purchases: t('shop.purchases.title') };
	const shorts: Record<ShopTab, string> = { rewards: t('shop.tab.rewards'), offers: t('shop.tab.offers'), purchases: t('shop.tab.purchases') };
	return {
		title: list.title,
		gold: list.gold,
		note: list.note,
		offline,
		tabsLabel,
		tabs: shown.map((id) => ({ id, label: labels[id], short: shorts[id], selected: id === selected })),
		rewards,
		offers,
		purchases: list.purchases,
	};
}

function tileView(row: ShopItemView, prices: readonly number[], gold: number | null, t: Translator): WareTileView {
	const short = gold === null ? 0 : goldShort(gold, row.cost);
	const ariaLabel = gold === null ? t('shop.tile.closed', { name: row.name, price: row.priceLabel }) : short > 0 ? plural(t, 'shop.tile.short', short, { name: row.name, price: row.priceLabel }) : t('shop.tile.can', { name: row.name, price: row.priceLabel });
	return {
		key: row.key,
		name: row.name,
		price: row.price,
		object: wareObject(row.cost, prices),
		locked: short > 0,
		missing: short > 0 ? plural(t, 'shop.tile.missing', short) : null,
		ariaLabel,
		pressed: false,
	};
}

function detailView(row: ShopItemView, prices: readonly number[], gold: number | null, t: Translator): WareDetailView {
	const reaches = gold !== null && canAfford(gold, row.cost);
	const price = { term: t('shop.confirm.price'), value: row.priceLabel };
	return {
		key: row.key,
		name: row.name,
		object: wareObject(row.cost, prices),
		notes: row.notes,
		until: row.until,
		price: row.price,
		priceLabel: row.priceLabel,
		lines: reaches ? [price, { term: t('shop.confirm.left'), value: goldText(gold - row.cost, t) }] : [price],
		reason: gold === null || reaches ? null : plural(t, 'shop.short', goldShort(gold, row.cost)),
		buy: row.buy,
	};
}

/**
 * The tab a key moves to in the tab list (WAI-ARIA tabs): the arrows to the next or the previous,
 * round from either end, Home to the first and End to the last; `null` for any other key.
 */
export function nextTab(tabs: readonly StallTabView[], key: string): ShopTab | null {
	const at = tabs.findIndex((tab) => tab.selected);
	const step: Record<string, number> = { ArrowRight: at + 1, ArrowLeft: at - 1 + tabs.length, Home: 0, End: tabs.length - 1 };
	const index = step[key];
	if (index === undefined || tabs.length === 0) return null;
	return tabs[index % tabs.length]?.id ?? null;
}
