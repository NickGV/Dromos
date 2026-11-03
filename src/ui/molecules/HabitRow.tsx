import { PhaseProgress } from '../atoms/PhaseProgress';
import { useT } from '../i18n';
import type { HabitRowView } from '../presenters/campaignView';

export interface HabitRowProps {
	readonly row: HabitRowView;
	/** True while this habit is being sent to Habitica. */
	readonly sending: boolean;
	readonly onSend: () => void;
}

/** One habit of a campaign (S8): its streak over its target days and, when never sent, the send button. */
export function HabitRow({ row, sending, onSend }: HabitRowProps) {
	const t = useT();
	return (
		<li className={`dromos-habit is-${row.state}`}>
			<div className="dromos-habit-head">
				<span className="dromos-habit-title">{row.title}</span>
				{row.state === 'missing' ? <span className="dromos-chip is-warning">{t('task.missing')}</span> : null}
				{row.state === 'unsent' ? <span className="dromos-chip">{t('task.unsent')}</span> : null}
				{row.canSend ? (
					<button type="button" className="dromos-send-button" aria-disabled={sending} aria-busy={sending} onClick={sending ? undefined : onSend}>
						{sending ? (
							<>
								<span className="dromos-spinner" aria-hidden="true" />
								{t('task.sending')}
							</>
						) : (
							t('task.send')
						)}
					</button>
				) : null}
			</div>
			<span className="dromos-habit-text">{row.text}</span>
			<PhaseProgress percent={row.progress.percent} label={`${row.title}: ${row.text}`} />
		</li>
	);
}
