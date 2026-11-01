import type { LevelUpBannerView } from '../presenters/levelUpView';

/** Level-ups and unlocks since the view was last opened, closed with one click (S10). Calm: no animation, no sound. */
export function LevelUpBanner({ view, onDismiss }: { readonly view: LevelUpBannerView; readonly onDismiss: () => void }) {
	return (
		<div className="dromos-levelup" role="status" aria-live="polite">
			<ul className="dromos-levelup-list">
				{view.messages.map((message, index) => (
					<li key={`${index}:${message}`}>{message}</li>
				))}
			</ul>
			<button type="button" className="dromos-levelup-dismiss" onClick={onDismiss}>
				{view.dismissLabel}
			</button>
		</div>
	);
}
