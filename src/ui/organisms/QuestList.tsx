import { QuestItem } from '../molecules/QuestItem';
import type { QuestListView, QuestRowView } from '../presenters/questListView';

/** Today's quests (S8): dailies first, then to-dos, or an empty state. */
export function QuestList({ view }: { readonly view: QuestListView }) {
	return (
		<section className="dromos-card dromos-quests" aria-label="Quests de hoy">
			<h2 className="dromos-card-title">Quests de hoy</h2>
			{view.emptyText ? (
				<p className="dromos-empty">{view.emptyText}</p>
			) : (
				<>
					<QuestGroup heading="Diarias" rows={view.dailies} />
					<QuestGroup heading="Pendientes" rows={view.todos} />
				</>
			)}
		</section>
	);
}

function QuestGroup({ heading, rows }: { readonly heading: string; readonly rows: readonly QuestRowView[] }) {
	if (rows.length === 0) return null;
	return (
		<div className="dromos-quest-group">
			<h3 className="dromos-quest-group-title">{heading}</h3>
			<ul className="dromos-quest-items">
				{rows.map((row) => (
					<QuestItem key={row.id} row={row} />
				))}
			</ul>
		</div>
	);
}
