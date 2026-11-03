import type { IconRender } from '../atoms/Icon';
import { RingMedallion } from '../atoms/RingMedallion';
import type { CeremonyView } from '../presenters/levelUpView';

export interface LevelUpPanelProps {
	readonly view: CeremonyView;
	/** Closes the ceremony: the events are dismissed. */
	readonly onDismiss: () => void;
	readonly renderIcon: IconRender;
}

/**
 * The panel the level-up ceremony opens under the character card (game-ui S4): "You reached
 * level N", or a title of its own when only skills moved, then one row per skill event of the
 * sync with a small medallion, and one button that closes it. No stat to choose: the rules stay
 * the vault's (game-ui L2).
 */
export function LevelUpPanel({ view, onDismiss, renderIcon }: LevelUpPanelProps) {
	return (
		<section className="dromos-card dromos-ceremony" aria-label={view.ariaLabel}>
			<div className="dromos-ceremony-news" role="status" aria-live="polite">
				<h2 className="dromos-ceremony-title">{view.title}</h2>
				{view.rows.length > 0 ? (
					<ul className="dromos-ceremony-rows">
						{view.rows.map((row) => (
							<li key={row.key} className="dromos-ceremony-row">
								<RingMedallion percent={100} earned icon={row.icon} badge={null} renderIcon={renderIcon} size={56} />
								<span className="dromos-ceremony-words">
									<span className="dromos-ceremony-text">{row.text}</span>
									{row.detail ? <span className="dromos-ceremony-detail">{row.detail}</span> : null}
								</span>
							</li>
						))}
					</ul>
				) : null}
			</div>
			<button type="button" className="dromos-btn is-small dromos-ceremony-dismiss" onClick={onDismiss}>
				{view.dismissLabel}
			</button>
		</section>
	);
}
