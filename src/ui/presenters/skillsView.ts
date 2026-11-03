import type { GameSnapshot, RecentEntry, SkillEntry } from '../../application';
import type { RequirementProgress } from '../../domain';
import { plural, type Translator } from '../../i18n';
import { statLabel, xpBarView, type XpBarView } from './characterCardView';
import { dayMonth } from './dates';

export interface RequirementRowView {
	readonly text: string;
	/** Pending or confirmed, for requirements a person confirms; `null` for the counted ones. */
	readonly detail: string | null;
	readonly met: boolean;
	/** Whole percent, 0..100. */
	readonly percent: number;
}

/** One skill as the Skills page shows it. A locked skill has no level, no XP bar and no rank. */
export interface SkillCardView {
	readonly id: string;
	readonly icon: string;
	readonly name: string;
	readonly statLabel: string;
	readonly description: string;
	readonly unlocked: boolean;
	/** The level of an earned skill, for its medallion; `null` while locked. */
	readonly level: number | null;
	readonly levelText: string | null;
	readonly rankName: string | null;
	readonly rankDescription: string | null;
	/** The line under the medallion: the rank of an earned skill, the unmet requirement closest to done of a locked one. */
	readonly caption: string | null;
	readonly xp: XpBarView | null;
	/** What is still asked (locked skills); empty once earned. */
	readonly requirements: readonly RequirementRowView[];
	/** How close the skill is to unlocking, whole percent; 100 once earned. */
	readonly progressPercent: number;
	readonly earnedText: string | null;
	/**
	 * The skill's last ledger rows, newest first, as raw values (game-ui S9). `skillsPageView` always
	 * sets it; it is optional only so cards built by hand stay valid.
	 */
	readonly recent?: readonly RecentEntry[];
}

/** What the Skills section shows (S5). */
export interface SkillsPageView {
	readonly title: string;
	/** Why there is nothing to list, or `null` when there is. */
	readonly emptyText: string | null;
	/** A warning above the list, or `null`. */
	readonly notice: string | null;
	readonly earned: readonly SkillCardView[];
	readonly locked: readonly SkillCardView[];
	/** Skill notes and ledger rows that could not be read. */
	readonly problems: readonly string[];
}

/** Unreadable ledger rows listed one by one; the rest are counted. */
const MAX_LISTED_ROWS = 5;

export function skillsPageView(snapshot: GameSnapshot, t: Translator): SkillsPageView {
	const entries = snapshot.skills ?? [];
	const earned = entries
		.filter((entry) => entry.skill.unlocked)
		.sort((left, right) => right.standing.level - left.standing.level || left.skill.name.localeCompare(right.skill.name))
		.map((entry) => cardOf(entry, t));
	const locked = entries
		.filter((entry) => !entry.skill.unlocked)
		.map((entry) => cardOf(entry, t))
		.sort((left, right) => right.progressPercent - left.progressPercent || left.name.localeCompare(right.name));
	return {
		title: t('skills.title'),
		emptyText: emptyText(snapshot, t),
		notice: snapshot.status.kind === 'error' && snapshot.skills !== null ? t('skills.notice.error') : null,
		earned,
		locked,
		problems: problemsOf(snapshot, t),
	};
}

function emptyText(snapshot: GameSnapshot, t: Translator): string | null {
	if (snapshot.skills === null) {
		if (snapshot.status.kind === 'syncing') return t('skills.loading');
		if (snapshot.status.kind === 'no-character') return t('skills.noCharacter');
		return t('skills.empty.beforeSync');
	}
	return snapshot.skills.length === 0 ? t('skills.empty.none') : null;
}

function cardOf(entry: SkillEntry, t: Translator): SkillCardView {
	const { skill, standing, rank } = entry;
	const requirements = skill.unlocked ? [] : entry.requirements.map((item) => requirementRow(item, t));
	const rankName = skill.unlocked ? (rank?.name ?? null) : null;
	return {
		id: skill.id,
		icon: skill.icon,
		name: skill.name,
		statLabel: statLabel(skill.stat, t),
		description: skill.description,
		unlocked: skill.unlocked,
		level: skill.unlocked ? standing.level : null,
		levelText: skill.unlocked ? t('skills.level', { level: standing.level }) : null,
		rankName,
		rankDescription: skill.unlocked ? (rank?.description ?? null) : null,
		caption: skill.unlocked ? rankName : closestRequirement(requirements),
		xp: skill.unlocked && standing.xpToNext !== null ? xpBarView(standing.xpIntoLevel, standing.xpToNext) : null,
		requirements,
		progressPercent: skill.unlocked ? 100 : meanPercent(requirements),
		earnedText: skill.unlocked && skill.unlockedOn !== null ? t('skills.earnedOn', { date: dayMonth(skill.unlockedOn, t) }) : null,
		recent: entry.recent,
	};
}

