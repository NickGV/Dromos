import { Coin } from '../atoms/Coin';
import type { PurchasesView, ShopItemView, ShopSectionView, ShopView } from '../presenters/shopView';
import { ScreenHeader } from './ScreenHeader';

export interface ShopScreenProps {
	readonly view: ShopView;
	/** A buy button was clicked: the key of its item. Held buttons call nothing. */
	readonly onBuy: (key: string) => void;
	/** Starts the ids of the reasons the buttons are described by, unique to this screen. */
	readonly idPrefix?: string;
}

/**
 * The Shop screen (M10 S1, S4): its header card, "Shop", with the gold hung at its other end, then
 * a note when the shop cannot sell (offline, without credentials) or is being read, then the
 * user's Habitica rewards, each with its notes, its price and a button that names what it buys and
 * its price. A reward dearer than the gold keeps its button focusable but held, described by how
 * much gold is missing. Under them, the last purchases from the purse, as journal lines (M10 S3),
 * shown offline too. Every amount is a coin and a number on screen and words for screen readers.
 */
export function ShopScreen({ view, onBuy, idPrefix = 'dromos-shop' }: ShopScreenProps) {
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
			{view.note ? <p className={`dromos-panel dromos-shop-note is-${view.note.tone}`}>{view.note.text}</p> : null}
			{view.rewards ? section(view.rewards, 'rewards', onBuy, idPrefix) : null}
			{view.purchases ? purchases(view.purchases) : null}
		</div>
	);
}

function section(view: ShopSectionView, name: string, onBuy: (key: string) => void, idPrefix: string) {
	return (
		<section className={`dromos-section dromos-shop-${name}`}>
			<h3 className="dromos-card-title">{view.title}</h3>
			{view.empty ? <p className="dromos-panel dromos-shop-empty">{view.empty}</p> : <ul className="dromos-panel dromos-shop-list">{view.rows.map((row) => item(row, onBuy, idPrefix))}</ul>}
		</section>
	);
}

function item(row: ShopItemView, onBuy: (key: string) => void, idPrefix: string) {
	const { buy } = row;
	const reasonId = `${idPrefix}-${row.key.replace(/[^a-zA-Z0-9-]/g, '-')}-reason`;
	const classes = ['dromos-btn is-small dromos-shop-buy-button', buy.enabled || buy.busy ? 'is-primary' : 'is-unavailable'].join(' ');
	return (
		<li key={row.key} className="dromos-shop-item">
			<div className="dromos-shop-item-text">
				<p className="dromos-shop-item-name">{row.name}</p>
				{row.notes ? <p className="dromos-shop-item-notes">{row.notes}</p> : null}
			</div>
			<p className="dromos-shop-price">
				<Coin />
				<span aria-hidden="true">{row.price}</span>
				<span className="dromos-visually-hidden">{row.priceLabel}</span>
			</p>
			<div className="dromos-shop-buy">
				<button
					type="button"
					className={classes}
					data-shop-key={row.key}
					aria-label={buy.ariaLabel}
					aria-disabled={buy.enabled ? undefined : true}
					aria-busy={buy.busy ? true : undefined}
					aria-describedby={buy.reason ? reasonId : undefined}
					onClick={buy.enabled ? () => onBuy(row.key) : undefined}
				>
					{buy.text}
				</button>
				{buy.reason ? (
					<p className="dromos-shop-reason" id={reasonId}>
						{buy.reason}
					</p>
				) : null}
			</div>
		</li>
	);
}

function purchases(view: PurchasesView) {
	return (
		<section className="dromos-section dromos-shop-purchases">
			<h3 className="dromos-card-title">{view.title}</h3>
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
		</section>
	);
}
