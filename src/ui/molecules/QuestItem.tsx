import { useT } from '../i18n';
import type { QuestPanelRowView } from '../presenters/questListView';

/** The design's hand-drawn circle, and the check drawn into it (game-ui S6). */
const CIRCLE = 'M13 2.5c5.8-.3 10.6 4.4 10.4 10.4-.2 5.9-4.8 10.5-10.6 10.3C7 23 2.4 18.4 2.6 12.9 2.8 7 7.4 2.7 13 2.5z';
const TICK = 'M8 13.5l3.5 3.5L18.5 9';

/**
 * One quest row: the drawn circle, with its check and a struck title once completed, and the
 * chips under the title. Not a button: Dromos does not complete quests (game-ui L2).
 */
export function QuestItem({ row }: { readonly row: QuestPanelRowView }) {
	const t = useT();
	return (
		<li className={row.completed ? 'dromos-quest is-completed' : 'dromos-quest'}>
			<svg className="dromos-quest-mark" viewBox="0 0 26 26" width="28" height="28" aria-hidden="true" focusable="false">
				<path className="dromos-quest-circle" d={CIRCLE} />
				{row.completed ? <path className="dromos-quest-tick" d={TICK} strokeDasharray="22" /> : null}
			</svg>
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
			</span>
		</li>
	);
}
