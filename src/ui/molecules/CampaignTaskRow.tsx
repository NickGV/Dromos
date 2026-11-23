import { HandDrawnCheck } from '../atoms/HandDrawnCheck';
import { LinkButton } from '../atoms/LinkButton';
import { SendButton } from '../atoms/SendButton';
import { useT } from '../i18n';
import type { CampaignTaskView } from '../presenters/campaignScreenView';
import { SubtaskList, SubtasksToggle } from './Subtasks';

export interface CampaignTaskRowProps {
	readonly row: CampaignTaskView;
	/** True while this task is being sent to Habitica. */
	readonly sending: boolean;
	/** True while this task is being linked to an open to-do (link-existing-todo S3). */
	readonly linking?: boolean;
	/** "Send to Habitica", or "Send again" on a task Habitica confirmed deleted: the parent knows which from the row. */
	readonly onSend: () => void;
	/** "Link existing": opens the picker of open to-dos for this task. */
	readonly onLink?: () => void;
	/** Opens or folds a mission's subtasks (missions S5). */
	readonly onToggleSubtasks?: () => void;
}

/**
 * One task of a campaign (game-ui S8): the hand-drawn circle, checked and struck through once
 * done, its title, its state chip and, when it can go to Habitica, the send button, which reads
 * "Send again" on a task Habitica confirmed deleted (ADR-021), followed by "Link existing" when the
 * task can be linked to an open to-do (link-existing-todo S3). While either runs, both ignore clicks.
 * The circle is a status, not a button: Dromos does not complete tasks.
 */
export function CampaignTaskRow({ row, sending, linking = false, onSend, onLink, onToggleSubtasks }: CampaignTaskRowProps) {
	const t = useT();
	return (
		<li className={row.completed ? 'dromos-task is-completed' : 'dromos-task'}>
			<HandDrawnCheck completed={row.completed} />
			<span className="dromos-task-body">
				<span className="dromos-task-title">{row.title}</span>
				<span className="dromos-task-chips">
					<span className={`dromos-task-chip is-${row.chip.tone}`}>{row.chip.label}</span>
					{row.mission ? <span className="dromos-task-chip is-mission">{row.mission}</span> : null}
				</span>
				{row.subtasks ? <SubtaskList view={row.subtasks} /> : null}
			</span>
			{row.subtasks ? <SubtasksToggle view={row.subtasks} onToggle={onToggleSubtasks} /> : null}
			{row.canSend || row.canResend ? (
				<SendButton sending={sending} disabled={linking} onSend={onSend} label={t(row.canResend ? 'task.resend' : 'task.send')} sendingLabel={t('task.sending')} />
			) : null}
			{row.canLink && onLink ? <LinkButton busy={linking} disabled={linking || sending} onLink={onLink} label={t('task.link')} busyLabel={t('task.linking')} /> : null}
		</li>
	);
}
