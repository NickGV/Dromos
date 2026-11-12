import type { StageStanding, StageStep } from '../../application';
import { STAGE_IDS, type StageEvidence, type StageId, type StageRequirementId, type StageRequirementProgress } from '../../domain';
import { plural, type MessageKey, type Translator } from '../../i18n';
import type { AvatarView } from './avatar';
import { longDate } from './dates';

const STAGE_NAMES: Readonly<Record<StageId, MessageKey>> = {
	runner: 'stages.name.runner',
	wayfarer: 'stages.name.wayfarer',
	pilgrim: 'stages.name.pilgrim',
	apprentice: 'stages.name.apprentice',
	disciple: 'stages.name.disciple',
	traveller: 'stages.name.traveller',
	student: 'stages.name.student',
	scholar: 'stages.name.scholar',
	mentor: 'stages.name.mentor',
	counsellor: 'stages.name.counsellor',
	elder: 'stages.name.elder',
	sage: 'stages.name.sage',
};

/** The stage's number on the road, as the niches of the card write it. */
const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'] as const;

/** Where a stage of the road stands for the character. */
export type StageCellState = 'passed' | 'current' | 'next' | 'ahead';

const SPOKEN: Readonly<Record<StageCellState, MessageKey>> = {
	passed: 'stages.road.passed',
	current: 'stages.road.current',
	next: 'stages.road.next',
	ahead: 'stages.road.ahead',
};

/** One requirement of a stage, ticked or with what is missing. */
export interface StageRowView {
	readonly id: StageRequirementId;
	/** What the stage asks: "Nivel 3", "30 días en el camino", "La mitad en rango 4 (7)". */
	readonly label: string;
	/** "nivel 2 de 3" while missing; once met, the plain value: "8 en rango 4", never "8 de 7". */
	readonly count: string;
	readonly met: boolean;
	/** The bar's fill, 0 to 100, while missing; `null` once met, when there is no bar. */
	readonly percent: number | null;
	/** "Te faltan 248 XP", "Faltan 19 días: el 1 de diciembre"; `null` when there is nothing to add. */
	readonly hint: string | null;
}

/** One of the twelve stages of the road. */
export interface StageCellView {
	readonly stage: StageId;
	/** "VI": the stage's number, a drawing for screen readers. */
	readonly numeral: string;
	readonly name: string;
	readonly state: StageCellState;
	/** The word under the current and the next stage, "aquí estás", "siguiente"; `null` for the rest. */
	readonly tag: string | null;
	/** What a screen reader hears after the name: "pasada", "aquí estás", "la siguiente", "por delante". */
	readonly spoken: string;
	/** The stage's bust: the current one carries the figure's objects, the others none. */
	readonly avatar: AvatarView;
}

/** What comes after the stage reached: the next stage's requirements, or, at the last stage, the road complete with its own. */
export type StageNextView =
	| { readonly kind: 'next'; readonly before: string; readonly name: string; readonly rows: readonly StageRowView[] }
	| { readonly kind: 'complete'; readonly title: string; readonly note: string; readonly rows: readonly StageRowView[] };

/** The stage card (stage-card S1): the stage reached, what the next one asks, and the road of twelve. */
export interface StageCardView {
	/** The dialog's name, "Las etapas de Nicolás". */
	readonly ariaLabel: string;
	/** The big bust: the figure at the stage reached. */
	readonly avatar: AvatarView;
	/** "Etapa 1 de 12". */
	readonly kicker: string;
	/** The stage's name, the card's title. */
	readonly title: string;
	/** "En el camino desde el 1 de noviembre · 11 días". */
	readonly since: string;
	readonly next: StageNextView;
	/** "cumplido": what a screen reader hears after a met requirement. */
	readonly metText: string;
	/** "Las doce etapas". */
	readonly roadTitle: string;
	readonly road: readonly StageCellView[];
	/** "Lo que cuenta hoy": everything the rules read, in one line. */
	readonly today: { readonly label: string; readonly text: string };
}

/** The stage's name in the interface language. */
export function stageName(stage: StageId, t: Translator): string {
	return t(STAGE_NAMES[stage]);
}

/** The portrait's name as a button: "Corredor, etapa 1 de 12. Ver las etapas". Obsidian shows it as the tooltip too. */
export function portraitButtonLabel(stage: StageId, t: Translator): string {
	return t('stages.portrait', { stage: stageName(stage, t), number: STAGE_IDS.indexOf(stage) + 1, total: STAGE_IDS.length });
}

/**
 * The stage card of `name` (stage-card S1), from the standing that drew the figure, so the card and
 * the figure never disagree: the stage reached with the figure's bust, since when the character is on
 * the road, what the next stage asks, each requirement ticked with its plain value or with what is
 * missing, and the road of twelve stages. At the last stage there is no next one: the road is
 * complete, and the last stage's requirements show, all met. Dates are read as `today` writes them.
 */
export function stageCardView(standing: StageStanding, figure: AvatarView, name: string, today: string, t: Translator): StageCardView {
	const { stage, evidence } = standing;
	const index = STAGE_IDS.indexOf(stage);
	const avatar: AvatarView = { stage, objects: figure.objects };
	return {
		ariaLabel: t('stages.card.aria', { name }),
		avatar,
		kicker: t('stages.kicker', { number: index + 1, total: STAGE_IDS.length }),
		title: stageName(stage, t),
		since: standing.gameStart === null ? t('stages.since.none') : t('stages.since', { date: longDate(standing.gameStart, today, t), days: plural(t, 'stages.days', evidence.days) }),
		next: nextView(standing, index, today, t),
		metText: t('stages.req.met'),
		roadTitle: t('stages.road'),
		road: STAGE_IDS.map((id, position) => cellView(id, position, index, avatar, t)),
		today: { label: t('stages.today'), text: todayText(evidence, t) },
	};
}

