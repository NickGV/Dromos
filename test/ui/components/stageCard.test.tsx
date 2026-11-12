import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { StageStanding } from '../../../src/application';
import { countedEvidence, DEFAULT_STAGE_RULES, LATER_STAGE_IDS, stageFor, stageProgress, type StageEvidence } from '../../../src/domain';
import { createTranslator } from '../../../src/i18n';
import { CharacterPortrait } from '../../../src/ui/atoms/Portrait';
import { StageCard } from '../../../src/ui/organisms/StageCard';
import { stageCardView } from '../../../src/ui/presenters/stageCardView';
import { componentsOf, elementsOf } from './elements';

const es = createTranslator('es');

/** A standing as `LoadAvatar.read` gives it, by the default table, with 14 skills in the vault. */
function standing(evidence: Partial<StageEvidence>, totalXp: number, xpLeft = 0): StageStanding {
	const counted = countedEvidence({ totalSkills: 14, ...evidence });
	return {
		stage: stageFor(counted),
		evidence: counted,
		steps: LATER_STAGE_IDS.map((stage) => ({ stage, requirements: stageProgress(counted, DEFAULT_STAGE_RULES[stage]), xpLeft })),
		totalXp,
		gameStart: '2026-11-01',
	};
}

const ranked = (count: number, rank: number, many: number): StageEvidence['earned'] => Array.from({ length: count }, (_, index) => ({ rankIndex: index < many ? rank - 1 : 0 }));

const TODAY = stageCardView(standing({ level: 2, days: 11, books: 2 }, 135, 248), { stage: 'runner', objects: [] }, 'Nicolás', '2026-11-12', es);
const MID = stageCardView(standing({ level: 12, days: 640, earned: ranked(5, 2, 1), campaigns: 2, books: 7 }, 19716, 2357), { stage: 'traveller', objects: ['lector'] }, 'Nicolás', '2026-11-12', es);
const LAST = stageCardView(standing({ level: 30, days: 4812, earned: ranked(14, 4, 8), campaigns: 12, books: 52 }, 195029), { stage: 'sage', objects: [] }, 'Nicolás', '2026-11-12', es);

const html = (view = TODAY): string => renderToStaticMarkup(<StageCard view={view} />);
/** Each requirement row, its markup. */
const rowsOf = (markup: string): string[] => [...markup.matchAll(/<li class="dromos-stage-req [^"]*">.*?<\/li>/g)].map((match) => match[0]);
/** Each stage of the road, its markup with the portrait taken out. */
const cellsOf = (markup: string): string[] => [...markup.matchAll(/<li class="dromos-stage-cell [^"]*">.*?<\/li>/g)].map((match) => match[0].replace(/<svg class="dromos-portrait-art.*?<\/svg>/, '<bust/>'));
/** What a screen reader reads of some markup: its text, the hidden parts included, the decorative ones left out. */
const spoken = (markup: string): string =>
	markup
		.replace(/<([a-z]+)[^>]*aria-hidden="true"[^>]*>.*?<\/\1>/g, '')
		.replace(/<[^>]+>/g, '')
		.trim();

describe('StageCard: the head (stage-card S1)', () => {
	it('opens with the big bust, the stage’s number, its name as the title and the days on the road', () => {
		expect(html()).toMatch(
			/^<div class="dromos-stage-card"><div class="dromos-stage-sheet"><div class="dromos-stage-head"><span class="dromos-portrait is-character"><svg class="dromos-portrait-art[^"]*".*?<\/svg><\/span><div class="dromos-stage-names"><p class="dromos-stage-kicker">Etapa 1 de 12<\/p><h2 class="dromos-stage-title" tabindex="-1">Corredor<\/h2><p class="dromos-stage-since">En el camino desde el 1 de noviembre · 11 días<\/p><\/div><\/div>/,
		);
	});

	it('moves the focus to the title as it is drawn, without scrolling, so the dialog opens on it', () => {
		const title = elementsOf(StageCard({ view: TODAY })).find((element) => element.type === 'h2');
		const ref = (title as { ref?: unknown } | undefined)?.ref;
		const calls: unknown[] = [];

		expect(typeof ref).toBe('function');
		(ref as (element: unknown) => void)({ focus: (options: unknown) => calls.push(options) });
		(ref as (element: unknown) => void)(null);
		expect(calls).toEqual([{ preventScroll: true }]);
	});
});

