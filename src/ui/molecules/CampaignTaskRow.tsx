import type { TaskRowView } from '../presenters/campaignView';

export interface CampaignTaskRowProps {
	readonly row: TaskRowView;
	/** True while this task is being sent to Habitica. */
	readonly sending: boolean;
	readonly onSend: () => void;
}

/** One task of a campaign: its state, its title and, when it can go to Habitica, the send button. */
export function CampaignTaskRow({ row, sending, onSend }: CampaignTaskRowProps) {
	return (
		<li className={`dromos-campaign-task is-${row.state}`}>
			<span className="dromos-quest-check" aria-hidden="true" />
			<span className="dromos-campaign-task-title">
				{row.title}
				{row.state === 'completed' ? <span className="dromos-visually-hidden"> (completada)</span> : null}
			</span>
			{row.state === 'missing' ? <span className="dromos-chip is-warning">No encontrada en Habitica</span> : null}
			{row.state === 'unsent' ? <span className="dromos-chip">Sin vincular</span> : null}
			{row.canSend ? (
				<button type="button" className="dromos-send-button" disabled={sending} aria-busy={sending} onClick={onSend}>
					{sending ? (
						<>
							<span className="dromos-spinner" aria-hidden="true" />
							Enviando…
						</>
					) : (
						'Enviar a Habitica'
					)}
				</button>
			) : null}
		</li>
	);
}
