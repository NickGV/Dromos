import type { CampaignListView } from '../presenters/campaignView';
import type { LinkOutcomeView } from '../presenters/linkOutcomeView';
import { useT } from '../i18n';
import { CampaignCard, type Sending } from './CampaignCard';

export interface CampaignListProps {
	readonly view: CampaignListView;
	readonly sending: Sending | null;
	/** Result of the last "Enviar a Habitica" and the campaign it belongs to, or `null`. */
	readonly message: (LinkOutcomeView & { readonly path: string }) | null;
	readonly onOpen: (path: string) => void;
	readonly onSend: (path: string, taskTitle: string) => void;
	readonly onSendHabit: (path: string, habitTitle: string) => void;
}

/** Active campaigns (S5), or an empty state, with a notice when Habitica's progress is not fresh. */
export function CampaignList({ view, sending, message, onOpen, onSend, onSendHabit }: CampaignListProps) {
	const t = useT();
	return (
		<section className="dromos-card dromos-campaigns" aria-label={t('campaign.title')}>
			<h2 className="dromos-card-title">{t('campaign.title')}</h2>
			{view.notice ? <p className="dromos-campaign-notice">{view.notice}</p> : null}
			{view.emptyText ? (
				<p className="dromos-empty">{view.emptyText}</p>
			) : (
				<div className="dromos-campaign-items">
					{view.cards.map((card) => (
						<CampaignCard
							key={card.path}
							view={card}
							sending={sending}
							message={message?.path === card.path ? message : null}
							onOpen={() => onOpen(card.path)}
							onSend={(taskTitle) => onSend(card.path, taskTitle)}
							onSendHabit={(habitTitle) => onSendHabit(card.path, habitTitle)}
						/>
					))}
				</div>
			)}
			{view.emptyText ? null : <p className="dromos-campaign-footer">{view.footer}</p>}
		</section>
	);
}
