import { PhaseProgress } from '../atoms/PhaseProgress';
import { SendButton } from '../atoms/SendButton';
import { useT } from '../i18n';
import type { HabitRowView } from '../presenters/campaignView';

export interface HabitRowProps {
	readonly row: HabitRowView;
	/** True while this habit is being sent to Habitica. */
	readonly sending: boolean;
	/** "Send to Habitica", or "Send again" on a daily Habitica confirmed deleted: the parent knows which from the row. */
	readonly onSend: () => void;
}

/**
 * One daily of a campaign or of an area (S8, ADR-021): its days and its checklist count, its streak
 * (over its target days, when it has one), and the send button while never sent, or "Send again"
 * once Habitica confirmed it deleted. A routine, with no target, has no bar.
 */
export function HabitRow({ row, sending, onSend }: HabitRowProps) {
	const t = useT();
	return (
		<li className={`dromos-habit is-${row.state}`}>
			<div className="dromos-habit-head">
				<span className="dromos-habit-title">{row.title}</span>
				{row.state === 'deleted' ? <span className="dromos-chip is-warning">{t('task.deleted')}</span> : null}
				{row.state === 'missing' ? <span className="dromos-chip is-warning">{t('task.missing')}</span> : null}
				{row.state === 'unsent' && !row.canSend ? <span className="dromos-chip">{t('task.unsent')}</span> : null}
				{row.canSend || row.canResend ? (
					<SendButton sending={sending} onSend={onSend} label={t(row.canResend ? 'task.resend' : 'task.send')} sendingLabel={t('task.sending')} />
				) : null}
			</div>
			<span className="dromos-habit-meta">
				<span>{row.schedule}</span>
				{row.items ? <span>{row.items}</span> : null}
			</span>
			<span className="dromos-habit-text">{row.text}</span>
			{row.progress ? <PhaseProgress percent={row.progress.percent} label={`${row.title}: ${row.text}`} /> : null}
		</li>
	);
}
