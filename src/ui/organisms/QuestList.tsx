import { ListToggle } from '../atoms/ListToggle';
import { useT } from '../i18n';
import { QuestItem } from '../molecules/QuestItem';
import type { QuestFilter, QuestPanelView } from '../presenters/questListView';

/**
 * Today's quests (game-ui S6): the section title, then one panel with the header line about the
 * dailies and one list, dailies first, or an empty state. A quiet note under the panel says where
 * quests are completed, since its rows are not buttons (game-ui S14).
 */
export interface QuestListProps {
	readonly view: QuestPanelView;
	/** Expands or folds the long list (missions S3). */
	readonly onToggleMore?: () => void;
	/** Opens or folds the subtasks of the mission with this id (missions S5). */
	readonly onToggleSubtasks?: (questId: string) => void;
	/** Shows only the quests of this filter (missions S6). */
	readonly onFilter?: (filter: QuestFilter) => void;
}

export function QuestList({ view, onToggleMore, onToggleSubtasks, onFilter }: QuestListProps) {
	const t = useT();
	return (
		<section className="dromos-section dromos-quests" aria-label={t('quests.title')}>
			<h2 className="dromos-card-title">{t('quests.title')}</h2>
			{view.filters ? (
				<div className="dromos-quest-filters" role="group" aria-label={view.filters.label}>
					{view.filters.options.map((option) => (
						<button key={option.id} type="button" className={option.selected ? 'dromos-quest-filter is-selected' : 'dromos-quest-filter'} aria-pressed={option.selected} onClick={() => onFilter?.(option.id)}>
							{option.label} <span className="dromos-quest-filter-count">{option.count}</span>
						</button>
					))}
				</div>
			) : null}
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
						{view.filteredEmptyText ? (
							<p className="dromos-empty">{view.filteredEmptyText}</p>
						) : (
							<ul className="dromos-quest-items">
								{view.rows.map((row) => (
									<QuestItem key={row.id} row={row} onToggleSubtasks={() => onToggleSubtasks?.(row.id)} />
								))}
							</ul>
						)}
						{view.more ? <ListToggle view={view.more} onToggle={onToggleMore} /> : null}
					</>
				)}
			</div>
			<p className="dromos-quest-note">{t('quests.note')}</p>
		</section>
	);
}
