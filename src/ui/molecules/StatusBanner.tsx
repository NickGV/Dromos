import type { SyncBannerView } from '../presenters/syncBanner';

/**
 * Thin band with the sync status (S8); the tone only changes its accent color. The visible
 * text carries the time, which changes every minute, so a hidden live region announces only
 * the status: a screen reader hears a change of status, not the clock.
 */
export function StatusBanner({ tone, message, detail, announcement }: SyncBannerView) {
	return (
		<div className={`dromos-banner is-${tone}`}>
			<span className="dromos-banner-message">{message}</span>
			{detail ? <span className="dromos-banner-detail">{detail}</span> : null}
			<span className="dromos-visually-hidden" role="status" aria-live="polite">
				{announcement}
			</span>
		</div>
	);
}