describe('StageCard: what the next stage asks (stage-card S1)', () => {
	it('heads the requirements with the next stage’s name', () => {
		expect(html()).toContain('<h3 class="dromos-stage-section">Para ser <span class="dromos-stage-section-name">Caminante</span></h3><ul class="dromos-stage-reqs">');
	});

	it('draws a missing requirement with its empty circle, what is missing, a decorative bar and the hint', () => {
		const [level, days] = rowsOf(html());

		expect(level).toBe(
			'<li class="dromos-stage-req is-open"><svg class="dromos-quest-mark" viewBox="0 0 26 26" width="28" height="28" aria-hidden="true" focusable="false"><path class="dromos-quest-circle" d="M13 2.5c5.8-.3 10.6 4.4 10.4 10.4-.2 5.9-4.8 10.5-10.6 10.3C7 23 2.4 18.4 2.6 12.9 2.8 7 7.4 2.7 13 2.5z"></path></svg><span class="dromos-stage-req-label">Nivel 3</span><span class="dromos-visually-hidden">, </span><span class="dromos-stage-req-count">nivel 2 de 3</span><div class="dromos-stage-req-foot"><div class="dromos-progress-track" aria-hidden="true"><div class="dromos-progress-fill" style="width:35%"></div></div><p class="dromos-stage-req-hint"><span class="dromos-visually-hidden">, </span>Te faltan 248 XP</p></div></li>',
		);
		expect(spoken(level ?? '')).toBe('Nivel 3, nivel 2 de 3, Te faltan 248 XP');
		expect(spoken(days ?? '')).toBe('30 días en el camino, 11 de 30 días, Faltan 19 días: el 1 de diciembre');
	});

	it('ticks a met requirement, with its plain value, no bar, and "cumplido" for screen readers', () => {
		const skills = rowsOf(html(MID)).find((row) => row.includes('skills ganadas')) ?? '';

		expect(skills).toMatch(/^<li class="dromos-stage-req is-met"><svg class="dromos-quest-mark"[^>]*><path class="dromos-quest-circle"[^>]*><\/path><path class="dromos-quest-tick"/);
		expect(skills).not.toContain('dromos-progress-track');
		expect(spoken(skills)).toBe('5 skills ganadas, 5 skills, cumplido');
	});
});

describe('StageCard: the road of twelve stages (stage-card S1)', () => {
	it('draws the twelve busts under their heading, each stage with its state, its decorative numeral and its name', () => {
		const markup = html(MID);
		const cells = cellsOf(markup);

		expect(markup).toContain('<h3 class="dromos-stage-section">Las doce etapas</h3><ol class="dromos-stage-grid">');
		expect(cells).toHaveLength(12);
		expect(cells[4]).toBe(
			'<li class="dromos-stage-cell is-passed"><span class="dromos-portrait is-character"><bust/></span><span class="dromos-stage-badge" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span><span class="dromos-stage-num" aria-hidden="true">V</span><span class="dromos-stage-name">Discípulo</span><span class="dromos-visually-hidden">, pasada</span></li>',
		);
		expect(cells[5]).toBe(
			'<li class="dromos-stage-cell is-current"><span class="dromos-portrait is-character"><bust/></span><span class="dromos-stage-num" aria-hidden="true">VI</span><span class="dromos-stage-name">Viajero</span><span class="dromos-stage-where" aria-hidden="true">aquí estás</span><span class="dromos-visually-hidden">, aquí estás</span></li>',
		);
		expect(cells.slice(4, 8).map(spoken)).toEqual(['Discípulo, pasada', 'Viajero, aquí estás', 'Estudioso, la siguiente', 'Erudito, por delante']);
		expect(cells.map((cell) => /dromos-stage-cell (is-\w+)/.exec(cell)?.[1])).toEqual(['is-passed', 'is-passed', 'is-passed', 'is-passed', 'is-passed', 'is-current', 'is-next', 'is-ahead', 'is-ahead', 'is-ahead', 'is-ahead', 'is-ahead']);
	});

	it('draws the busts from the view: the big one and the current stage’s carry the figure’s objects', () => {
		const busts = componentsOf(StageCard({ view: MID }), CharacterPortrait).map((element) => element.props.avatar);

		expect(busts).toHaveLength(13);
		expect(busts[0]).toEqual({ stage: 'traveller', objects: ['lector'] });
		expect(busts[6]).toEqual({ stage: 'traveller', objects: ['lector'] });
		expect(busts[1]).toEqual({ stage: 'runner', objects: [] });
	});

	it('closes with what counts today', () => {
		expect(html()).toContain('<p class="dromos-stage-evidence"><span class="dromos-stage-evidence-label">Lo que cuenta hoy</span> nivel 2 · 11 días · 0 de 14 skills · 0 campañas · 2 libros</p></section></div></div>');
	});
});

describe('StageCard: the end of the road (stage-card S1)', () => {
	it('says the road is complete in place of a next stage, and ticks the last stage’s requirements', () => {
		const markup = html(LAST);

		expect(markup).toContain('<section class="dromos-stage-block"><h3 class="dromos-stage-complete">El camino está completo</h3><p class="dromos-stage-note">Sabio es la última etapa. Esto es lo que pide, y lo sigues cumpliendo:</p><ul class="dromos-stage-reqs">');
		expect(markup).not.toContain('Para ser');
		expect(rowsOf(markup).map(spoken)).toEqual(['Nivel 30, nivel 30, cumplido', 'Todas las skills (14), 14 skills, cumplido', 'La mitad en rango 4 (7), 8 en rango 4, cumplido', '50 libros terminados, 52 libros, cumplido']);
		expect(cellsOf(markup).filter((cell) => cell.includes('is-next'))).toEqual([]);
	});

	it('adds no button of its own: the modal’s close button and Escape close it', () => {
		expect(elementsOf(StageCard({ view: LAST })).filter((element) => element.type === 'button')).toEqual([]);
	});
});
