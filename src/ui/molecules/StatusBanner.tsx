import { SyncAnnouncement } from '../atoms/SyncAnnouncement';
import type { SyncBannerView } from '../presenters/syncBanner';

/**
 * The sync status (S8): a quiet line, or a band when the user has something to do; the tone
 * only changes its accent color. The visible
 * text carries the time, which changes every minute, so a hidden live region announces only
 * the status: a screen reader hears a change of status, not the clock.
 */
export function StatusBanner({ tone, message, detail, announcement, prominent }: SyncBannerView) {
	return (
		<div className={`dromos-banner is-${tone}${prominent ? ' is-prominent' : ''}`}>
			<span className="dromos-banner-message">{message}</span>
			{detail ? <span className="dromos-banner-detail">{detail}</span> : null}
			<SyncAnnouncement announcement={announcement} />
		</div>
	);
}
