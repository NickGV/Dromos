import { useT } from '../i18n';
import type { QuestRowView } from '../presenters/questListView';

/** One quest row: a circle, the title (struck through when completed) and the due label of a to-do. */
export function QuestItem({ row }: { readonly row: QuestRowView }) {
	const t = useT();
	return (
		<li className={row.completed ? 'dromos-quest is-completed' : 'dromos-quest'}>
			<span className="dromos-quest-check" aria-hidden="true" />
			<span className="dromos-quest-title">
				{row.title}
				{row.completed ? <span className="dromos-visually-hidden">{t('quests.completed')}</span> : null}
			</span>
			{row.due ? <span className={`dromos-quest-due is-${row.due.tone}`}>{row.due.label}</span> : null}
		</li>
	);
}
