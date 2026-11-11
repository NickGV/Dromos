import type { KeyboardEvent } from 'react';
import { Coin } from '../atoms/Coin';
import { WareArt, WareLock } from '../atoms/WareArt';
import type { PurchasesView } from '../presenters/shopView';
import { nextTab, type ShopTab, type StallTabView, type StallView, type WareDetailView, type WaresView, type WareTab, type WareTileView } from '../presenters/stallView';
import { ScreenHeader } from './ScreenHeader';

export interface ShopScreenProps {
	readonly view: StallView;
	/** Buy was clicked: the key of the chosen ware. A held Buy calls nothing. */
	readonly onBuy: (key: string) => void;
	/** A tab was picked, by a click or a key. */
	readonly onTab: (tab: ShopTab) => void;
	/** A tile was clicked: it chooses the ware for the detail panel and buys nothing. */
	readonly onChoose: (tab: WareTab, key: string) => void;
	/** Starts the ids of the tabs, their panels and the lines that describe Buy, unique to this screen. */
	readonly idPrefix?: string;
}

/**
 * The Shop's wares (M10 S1, S2, S4, S6): its header card, "Shop", with the gold hung at its other
 * end, then on a wooden counter a note when the shop cannot sell (offline, without credentials) or
 * is being read, then the tabs: the user's Habitica rewards, Esdras's offers and the last purchases. A tab of wares holds a
 * grid of tiles, each the ware's drawing, name and price, locked with the gold it lacks when the gold
 * cannot reach it, and the detail panel of the chosen one: drawn large, with its notes or Esdras's
 * why and last day, its price, the gold left after it, and Buy, which names what it buys and its
 * price. Buy dearer than the gold stays focusable but held, described by how much is missing. Every
 * tab panel stays in the page, hidden but the chosen one. Offline the offers and the purchases show
 * with no Buy. Every amount is words for screen readers; the drawings are skipped.
 */
export function ShopScreen({ view, onBuy, onTab, onChoose, idPrefix = 'dromos-shop' }: ShopScreenProps) {
	const selected = view.tabs.find((tab) => tab.selected)?.id ?? null;
	const gold = view.gold ? (
		<p className="dromos-shop-gold">
			<span className="dromos-visually-hidden">{view.gold.label}</span>
			<Coin size={22} />
			<span className="dromos-shop-gold-amount" aria-hidden="true">
				{view.gold.amount}
			</span>
		</p>
	) : undefined;
	return (
		<div className="dromos-shop">
			<ScreenHeader title={view.title} aside={gold} />
			<div className="dromos-stall-counter">
				{view.note ? <p className={`dromos-panel dromos-shop-note is-${view.note.tone}`}>{view.note.text}</p> : null}
				{view.tabs.length > 0 ? tabList(view, onTab, idPrefix) : null}
				{view.rewards ? waresPanel(view.rewards, selected === 'rewards', onBuy, onChoose, idPrefix) : null}
				{view.offers ? waresPanel(view.offers, selected === 'offers', onBuy, onChoose, idPrefix) : null}
				{view.purchases ? purchasesPanel(view.purchases, selected === 'purchases', idPrefix) : null}
			</div>
		</div>
	);
}

function tabId(idPrefix: string, tab: ShopTab): string {
	return `${idPrefix}-tab-${tab}`;
}

function panelId(idPrefix: string, tab: ShopTab): string {
	return `${idPrefix}-panel-${tab}`;
}

/**
 * The tabs (WAI-ARIA tabs, automatic activation): only the chosen one is in the Tab order; the arrow
 * keys, Home and End move to another, choose it and give it the focus.
 */
function tabList(view: StallView, onTab: (tab: ShopTab) => void, idPrefix: string) {
	const onKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
		const next = nextTab(view.tabs, event.key);
		if (next === null) return;
		event.preventDefault();
		onTab(next);
		event.currentTarget.querySelector<HTMLElement>(`[data-tab="${next}"]`)?.focus();
	};
	return (
		<div className="dromos-stall-tabs" role="tablist" aria-label={view.tabsLabel} onKeyDown={onKeyDown}>
			{view.tabs.map((tab: StallTabView) => (
				<button
					key={tab.id}
					type="button"
					role="tab"
					id={tabId(idPrefix, tab.id)}
					className="dromos-stall-tab"
					aria-selected={tab.selected}
					aria-controls={panelId(idPrefix, tab.id)}
					tabIndex={tab.selected ? 0 : -1}
					data-tab={tab.id}
					aria-label={tab.label}
					onClick={() => onTab(tab.id)}
				>
					<span className="dromos-stall-tab-long">{tab.label}</span>
					<span className="dromos-stall-tab-short">{tab.short}</span>
				</button>
			))}
		</div>
	);
}

