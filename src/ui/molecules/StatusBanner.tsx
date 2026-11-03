import { SyncAnnouncement } from '../atoms/SyncAnnouncement';
import type { SyncBannerView } from '../presenters/syncBanner';

/**
 * The sync status (S8): a quiet line, or a band when the user has something to do; the tone
 * only changes its accent color. The visible
 * text carries the time, which changes every minute, so a hidden live region announces only
 * the status: a screen reader hears a change of status, not the clock. `quiet` hides the visible
 * text but keeps the same live region mounted in its slot, so a change of status (syncing to
 * offline) is a change of its text, which screen readers announce (game-ui S12, S14).
 */
export function StatusBanner({ tone, message, detail, announcement, prominent, quiet = false }: SyncBannerView & { readonly quiet?: boolean }) {
	return (
		<div className={quiet ? 'dromos-banner is-quiet' : `dromos-banner is-${tone}${prominent ? ' is-prominent' : ''}`}>
			{quiet ? null : <span className="dromos-banner-message">{message}</span>}
			{!quiet && detail ? <span className="dromos-banner-detail">{detail}</span> : null}
			<SyncAnnouncement announcement={announcement} />
		</div>
	);
}
