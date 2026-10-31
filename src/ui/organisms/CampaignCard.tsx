import { PhaseProgress } from '../atoms/PhaseProgress';
import { CampaignTaskRow } from '../molecules/CampaignTaskRow';
import type { CampaignCardView } from '../presenters/campaignView';

export interface CampaignCardProps {
	readonly view: CampaignCardView;
	/** Title of the task being sent right now, or `null`. */
	readonly sendingTitle: string | null;
	readonly onOpen: () => void;
	readonly onSend: (taskTitle: string) => void;
}

/**
 * One campaign (S5): name and kind, the "detenida" stamp when stale, the open phase with
 * its bar, the next step and, folded, its tasks. The name opens the note.
 */
export function CampaignCard({ view, sendingTitle, onOpen, onSend }: CampaignCardProps) {
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
					<span className="dromos-stamp">Detenida · {view.stale.days === 1 ? '1 día' : `${view.stale.days} días`}</span>
				) : null}
			</header>
			<p className="dromos-campaign-next">
				<span className="dromos-campaign-next-label">Siguiente:</span> {view.next ?? 'Nada pendiente'}
			</p>
			<PhaseProgress percent={view.progress.percent} label={`Progreso de ${view.title}`} />
			{view.warnings.map((warning) => (
				<p key={warning} className="dromos-campaign-warning" role="status">
					{warning}
				</p>
			))}
			{view.tasks.length > 0 ? (
				<details className="dromos-campaign-tasks">
					<summary>{view.tasks.length === 1 ? '1 tarea' : `${view.tasks.length} tareas`}</summary>
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