function requirementRow(item: RequirementProgress, t: Translator): RequirementRowView {
	const percent = item.total > 0 ? Math.round((item.done / item.total) * 100) : 0;
	const counts = { done: item.done, total: item.total };
	const { requirement } = item;
	switch (requirement.kind) {
		case 'quests':
			return { text: t('skills.req.quests', counts), detail: null, met: item.met, percent };
		case 'campaigns':
			return { text: t('skills.req.campaigns', counts), detail: null, met: item.met, percent };
		case 'habit':
			return { text: t('skills.req.habit', counts), detail: null, met: item.met, percent };
		case 'manual':
			return { text: requirement.text, detail: t(requirement.confirmed ? 'skills.req.manual.confirmed' : 'skills.req.manual.pending'), met: item.met, percent };
	}
}

// The first of the unmet requirements with the most done: what is nearest to unlocking the skill.
function closestRequirement(requirements: readonly RequirementRowView[]): string | null {
	let closest: RequirementRowView | null = null;
	for (const row of requirements) if (!row.met && (closest === null || row.percent > closest.percent)) closest = row;
	return closest?.text ?? null;
}

function meanPercent(requirements: readonly RequirementRowView[]): number {
	if (requirements.length === 0) return 0;
	return Math.round(requirements.reduce((sum, item) => sum + item.percent, 0) / requirements.length);
}

function problemsOf(snapshot: GameSnapshot, t: Translator): string[] {
	const problems = snapshot.invalidSkills.map((note) => t('skills.problem.note', { path: note.path, reason: note.reason }));
	if (snapshot.invalidRules !== null) problems.unshift(t('skills.problem.rules', { path: snapshot.invalidRules.path, fields: snapshot.invalidRules.fields.join(', ') }));
	for (const event of snapshot.unreadable.slice(0, MAX_LISTED_ROWS)) problems.push(t('skills.problem.ledger', { path: event.path, line: event.line }));
	const more = snapshot.unreadable.length - MAX_LISTED_ROWS;
	if (more > 0) problems.push(plural(t, 'skills.problem.ledgerMore', more));
	return problems;
}

/** One skill as a ring medallion (game-ui S9): the home row, and the grid of the Skills screen. */
export interface SkillRingView {
	readonly id: string;
	readonly name: string;
	readonly icon: string;
	readonly earned: boolean;
	/** The level badge of an earned skill; `null` while locked, which shows a lock. */
	readonly level: number | null;
	/** How much of the ring is drawn, whole percent: the level's progress once earned, the unlock's before. */
	readonly percent: number;
	/** "Level 2 · 40/160" (XP into the level) once earned; the closest requirement while locked. */
	readonly caption: string | null;
	/** The medallion button's name, its visible name first. */
	readonly ariaLabel: string;
}

export function skillRingView(card: SkillCardView, t: Translator): SkillRingView {
	const caption = card.unlocked ? earnedCaption(card, t) : card.caption;
	const parts = [card.name, card.unlocked ? null : t('skills.ring.locked'), caption].filter((part): part is string => part !== null);
	return {
		id: card.id,
		name: card.name,
		icon: card.icon,
		earned: card.unlocked,
		level: card.level,
		percent: card.unlocked ? (card.xp?.percent ?? 100) : card.progressPercent,
		caption,
		ariaLabel: parts.join(', '),
	};
}

// Without a next level on the curve the caption names the level alone.
function earnedCaption(card: SkillCardView, t: Translator): string | null {
	if (card.xp === null) return card.levelText;
	return t('skills.ring.caption', { level: card.level ?? 0, current: card.xp.current, total: card.xp.total });
}

/**
 * Whether a skill's icon is the name of one of the host app's icons, drawn by its icon set, such
 * as `book-open`: only lowercase letters, digits and dashes (game-ui S9). Anything else, an emoji
 * included, is shown as text.
 */
