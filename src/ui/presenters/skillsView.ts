import type { GameSnapshot, SkillEntry } from '../../application';
import type { RequirementProgress } from '../../domain';
import { plural, type Translator } from '../../i18n';
import { statLabel, xpBarView, type XpBarView } from './characterCardView';

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
	readonly levelText: string | null;
	readonly rankName: string | null;
	readonly rankDescription: string | null;
	readonly xp: XpBarView | null;
	/** What is still asked (locked skills); empty once earned. */
	readonly requirements: readonly RequirementRowView[];
	/** How close the skill is to unlocking, whole percent; 100 once earned. */
	readonly progressPercent: number;
	readonly earnedText: string | null;
}

/** What the Skills section shows (S5). */
export interface SkillsPageView {
	readonly title: string;
	/** Why there is nothing to list, or `null` when there is. */
	readonly emptyText: string | null;
	/** A warning above the list, or `null`. */
	readonly notice: string | null;
	readonly earnedTitle: string;
	readonly lockedTitle: string;
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
		earnedTitle: t('skills.earned', { count: earned.length }),
		lockedTitle: t('skills.locked', { count: locked.length }),
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
	return {
		id: skill.id,
		icon: skill.icon,
		name: skill.name,
		statLabel: statLabel(skill.stat, t),
		description: skill.description,
		unlocked: skill.unlocked,
		levelText: skill.unlocked ? t('skills.level', { level: standing.level }) : null,
		rankName: skill.unlocked ? (rank?.name ?? null) : null,
		rankDescription: skill.unlocked ? (rank?.description ?? null) : null,
		xp: skill.unlocked && standing.xpToNext !== null ? xpBarView(standing.xpIntoLevel, standing.xpToNext) : null,
		requirements,
		progressPercent: skill.unlocked ? 100 : meanPercent(requirements),
		earnedText: skill.unlocked && skill.unlockedOn !== null ? t('skills.earnedOn', { date: skill.unlockedOn }) : null,
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
