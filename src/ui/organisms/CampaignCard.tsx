import { plural } from '../../i18n';
import { PhaseProgress } from '../atoms/PhaseProgress';
import { useT } from '../i18n';
import { CampaignTaskRow } from '../molecules/CampaignTaskRow';
import type { CampaignCardView } from '../presenters/campaignView';
import type { LinkOutcomeView } from '../presenters/linkOutcomeView';

export interface CampaignCardProps {
	readonly view: CampaignCardView;
	/** Title of the task being sent right now, or `null`. */
	readonly sendingTitle: string | null;
	/** Result of the last "Enviar a Habitica" on this campaign, or `null`. */
	readonly message: LinkOutcomeView | null;
	readonly onOpen: () => void;
	readonly onSend: (taskTitle: string) => void;
}

/**
 * One campaign (S5): name and kind, the "detenida" stamp when stale, the open phase with
 * its bar, the next step and, folded, its tasks. The name opens the note.
 */
export function CampaignCard({ view, sendingTitle, message, onOpen, onSend }: CampaignCardProps) {
	const t = useT();
	return (
		<article className={view.stale ? 'dromos-campaign is-stale' : 'dromos-campaign'}>
			<header className="dromos-campaign-head">
				<h3 className="dromos-campaign-title">
					<button type="button" className="dromos-link-button" onClick={onOpen}>
						{view.title}
					</button>
				</h3>
				<span className="dromos-chip">{view.kindLabel}</span>
				<span className="dromos-chip is-mono">{view.chip}</span>
				{view.stale ? (
					<span className="dromos-stamp">{plural(t, 'campaign.stalled', view.stale.days)}</span>
				) : null}
			</header>
			<p className="dromos-campaign-next">
				<span className="dromos-campaign-next-label">{t('campaign.next')}</span> {view.next ?? t('campaign.next.none')}
			</p>
			{message ? (
				<p className={`dromos-campaign-message is-${message.tone}`} role="status" aria-live="polite">
					{message.message}
				</p>
			) : null}
			<PhaseProgress percent={view.progress.percent} label={t('campaign.progress.aria', { title: view.title })} />
			{view.warnings.map((warning) => (
				<p key={warning} className="dromos-campaign-warning" role="status">
					{warning}
				</p>
			))}
			{view.tasks.length > 0 ? (
				<details className="dromos-campaign-tasks">
					<summary>{plural(t, 'campaign.tasks', view.tasks.length)}</summary>
					<ul className="dromos-campaign-task-list">
						{view.tasks.map((row, index) => (
							<CampaignTaskRow
								key={`${row.title}-${index}`}
								row={row}
								sending={sendingTitle === row.title}
								onSend={() => onSend(row.title)}
							/>
						))}
					</ul>
				</details>
			) : null}
		</article>
	);
}
