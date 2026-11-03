import { useT } from '../i18n';
import { QuestItem } from '../molecules/QuestItem';
import type { QuestPanelView } from '../presenters/questListView';

/**
 * Today's quests (game-ui S6): the section title, then one panel with the header line about the
 * dailies and one list, dailies first, or an empty state. A quiet note under the panel says where
 * quests are completed, since its rows are not buttons (game-ui S14).
 */
export function QuestList({ view }: { readonly view: QuestPanelView }) {
	const t = useT();
	return (
		<section className="dromos-section dromos-quests" aria-label={t('quests.title')}>
			<h2 className="dromos-card-title">{t('quests.title')}</h2>
			<div className="dromos-panel dromos-quest-panel">
				{view.emptyText ? (
					<p className="dromos-empty">{view.emptyText}</p>
				) : (
					<>
						{view.doneText !== null || view.gainText !== null ? (
							<p className="dromos-quest-header">
								<span>{view.doneText}</span>
								<span>{view.gainText}</span>
							</p>
						) : null}
						<ul className="dromos-quest-items">
							{view.rows.map((row) => (
								<QuestItem key={row.id} row={row} />
							))}
						</ul>
					</>
				)}
			</div>
			<p className="dromos-quest-note">{t('quests.note')}</p>
		</section>
	);
}
