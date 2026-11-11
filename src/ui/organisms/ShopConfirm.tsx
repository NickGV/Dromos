import type { PurchaseConfirmView } from '../presenters/shopView';
import { focusOnDraw } from './cardEvents';

export interface ShopConfirmProps {
	readonly view: PurchaseConfirmView;
	/** `true` from the primary choice, `false` from Cancel. */
	readonly answer: (yes: boolean) => void;
}

/**
 * The confirmation of a purchase (M10 S1), drawn in a card over the workspace: it names the item,
 * its price and the gold left after it. Cancel takes the focus as it is drawn, so a second Enter on
 * the Shop's Buy never confirms; Buy is the next Tab (L8). Cancel, Escape and the card's close button
 * buy nothing.
 */
export function ShopConfirm({ view, answer }: ShopConfirmProps) {
	return (
		<div className="dromos-shop-confirm">
			<h2 className="dromos-shop-confirm-title">{view.title}</h2>
			<dl className="dromos-shop-confirm-lines">
				{view.lines.map((line) => (
					<div key={line.term} className="dromos-shop-confirm-line">
						<dt>{line.term}</dt>
						<dd className="dromos-shop-confirm-value">{line.value}</dd>
					</div>
				))}
			</dl>
			<div className="dromos-shop-confirm-actions">
				<button type="button" className="dromos-btn" ref={focusOnDraw} onClick={() => answer(false)}>
					{view.cancel}
				</button>
				<button type="button" className="dromos-btn is-primary" onClick={() => answer(true)}>
					{view.confirm}
				</button>
			</div>
		</div>
	);
}
