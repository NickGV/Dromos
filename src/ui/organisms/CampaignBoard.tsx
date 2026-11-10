import { useT } from '../i18n';
import { CampaignHomeCard } from '../molecules/CampaignHomeCard';
import type { CampaignHomeCardView } from '../presenters/campaignHomeView';
import type { CampaignListView } from '../presenters/campaignView';

export interface CampaignBoardProps {
	/** The list's empty state and notice. */
	readonly list: CampaignListView;
	readonly cards: readonly CampaignHomeCardView[];
	/** The paths of the campaigns whose cards are open; every other card is folded (home-fit S1). */
	readonly open: ReadonlySet<string>;
	/** Starts the ids of the cards' roads, unique to the open view. */
	readonly idPrefix: string;
	/** Opens or folds the card of the campaign at `path`. */
	readonly onToggle: (path: string) => void;
	/** Opens the campaigns screen on the campaign at `path`. */
	readonly onOpen: (path: string) => void;
}

/**
 * The campaigns on the home screen (game-ui S7): the section title, a notice when Habitica's
 * progress is not fresh, and one card per campaign, folded to one row until opened (home-fit S1).
 * Their tasks, habits and send buttons live on the campaigns screen.
 */
export function CampaignBoard({ list, cards, open, idPrefix, onToggle, onOpen }: CampaignBoardProps) {
	const t = useT();
	return (
		<section className="dromos-section dromos-campaigns" aria-label={t('campaign.title')}>
			<h2 className="dromos-card-title">{t('campaign.title')}</h2>
			{list.notice ? <p className="dromos-campaign-notice">{list.notice}</p> : null}
			{list.emptyText ? (
				<p className="dromos-panel dromos-section-empty">{list.emptyText}</p>
			) : (
				<div className="dromos-campaign-cards">
					{cards.map((card, index) => (
						<CampaignHomeCard key={card.path} view={card} open={open.has(card.path)} cardId={`${idPrefix}-${index}`} onToggle={onToggle} onOpen={onOpen} />
					))}
				</div>
			)}
		</section>
	);
}
