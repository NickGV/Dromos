import { HandDrawnCheck } from '../atoms/HandDrawnCheck';
import { useT } from '../i18n';
import type { QuestPanelRowView } from '../presenters/questListView';
import { SubtaskList, SubtasksToggle } from './Subtasks';

/**
 * One quest row: the drawn circle, with its check and a struck title once completed, and the
 * chips under the title. Not a button: Dromos does not complete quests (game-ui L2).
 */
export function QuestItem({ row, onToggleSubtasks }: { readonly row: QuestPanelRowView; readonly onToggleSubtasks?: () => void }) {
	const t = useT();
	return (
		<li className={row.completed ? 'dromos-quest is-completed' : 'dromos-quest'}>
			<HandDrawnCheck completed={row.completed} />
			<span className="dromos-quest-body">
				<span className="dromos-quest-title">
					{row.title}
					{row.completed ? <span className="dromos-visually-hidden">{t('quests.completed')}</span> : null}
				</span>
				<span className="dromos-quest-chips">
					{row.chips.map((chip, index) => (
						<span key={`${index}:${chip.label}`} className={chip.kind === 'due' ? `dromos-quest-chip is-due is-${chip.tone}` : `dromos-quest-chip is-${chip.kind}`}>
							{chip.label}
						</span>
					))}
				</span>
				{row.subtasks ? <SubtaskList view={row.subtasks} /> : null}
			</span>
			{row.subtasks ? <SubtasksToggle view={row.subtasks} onToggle={onToggleSubtasks} /> : null}
		</li>
	);
}
