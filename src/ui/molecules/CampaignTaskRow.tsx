import { HandDrawnCheck } from '../atoms/HandDrawnCheck';
import { SendButton } from '../atoms/SendButton';
import { useT } from '../i18n';
import type { CampaignTaskView } from '../presenters/campaignScreenView';

export interface CampaignTaskRowProps {
	readonly row: CampaignTaskView;
	/** True while this task is being sent to Habitica. */
	readonly sending: boolean;
	readonly onSend: () => void;
}

/**
 * One task of a campaign (game-ui S8): the hand-drawn circle, checked and struck through once
 * done, its title, its state chip and, when it can go to Habitica, the send button. The circle
 * is a status, not a button: Dromos does not complete tasks.
 */
export function CampaignTaskRow({ row, sending, onSend }: CampaignTaskRowProps) {
	const t = useT();
	return (
		<li className={row.completed ? 'dromos-task is-completed' : 'dromos-task'}>
			<HandDrawnCheck completed={row.completed} />
			<span className="dromos-task-body">
				<span className="dromos-task-title">{row.title}</span>
				<span className="dromos-task-chips">
					<span className={`dromos-task-chip is-${row.chip.tone}`}>{row.chip.label}</span>
				</span>
			</span>
			{row.canSend ? <SendButton sending={sending} onSend={onSend} label={t('task.send')} sendingLabel={t('task.sending')} /> : null}
		</li>
	);
}
