import { ListToggle } from '../atoms/ListToggle';
import { CampaignHeaderPanel } from '../molecules/CampaignHeaderPanel';
import { CampaignRoad } from '../molecules/CampaignRoad';
import { CampaignTabs } from '../molecules/CampaignTabs';
import { CampaignTaskRow } from '../molecules/CampaignTaskRow';
import { HabitRow } from '../molecules/HabitRow';
import type { CampaignScreenView } from '../presenters/campaignScreenView';
import type { LinkOutcomeView } from '../presenters/linkOutcomeView';

/** A task or a habit on its way to Habitica; their titles are told apart by the kind. */
export interface Sending {
	readonly kind: 'task' | 'habit';
	readonly title: string;
}

export interface CampaignScreenProps {
	readonly view: CampaignScreenView;
	/** What is being sent right now, or `null`. */
	readonly sending: Sending | null;
	/** Result of the last "Send to Habitica" on the campaign shown, or `null`. */
	readonly message: LinkOutcomeView | null;
	/** Shows another campaign. */
	readonly onSelect: (path: string) => void;
	readonly onOpenNote: (path: string) => void;
	readonly onSend: (taskTitle: string) => void;
	readonly onSendHabit: (habitTitle: string) => void;
	/** Expands or folds the phase panel with this key (missions S3). */
	readonly onToggleGroup?: (groupKey: string) => void;
	/** Opens or folds the subtasks of the mission with this title (missions S5). */
	readonly onToggleMission?: (taskTitle: string) => void;
}

/**
 * The campaigns screen under its header card (game-ui S8): a tab per campaign, the header panel
 * of the one shown, its path, its tasks by phase and its habits, with its notices and problems.
 */
export function CampaignScreen({ view, sending, message, onSelect, onOpenNote, onSend, onSendHabit, onToggleGroup, onToggleMission }: CampaignScreenProps) {
	const { campaign } = view;
	return (
		<div className="dromos-campaign-screen dromos-campaigns">
			{view.notice ? <p className="dromos-campaign-notice">{view.notice}</p> : null}
			{view.emptyText ? <p className="dromos-panel dromos-section-empty">{view.emptyText}</p> : null}
			{view.tabs.length > 0 ? <CampaignTabs label={view.tabsLabel} tabs={view.tabs} onSelect={onSelect} /> : null}
			{campaign ? (
				<>
					<div className="dromos-campaign-lead">
						<CampaignHeaderPanel view={campaign} onOpenNote={onOpenNote} />
						{message ? (
							<p className={`dromos-campaign-message is-${message.tone}`} role="status" aria-live="polite">
								{message.message}
							</p>
						) : null}
						{campaign.warnings.map((warning) => (
							<p key={warning} className="dromos-campaign-warning" role="status">
								{warning}
							</p>
						))}
					</div>
					<section className="dromos-section">
						<h3 className="dromos-card-title">{campaign.pathTitle}</h3>
						<div className="dromos-panel dromos-path-panel">
							<CampaignRoad road={campaign.road} label={campaign.roadProgress.label} percent={campaign.roadProgress.percent} valueText={campaign.roadProgress.valueText} size="wide" />
						</div>
					</section>
					{campaign.groups.length > 0 ? (
						<section className="dromos-section">
							<h3 className="dromos-card-title">{campaign.tasksTitle}</h3>
							<div className="dromos-task-groups">
								{campaign.groups.map((group) => (
									<div key={group.key} className="dromos-panel dromos-task-group">
										<div className="dromos-task-group-head">
											<h4 className="dromos-task-group-name">{group.name}</h4>
											<span className="dromos-task-group-count">{group.countText}</span>
										</div>
										<ul className="dromos-task-list">
											{group.tasks.map((row, index) => (
												<CampaignTaskRow
														key={`${index}:${row.title}`}
														row={row}
														sending={sending?.kind === 'task' && sending.title === row.title}
														onSend={() => onSend(row.title)}
														onToggleSubtasks={() => onToggleMission?.(row.title)}
													/>
											))}
										</ul>
										{group.more ? <ListToggle view={group.more} onToggle={() => onToggleGroup?.(group.key)} /> : null}
									</div>
								))}
							</div>
						</section>
					) : null}
					{campaign.habits.length > 0 ? (
						<section className="dromos-section">
							<h3 className="dromos-card-title">{campaign.habitsTitle}</h3>
							<ul className="dromos-panel dromos-habit-list">
								{campaign.habits.map((row, index) => (
									<HabitRow key={`${index}:${row.title}`} row={row} sending={sending?.kind === 'habit' && sending.title === row.title} onSend={() => onSendHabit(row.title)} />
								))}
							</ul>
						</section>
					) : null}
				</>
			) : null}
		</div>
	);
}