function waresPanel(view: WaresView, shown: boolean, onBuy: (key: string) => void, onChoose: (tab: WareTab, key: string) => void, idPrefix: string) {
	const unreadable = view.unreadable ? <p className="dromos-shop-unreadable is-note">{view.unreadable}</p> : null;
	return (
		<div role="tabpanel" id={panelId(idPrefix, view.tab)} aria-labelledby={tabId(idPrefix, view.tab)} hidden={!shown} className={`dromos-stall-panel is-${view.tab}`}>
			{view.empty ? (
				<p className="dromos-panel dromos-shop-empty">{view.empty}</p>
			) : (
				<>
					<ul className="dromos-panel dromos-wares">
						{view.tiles.map((tile) => (
							<li key={tile.key}>{wareTile(tile, view.tab, onChoose)}</li>
						))}
					</ul>
					{view.detail ? wareDetail(view.detail, onBuy, `${idPrefix}-${view.tab}`) : null}
				</>
			)}
			{unreadable}
		</div>
	);
}

/** One ware: a button that chooses it, pressed while it is in the detail panel; its name says it all. */
function wareTile(tile: WareTileView, tab: WareTab, onChoose: (tab: WareTab, key: string) => void) {
	const classes = ['dromos-ware', `is-${tile.object}`, tile.locked ? 'is-locked' : null].filter(Boolean).join(' ');
	return (
		<button type="button" className={classes} aria-pressed={tile.pressed} aria-label={tile.ariaLabel} data-ware-key={tile.key} onClick={() => onChoose(tab, tile.key)}>
			<span className="dromos-ware-shelf">
				<WareArt object={tile.object} />
				{tile.locked ? <WareLock /> : null}
			</span>
			<span className="dromos-ware-name" aria-hidden="true">
				{tile.name}
			</span>
			<span className="dromos-ware-price" aria-hidden="true">
				<Coin size={14} />
				{tile.price}
			</span>
			{tile.missing ? (
				<span className="dromos-ware-missing" aria-hidden="true">
					{tile.missing}
				</span>
			) : null}
		</button>
	);
}

/** The chosen ware, labelled by its name: drawn large, its words, its price, the gold left after it, and Buy. */
function wareDetail(detail: WareDetailView, onBuy: (key: string) => void, idPrefix: string) {
	const nameId = `${idPrefix}-detail`;
	const reasonId = `${idPrefix}-reason`;
	const buy = detail.buy;
	const classes = ['dromos-btn dromos-shop-buy-button', buy && (buy.enabled || buy.busy) ? 'is-primary' : 'is-unavailable'].join(' ');
	return (
		<section className="dromos-panel dromos-ware-detail" aria-labelledby={nameId}>
			<div className="dromos-ware-detail-art">
				<WareArt object={detail.object} />
			</div>
			<div className="dromos-ware-detail-words">
				<h3 className="dromos-ware-detail-name" id={nameId}>
					{detail.name}
				</h3>
				{detail.notes ? <p className="dromos-ware-detail-notes">{detail.notes}</p> : null}
				{detail.until ? <p className="dromos-shop-item-until">{detail.until}</p> : null}
			</div>
			<dl className="dromos-ware-detail-lines">
				{detail.lines.map((line) => (
					<div key={line.term} className="dromos-shop-confirm-line">
						<dt>{line.term}</dt>
						<dd className="dromos-shop-confirm-value">{line.value}</dd>
					</div>
				))}
			</dl>
			{detail.reason ? (
				<p className="dromos-shop-reason" id={reasonId}>
					{detail.reason}
				</p>
			) : null}
			{buy ? (
				<button
					type="button"
					className={classes}
					data-shop-key={detail.key}
					aria-label={buy.ariaLabel}
					aria-disabled={buy.enabled ? undefined : true}
					aria-busy={buy.busy ? true : undefined}
					aria-describedby={detail.reason ? reasonId : undefined}
					onClick={buy.enabled ? () => onBuy(detail.key) : undefined}
				>
					{buy.text}
				</button>
			) : null}
		</section>
	);
}

function purchasesPanel(view: PurchasesView, shown: boolean, idPrefix: string) {
	return (
		<div role="tabpanel" id={panelId(idPrefix, 'purchases')} aria-labelledby={tabId(idPrefix, 'purchases')} hidden={!shown} tabIndex={0} className="dromos-stall-panel is-purchases">
			<div className="dromos-panel dromos-shop-ledger">
				{view.empty ? <p className="dromos-shop-ledger-empty">{view.empty}</p> : null}
				{view.rows.length > 0 ? (
					<ul className="dromos-shop-purchase-list">
						{view.rows.map((row) => (
							<li key={row.key} className="dromos-shop-purchase">
								<span className="dromos-shop-purchase-day">{row.date}</span>
								<span className="dromos-shop-purchase-what">{row.what}</span>
								<span className="dromos-shop-purchase-gold">
									<span aria-hidden="true">{row.gold}</span>
									<span className="dromos-visually-hidden">{row.goldLabel}</span>
								</span>
							</li>
						))}
					</ul>
				) : null}
				{view.unreadable ? <p className="dromos-shop-unreadable">{view.unreadable}</p> : null}
			</div>
		</div>
	);
}
