import type { BannerTone } from '../presenters/syncBanner';
import type { CampaignListView } from '../presenters/campaignView';
import { CampaignCard } from './CampaignCard';

export interface CampaignListProps {
	readonly view: CampaignListView;
	readonly sendingTitle: string | null;
	/** Result of the last "Enviar a Habitica", or `null`. */
	readonly message: { readonly tone: BannerTone; readonly message: string } | null;
	readonly onOpen: (path: string) => void;
	readonly onSend: (path: string, taskTitle: string) => void;
}

/** Active campaigns (S5), or an empty state, with a notice when Habitica's progress is not fresh. */
export function CampaignList({ view, sendingTitle, message, onOpen, onSend }: CampaignListProps) {
	return (
		<section className="dromos-card dromos-campaigns" aria-label="Campañas">
			<h2 className="dromos-card-title">Campañas</h2>
			{view.notice ? <p className="dromos-campaign-notice">{view.notice}</p> : null}
			{message ? (
				<p className={`dromos-campaign-message is-${message.tone}`} role="status" aria-live="polite">
					{message.message}
				</p>
			) : null}
			{view.emptyText ? (
				<p className="dromos-empty">{view.emptyText}</p>
			) : (
				<div className="dromos-campaign-items">
					{view.cards.map((card) => (
						<CampaignCard
							key={card.path}
							view={card}
							sendingTitle={sendingTitle}
							onOpen={() => onOpen(card.path)}
							onSend={(taskTitle) => onSend(card.path, taskTitle)}
						/>
					))}
				</div>
			)}
			{view.emptyText ? null : <p className="dromos-campaign-footer">{view.footer}</p>}
		</section>
	);
}