function nextView(standing: StageStanding, index: number, today: string, t: Translator): StageNextView {
	const next = STAGE_IDS[index + 1];
	if (next === undefined) {
		const rows = rowsOf(standing.steps.find((step) => step.stage === standing.stage), standing, today, t);
		return { kind: 'complete', title: t('stages.complete'), note: t('stages.complete.note', { stage: stageName(standing.stage, t) }), rows };
	}
	return { kind: 'next', before: t('stages.next.before'), name: stageName(next, t), rows: rowsOf(standing.steps.find((step) => step.stage === next), standing, today, t) };
}

function rowsOf(step: StageStep | undefined, standing: StageStanding, today: string, t: Translator): StageRowView[] {
	return step ? step.requirements.map((part) => rowView(part, step, standing, today, t)) : [];
}

function rowView(part: StageRequirementProgress, step: StageStep, standing: StageStanding, today: string, t: Translator): StageRowView {
	const { id, value, target, met } = part;
	const words = wordsOf(part, t);
	const percent = id === 'level' ? share(standing.totalXp, standing.totalXp + step.xpLeft) : share(value, target);
	return {
		id,
		label: words.label,
		count: met ? words.value : words.of,
		met,
		percent: met ? null : percent,
		hint: met ? null : id === 'level' ? t('stages.req.level.left', { xp: step.xpLeft }) : id === 'days' ? daysHint(target - value, target, standing.gameStart, today, t) : null,
	};
}

/** How a requirement is worded: what it asks, its value once met, and "N de M" while missing. */
function wordsOf({ id, value, target, share: kind, rank }: StageRequirementProgress, t: Translator): { readonly label: string; readonly value: string; readonly of: string } {
	const numbers = { value, target, rank: rank ?? 0 };
	switch (id) {
		case 'level':
			return { label: t('stages.req.level', { level: target }), value: t('stages.req.level.value', numbers), of: t('stages.req.level.of', numbers) };
		case 'days':
			return { label: plural(t, 'stages.req.days', target), value: plural(t, 'stages.days', value), of: t('stages.req.days.of', numbers) };
		case 'skills':
			return {
				label: kind === 'all' ? t('stages.req.skills.all', { count: target }) : plural(t, 'stages.req.skills', target),
				value: plural(t, 'stages.skills', value),
				of: t('stages.req.skills.of', numbers),
			};
		case 'skillsAtRank':
			return {
				label: kind === 'half' ? t('stages.req.rank.half', { rank: numbers.rank, count: target }) : plural(t, 'stages.req.rank', target, { rank: numbers.rank }),
				value: t('stages.req.rank.value', numbers),
				of: t('stages.req.rank.of', numbers),
			};
		case 'campaigns':
			return { label: plural(t, 'stages.req.campaigns', target), value: plural(t, 'stages.campaigns', value), of: t('stages.req.campaigns.of', numbers) };
		case 'books':
			return { label: plural(t, 'stages.req.books', target), value: plural(t, 'stages.books', value), of: t('stages.req.books.of', numbers) };
	}
}

/** "Faltan 19 días: el 1 de diciembre", the day `game_start` is `target` days behind; without `game_start`, the days alone. */
function daysHint(left: number, target: number, gameStart: string | null, today: string, t: Translator): string {
	const day = gameStart === null ? null : daysAfter(gameStart, target);
	return day === null ? plural(t, 'stages.req.days.wait', left) : plural(t, 'stages.req.days.left', left, { date: longDate(day, today, t) });
}

/** The `YYYY-MM-DD` day `days` after `date`, counted on the calendar alone so no time zone moves it; `null` for any other text. */
function daysAfter(date: string, days: number): string | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
	if (!match) return null;
	const day = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
	return Number.isNaN(day.getTime()) ? null : day.toISOString().slice(0, 10);
}

function share(part: number, whole: number): number {
	if (whole <= 0) return 0;
	return Math.min(100, Math.max(0, Math.round((part / whole) * 100)));
}

function cellView(stage: StageId, position: number, current: number, figure: AvatarView, t: Translator): StageCellView {
	const state: StageCellState = position < current ? 'passed' : position === current ? 'current' : position === current + 1 ? 'next' : 'ahead';
	return {
		stage,
		numeral: NUMERALS[position] ?? String(position + 1),
		name: stageName(stage, t),
		state,
		tag: state === 'current' ? t('stages.road.current') : state === 'next' ? t('stages.road.next.tag') : null,
		spoken: t(SPOKEN[state]),
		avatar: state === 'current' ? figure : { stage, objects: [] },
	};
}

/** "nivel 2 · 11 días · 5 de 14 skills (1 en rango 2) · 2 campañas · 7 libros": the rank is the highest any earned skill holds, from rank 2 on. */
function todayText(evidence: StageEvidence, t: Translator): string {
	const skills = t('stages.today.skills', { count: evidence.earned.length, total: evidence.totalSkills });
	const highest = Math.max(-1, ...evidence.earned.map(({ rankIndex }) => rankIndex ?? -1));
	const ranked = highest >= 1 ? ` ${t('stages.today.rank', { count: evidence.earned.filter(({ rankIndex }) => rankIndex !== null && rankIndex >= highest).length, rank: highest + 1 })}` : '';
	return [
		t('stages.req.level.value', { value: evidence.level }),
		plural(t, 'stages.days', evidence.days),
		`${skills}${ranked}`,
		plural(t, 'stages.campaigns', evidence.campaigns),
		plural(t, 'stages.books', evidence.books),
	].join(' · ');
}
