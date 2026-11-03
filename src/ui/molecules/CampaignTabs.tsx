import type { CampaignTabView } from '../presenters/campaignScreenView';

export interface CampaignTabsProps {
	/** "Choose a campaign". */
	readonly label: string;
	readonly tabs: readonly CampaignTabView[];
	/** Shows the campaign at `path`; it changes what is shown, nothing is fetched. */
	readonly onSelect: (path: string) => void;
}

/** One pill per campaign (game-ui S8), the one on show pressed. */
export function CampaignTabs({ label, tabs, onSelect }: CampaignTabsProps) {
	return (
		<div className="dromos-campaign-tabs" role="group" aria-label={label}>
			{tabs.map((tab) => (
				<button key={tab.path} type="button" className="dromos-tab" aria-pressed={tab.selected} onClick={() => onSelect(tab.path)}>
					{tab.title}
				</button>
			))}
		</div>
	);
}
