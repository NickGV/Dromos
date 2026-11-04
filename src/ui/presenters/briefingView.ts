import type { BriefingRequest, BriefingState } from '../../application';
import { BRIEFING_COMMAND, isBriefingOf, type Briefing } from '../../domain';
import type { Translator } from '../../i18n';
import { codeSegments, excerptOf, readingMinutes, shortHash, type TextSegment } from './briefingText';
import { dayMonth } from './dates';
import type { SkillCardView } from './skillsView';

export interface BriefingMissionView {
	readonly label: string;
	readonly title: string;
	/** Esdras's reason, split at the spans he wrote in backticks (S14); `null` when he gave none. */
	readonly why: readonly TextSegment[] | null;
	readonly whyLabel: string;
}

export interface BriefingNearView {
	readonly label: string;
	readonly icon: string;
	readonly name: string;
	/** What the skill still asks, right now; `null` when nothing is left. */
	readonly asks: string | null;
}

/** The disclosure of the letter (S13): its label while folded, with the reading time, and while open. */
export interface BriefingLetterView {
	readonly readLabel: string;
	readonly foldLabel: string;
}

/**
 * What tells this device that a letter was opened (S13): the day it was written and a hash of its
 * text. Kept through the device store, never in the vault.
 */
export interface LetterMark {
	readonly date: string | null;
	readonly hash: string;
}

/**
 * What the panel of Esdras shows (calm-ui S1, S2; game-ui S5, S13). A letter opens with its top line
 * and folds to the mission, the closest skill and an excerpt; with no letter, the notice says why.
 * The text of another day stays visible, only dimmed.
 */
export interface BriefingView {
	readonly ariaLabel: string;
	/** "Letter from Esdras · today" or "Last letter · 2 Nov"; `null` when there is no letter. */
	readonly topLine: string | null;
	/** Why there is no letter to show, or `null` when there is one. */
	readonly notice: string | null;
	/** "New letter" while this device has not opened it; `null` once it has. */
	readonly newLabel: string | null;
	readonly requestLabel: string;
	/** The copy command sits in the folded row for an old or missing letter, else at the letter's foot. */
	readonly requestInRow: boolean;
	readonly dimmed: boolean;
	readonly mission: BriefingMissionView | null;
	readonly near: BriefingNearView | null;
	/** The letter's first words as plain text, for the folded panel; `null` when it has no text. */
	readonly excerpt: string | null;
	readonly markdown: { readonly body: string; readonly sourcePath: string } | null;
	readonly signature: string | null;
	/** `null` when nothing is written, and so nothing unrolls. */
	readonly letter: BriefingLetterView | null;
}

/**
 * The panel for the briefing `state` on `today`. `readMark` is what this device kept of the last
 * letter it opened; any other value, `null` included, leaves the letter marked as new.
 */
export function briefingView(state: BriefingState, today: string, lockedSkills: readonly SkillCardView[], t: Translator, readMark: unknown = null): BriefingView {
	const ariaLabel = t('briefing.aria');
	const requestLabel = t('briefing.request');
	if (state.kind !== 'found') {
		const notice = t(state.kind === 'missing' ? 'briefing.notToday' : 'briefing.unreadable');
		return { ariaLabel, topLine: null, notice, newLabel: null, requestLabel, requestInRow: true, dimmed: false, mission: null, near: null, excerpt: null, markdown: null, signature: null, letter: null };
	}
	const { briefing } = state;
	const ofToday = isBriefingOf(briefing, today);
	const hasText = briefing.body !== '';
	const written = hasText || briefing.mission !== null;
	const letter = written ? { readLabel: t('briefing.read', { minutes: readingMinutes(briefing.body) }), foldLabel: t('briefing.fold') } : null;
	return {
		ariaLabel,
		topLine: topLineOf(briefing, ofToday, t),
		notice: null,
		newLabel: written && !sameMark(readMark, letterMarkOf(briefing)) ? t('briefing.new') : null,
		requestLabel,
		requestInRow: !ofToday || letter === null,
		dimmed: !ofToday,
		mission: briefing.mission
			? { label: t('briefing.mission'), title: briefing.mission.title, why: briefing.mission.why === null ? null : codeSegments(briefing.mission.why), whyLabel: t('briefing.why') }
			: null,
		near: nearOf(briefing, lockedSkills, t),
		excerpt: excerptOf(briefing.body),
		markdown: hasText ? { body: briefing.body, sourcePath: briefing.path } : null,
		signature: written ? t('briefing.signature') : null,
		letter,
	};
}

/** The read mark of `briefing`: the day it was written and the hash of its body. */
export function letterMarkOf(briefing: Briefing): LetterMark {
	return { date: briefing.created, hash: shortHash(briefing.body) };
}

/** The toast after asking for a briefing. It always names the command, so a refused clipboard loses nothing. */
export function briefingRequestMessage(request: BriefingRequest, t: Translator): string {
	return t(request === 'copied' ? 'briefing.request.copied' : 'briefing.request.failed', { command: BRIEFING_COMMAND });
}

function topLineOf(briefing: Briefing, ofToday: boolean, t: Translator): string {
	if (ofToday) return t('briefing.top.today');
	return briefing.created === null ? t('briefing.top.lastUndated') : t('briefing.top.last', { date: dayMonth(briefing.created, t) });
}

// The stored value comes from the device: anything but a mark of this very letter counts as unread.
function sameMark(stored: unknown, mark: LetterMark): boolean {
	if (typeof stored !== 'object' || stored === null) return false;
	const candidate = stored as Partial<Record<keyof LetterMark, unknown>>;
	return candidate.date === mark.date && candidate.hash === mark.hash;
}

// The note only names the skill: what it asks changes during the day, and the game knows it (ADR-008).
function nearOf(briefing: Briefing, lockedSkills: readonly SkillCardView[], t: Translator): BriefingNearView | null {
	const card = lockedSkills.find((skill) => skill.id === briefing.nearSkillId);
	if (!card) return null;
	const asks = card.requirements.filter((requirement) => !requirement.met).map((requirement) => requirement.text);
	return { label: t('briefing.nearSkill'), icon: card.icon, name: card.name, asks: asks.length > 0 ? asks.join(' · ') : null };
}