export function isIconName(icon: string): boolean {
	return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(icon);
}

/** One medallion of the Skills screen's grid: the ring, and whether it is the one in the detail. */
export interface SkillScreenRingView extends SkillRingView {
	readonly selected: boolean;
}

/** One ledger row of a skill as its detail lists it: "Clean Architecture" and "+15 XP · 2 Nov". */
export interface RecentEntryView {
	readonly task: string;
	readonly detail: string;
}

/** The detail panel of the Skills screen (game-ui S9). */
export interface SkillDetailView {
	readonly id: string;
	readonly name: string;
	readonly icon: string;
	readonly earned: boolean;
	/** How much of the big ring is drawn, as on the skill's medallion. */
	readonly ringPercent: number;
	/** "Level 2 · Scholar", "Level 2" without a rank, or "Locked". */
	readonly levelLine: string;
	readonly rankDescription: string | null;
	/** "Feeds · Intelligence". */
	readonly feedsText: string;
	/** The next-level bar of an earned skill; `null` while locked or at the top of the curve. */
	readonly xp: { readonly label: string; readonly valueText: string; readonly percent: number; readonly ariaLabel: string } | null;
	/** "To unlock" above the requirements of a locked skill; `null` once earned. */
	readonly requirementsTitle: string | null;
	readonly requirements: readonly RequirementRowView[];
	readonly countsTitle: string;
	/** The skill's description; `null` when the note has none. */
	readonly description: string | null;
	readonly recentTitle: string;
	/** Newest first. */
	readonly recent: readonly RecentEntryView[];
	/** "No entries yet" while there are none, else `null`. */
	readonly noRecentText: string | null;
	readonly earnedText: string | null;
}

/** The Skills screen (game-ui S9): a grid of every medallion, earned first, and the selected one's detail. */
export interface SkillsScreenView {
	readonly gridTitle: string;
	readonly detailTitle: string;
	readonly rings: readonly SkillScreenRingView[];
	/** `null` while there is no skill. */
	readonly detail: SkillDetailView | null;
}

/** The Skills screen with the skill `selectedId` in the detail; the first skill when it is `null` or gone. */
export function skillsScreenView(page: SkillsPageView, selectedId: string | null, t: Translator): SkillsScreenView {
	const cards = [...page.earned, ...page.locked];
	const selected = cards.find((card) => card.id === selectedId) ?? cards[0] ?? null;
	return {
		gridTitle: t('skills.screen.medallions'),
		detailTitle: t('skills.screen.detail'),
		rings: cards.map((card) => ({ ...skillRingView(card, t), selected: card === selected })),
		detail: selected ? skillDetailView(selected, t) : null,
	};
}

export function skillDetailView(card: SkillCardView, t: Translator): SkillDetailView {
	const level = card.level ?? 0;
	const recent = card.recent ?? [];
	return {
		id: card.id,
		name: card.name,
		icon: card.icon,
		earned: card.unlocked,
		ringPercent: skillRingView(card, t).percent,
		levelLine: card.unlocked ? [card.levelText, card.rankName].filter((part): part is string => part !== null).join(' · ') : t('skills.medallion.locked'),
		rankDescription: card.rankDescription || null,
		feedsText: t('skills.detail.feeds', { stat: card.statLabel }),
		xp:
			card.unlocked && card.xp
				? { label: t('skills.detail.nextLevel', { level: level + 1 }), valueText: card.xp.text, percent: card.xp.percent, ariaLabel: t('skills.detail.xp.aria', { name: card.name }) }
				: null,
		requirementsTitle: card.unlocked ? null : t('skills.detail.unlock'),
		requirements: card.requirements,
		countsTitle: t('skills.detail.counts'),
		description: card.description || null,
		recentTitle: t('skills.detail.recent'),
		recent: recent.map((entry) => ({ task: entry.task, detail: `${entryXpText(entry.xp, t)} · ${dayMonth(entry.date, t)}` })),
		noRecentText: recent.length === 0 ? t('skills.detail.none') : null,
		earnedText: card.earnedText,
	};
}

// A revert carries the negative XP of the completion it cancels: shown with a minus sign.
function entryXpText(xp: number, t: Translator): string {
	return xp < 0 ? t('skills.detail.revert', { xp: -xp }) : t('quests.xp', { xp });
}

