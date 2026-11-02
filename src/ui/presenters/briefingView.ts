import type { BriefingRequest, BriefingState } from '../../application';
import { BRIEFING_COMMAND, isBriefingOf, type Briefing } from '../../domain';
import type { Translator } from '../../i18n';
import type { SkillCardView } from './skillsView';

export interface BriefingMissionView {
	readonly label: string;
	readonly title: string;
	readonly why: string | null;
}

export interface BriefingNearView {
	readonly label: string;
	readonly icon: string;
	readonly name: string;
	/** What the skill still asks, right now; `null` when nothing is left. */
	readonly asks: string | null;
}

/** What the panel of Esdras shows (S1, S2). The text stays visible on another day, only dimmed. */
export interface BriefingView {
	readonly ariaLabel: string;
	/** Why there is no briefing of today, or `null` when there is. */
	readonly notice: string | null;
	readonly requestLabel: string;
	readonly dimmed: boolean;
	readonly mission: BriefingMissionView | null;
	readonly near: BriefingNearView | null;
	readonly markdown: { readonly body: string; readonly sourcePath: string } | null;
	readonly signature: string | null;
}

export function briefingView(state: BriefingState, today: string, lockedSkills: readonly SkillCardView[], t: Translator): BriefingView {
	const ariaLabel = t('briefing.aria');
	const requestLabel = t('briefing.request');
	if (state.kind !== 'found') {
		const notice = t(state.kind === 'missing' ? 'briefing.notToday' : 'briefing.unreadable');
		return { ariaLabel, notice, requestLabel, dimmed: false, mission: null, near: null, markdown: null, signature: null };
	}
	const { briefing } = state;
	const ofToday = isBriefingOf(briefing, today);
	return {
		ariaLabel,
		notice: ofToday ? null : t('briefing.notToday'),
		requestLabel,
		dimmed: !ofToday,
		mission: briefing.mission ? { label: t('briefing.mission'), title: briefing.mission.title, why: briefing.mission.why } : null,
		near: nearOf(briefing, lockedSkills, t),
		markdown: briefing.body === '' ? null : { body: briefing.body, sourcePath: briefing.path },
		signature: t('briefing.signature'),
	};
}

/** The toast after asking for a briefing. It always names the command, so a refused clipboard loses nothing. */
export function briefingRequestMessage(request: BriefingRequest, t: Translator): string {
	return t(request === 'copied' ? 'briefing.request.copied' : 'briefing.request.failed', { command: BRIEFING_COMMAND });
}

// The note only names the skill: what it asks changes during the day, and the game knows it (ADR-008).
function nearOf(briefing: Briefing, lockedSkills: readonly SkillCardView[], t: Translator): BriefingNearView | null {
	const card = lockedSkills.find((skill) => skill.id === briefing.nearSkillId);
	if (!card) return null;
	const asks = card.requirements.filter((requirement) => !requirement.met).map((requirement) => requirement.text);
	return { label: t('briefing.nearSkill'), icon: card.icon, name: card.name, asks: asks.length > 0 ? asks.join(' · ') : null };
}
