import { HandDrawnCheck } from '../atoms/HandDrawnCheck';
import { useT } from '../i18n';
import type { SubtasksView } from '../presenters/missionView';

/**
 * The chevron that opens or folds a mission's subtasks (missions S5). `clickable-icon` is Obsidian's
 * icon button: its padded button rules skip it, and on tablets they would leave the icon no room.
 */
export function SubtasksToggle({ view, onToggle }: { readonly view: SubtasksView; readonly onToggle?: () => void }) {
	return (
		<button type="button" className="clickable-icon dromos-subtasks-toggle" aria-expanded={view.open} aria-label={view.toggleLabel} onClick={onToggle}>
			<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
				<path d="M6 4l4 4-4 4" />
			</svg>
		</button>
	);
}

/** An open mission's subtasks, each with the drawn circle, checked and struck through once done. Not buttons. */
export function SubtaskList({ view }: { readonly view: SubtasksView }) {
	const t = useT();
	if (!view.open) return null;
	return (
		<ul className="dromos-subtasks">
			{view.items.map((item, index) => (
				<li key={`${index}:${item.title}`} className={item.completed ? 'dromos-subtask is-completed' : 'dromos-subtask'}>
					<HandDrawnCheck completed={item.completed} />
					<span className="dromos-subtask-title">
						{item.title}
						{item.completed ? <span className="dromos-visually-hidden">{t('quests.completed')}</span> : null}
					</span>
				</li>
			))}
		</ul>
	);
}
