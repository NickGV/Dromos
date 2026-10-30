import type { SyncBannerView } from '../presenters/syncBanner';

/** Thin band with the sync status (S8); the tone only changes its accent color. */
export function StatusBanner({ tone, message, detail }: SyncBannerView) {
	return (
		<div className={`dromos-banner is-${tone}`} role="status" aria-live="polite">
			<span className="dromos-banner-message">{message}</span>
			{detail ? <span className="dromos-banner-detail">{detail}</span> : null}
		</div>
	);
}
