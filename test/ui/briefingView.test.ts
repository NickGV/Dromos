import { describe, expect, it } from 'vitest';
import { createTranslator } from '../../src/i18n';
import { shortHash } from '../../src/ui/presenters/briefingText';
import { briefingRequestMessage, briefingView, letterMarkOf } from '../../src/ui/presenters/briefingView';
import type { SkillCardView } from '../../src/ui/presenters/skillsView';
import { aBriefing } from '../fakes/InMemoryBriefingRepository';

const es = createTranslator('es');
const en = createTranslator('en');
const TODAY = '2026-11-03';

function lockedCard(overrides: Partial<SkillCardView> = {}): SkillCardView {
	return {
		id: 'lector',
		icon: '📖',
		name: 'Lector',
		statLabel: 'Sabiduría',
		description: '',
		unlocked: false,
		level: null,
		levelText: null,
		rankName: null,
		rankDescription: null,
		caption: null,
		xp: null,
		requirements: [],
		progressPercent: 0,
		earnedText: null,
		...overrides,
	};
}

describe('briefingView', () => {
	it('shows a briefing of today undimmed and signed', () => {
		const view = briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY, body: 'Shalom.' }) }, TODAY, [], es);

		expect(view.notice).toBeNull();
		expect(view.dimmed).toBe(false);
		expect(view.markdown).toEqual({ body: 'Shalom.', sourcePath: 'Dromos/Briefing.md' });
		expect(view.signature).toBe('— Esdras');
	});

	// Pin (S5, kept by S13): another day's letter stays readable, only dimmed.
	it('dims a briefing of another day, keeping the text', () => {
		const view = briefingView({ kind: 'found', briefing: aBriefing({ created: '2026-11-02', body: 'Shalom.' }) }, TODAY, [], es);

		expect(view.dimmed).toBe(true);
		expect(view.markdown).toEqual({ body: 'Shalom.', sourcePath: 'Dromos/Briefing.md' });
		expect(view.signature).toBe('— Esdras');
	});

	it('treats a note that names no day as written on another day', () => {
		const view = briefingView({ kind: 'found', briefing: aBriefing({ created: null }) }, TODAY, [], es);

		expect(view.dimmed).toBe(true);
		expect(view.topLine).toBe('Última carta');
	});

	// Pin (calm-ui, kept by S13): with no note, the notice is all the panel shows.
	it('says Esdras has not written today when there is no note, with nothing to dim, sign or read', () => {
		const view = briefingView({ kind: 'missing' }, TODAY, [], es);

		expect(view).toEqual({
			ariaLabel: 'Briefing de Esdras',
			topLine: null,
			notice: 'Esdras aún no escribió hoy',
			newLabel: null,
			requestLabel: 'Copiar comando del briefing',
			requestInRow: true,
			dimmed: false,
			mission: null,
			near: null,
			markdown: null,
			signature: null,
			letter: null,
		});
	});

	it('says so when the note cannot be read', () => {
		const view = briefingView({ kind: 'unreadable' }, TODAY, [], es);

		expect(view.notice).toBe('No se pudo leer el briefing.');
		expect(view.topLine).toBeNull();
		expect(view.letter).toBeNull();
		expect(view.requestInRow).toBe(true);
	});

	it('has no text block when the note has an empty body, and keeps the mission', () => {
		const mission = { title: 'Cerrar Kairos', why: null };
		const view = briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY, body: '', mission }) }, TODAY, [], es);

		expect(view.markdown).toBeNull();
		expect(view.mission).toEqual({ label: 'Misión del día', title: 'Cerrar Kairos', why: null, whyLabel: 'Por qué esta misión' });
	});

	it('signs only what has something written', () => {
		const empty = briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY, body: '' }) }, TODAY, [], es);
		const onlyMission = briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY, body: '', mission: { title: 'Cerrar Kairos', why: null } }) }, TODAY, [], es);

		expect(empty.signature).toBeNull();
		expect(empty.letter).toBeNull();
		expect(onlyMission.signature).toBe('— Esdras');
	});

	it('highlights the mission with its why', () => {
		const mission = { title: 'Cerrar Kairos', why: 'Lleva 9 días sin moverse.' };
		const view = briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY, mission }) }, TODAY, [], en);

		expect(view.mission).toEqual({ label: 'Mission of the day', title: 'Cerrar Kairos', why: [{ text: 'Lleva 9 días sin moverse.', code: false }], whyLabel: 'Why this mission' });
	});

	// S14: Esdras writes code in backticks inside the why; only those become code.
	it('turns the backticks of the why into code and nothing else', () => {
		const mission = { title: 'Cerrar M4', why: 'Según `phases` del <b>README</b>.' };
		const view = briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY, mission }) }, TODAY, [], es);

		expect(view.mission?.why).toEqual([
			{ text: 'Según ', code: false },
			{ text: 'phases', code: true },
			{ text: ' del <b>README</b>.', code: false },
		]);
	});

	// Pin (calm-ui S2, kept by S13): what the close skill asks comes from the game.
	it('names the close skill with what it still asks, from the game and not from the note', () => {
		const requirements = [
			{ text: '2 of 5 quests', detail: null, met: false, percent: 40 },
			{ text: '1 of 1 campaigns', detail: null, met: true, percent: 100 },
			{ text: 'Read a book', detail: 'Pending', met: false, percent: 0 },
		];
		const view = briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY, nearSkillId: 'lector' }) }, TODAY, [lockedCard({ requirements })], en);

		expect(view.near).toEqual({ label: 'Closest skill', icon: '📖', name: 'Lector', asks: '2 of 5 quests · Read a book' });
	});

	it('has no close skill when the note names a skill that is not locked or does not exist', () => {
		const briefing = aBriefing({ created: TODAY, nearSkillId: 'centinela' });

		expect(briefingView({ kind: 'found', briefing }, TODAY, [lockedCard()], es).near).toBeNull();
	});

	it('has no close skill text when nothing is left to ask', () => {
		const view = briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY, nearSkillId: 'lector' }) }, TODAY, [lockedCard()], es);

		expect(view.near).toEqual({ label: 'Skill más cercana', icon: '📖', name: 'Lector', asks: null });
	});

	it('speaks English when asked to', () => {
		const view = briefingView({ kind: 'missing' }, TODAY, [], en);

		expect(view.ariaLabel).toBe('Briefing from Esdras');
		expect(view.notice).toBe('Esdras has not written today');
		expect(view.requestLabel).toBe('Copy briefing command');
		expect(briefingView({ kind: 'unreadable' }, TODAY, [], en).notice).toBe('Could not read the briefing.');
	});
});

// game-ui S13: the folded letter.
describe('briefingView, folded letter', () => {
	it('heads a letter of today "Letter from Esdras · today", with no notice', () => {
		const view = briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY }) }, TODAY, [], en);

		expect(view.topLine).toBe('Letter from Esdras · today');
		expect(view.notice).toBeNull();
		expect(briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY }) }, TODAY, [], es).topLine).toBe('Carta de Esdras · hoy');
	});

	it('heads a letter of another day "Last letter · 2 Nov" instead of saying Esdras has not written today', () => {
		const view = briefingView({ kind: 'found', briefing: aBriefing({ created: '2026-11-02' }) }, TODAY, [], en);

		expect(view.topLine).toBe('Last letter · 2 Nov');
		expect(view.notice).toBeNull();
		expect(briefingView({ kind: 'found', briefing: aBriefing({ created: '2026-11-02' }) }, TODAY, [], es).topLine).toBe('Última carta · 2 nov');
	});

	it('has no top line and keeps the notice when there is no letter', () => {
		const view = briefingView({ kind: 'missing' }, TODAY, [], en);

		expect(view.topLine).toBeNull();
		expect(view.notice).toBe('Esdras has not written today');
	});

	// home-fit S4: the folded letter shows no excerpt; the unrolled letter has the whole text.
	it('carries no excerpt of the letter', () => {
		const view = briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY, body: 'Shalom, Nicolás.' }) }, TODAY, [], en);

		expect(view).not.toHaveProperty('excerpt');
		expect(view.markdown?.body).toBe('Shalom, Nicolás.');
	});

	it('offers to read the letter with its reading time, and to fold it', () => {
		const short = briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY, body: 'Shalom.' }) }, TODAY, [], en);
		const long = briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY, body: 'palabra '.repeat(278) }) }, TODAY, [], es);

		expect(short.letter).toEqual({ readLabel: 'Read the letter · 1 min', foldLabel: 'Fold the letter' });
		expect(long.letter).toEqual({ readLabel: 'Leer la carta · 2 min', foldLabel: 'Doblar la carta' });
	});

	it('marks a letter not read on this device as new, and only that one', () => {
		const briefing = aBriefing({ created: TODAY, body: 'Shalom.' });
		const state = { kind: 'found', briefing } as const;

		expect(briefingView(state, TODAY, [], en, null).newLabel).toBe('New letter');
		expect(briefingView(state, TODAY, [], es, null).newLabel).toBe('Carta nueva');
		expect(briefingView(state, TODAY, [], en, letterMarkOf(briefing)).newLabel).toBeNull();
		expect(briefingView(state, TODAY, [], en, { date: TODAY, hash: shortHash('Otra carta.') }).newLabel).toBe('New letter');
		expect(briefingView(state, TODAY, [], en, { date: '2026-11-02', hash: shortHash('Shalom.') }).newLabel).toBe('New letter');
		expect(briefingView(state, TODAY, [], en, 'basura').newLabel).toBe('New letter');
		expect(briefingView({ kind: 'missing' }, TODAY, [], en, null).newLabel).toBeNull();
	});

	it('puts the copy command in the folded row for an old or missing letter, and at the foot for today\'s', () => {
		expect(briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY }) }, TODAY, [], en).requestInRow).toBe(false);
		expect(briefingView({ kind: 'found', briefing: aBriefing({ created: '2026-11-02' }) }, TODAY, [], en).requestInRow).toBe(true);
		expect(briefingView({ kind: 'missing' }, TODAY, [], en).requestInRow).toBe(true);
	});

	it('keeps the copy command in the row when today\'s letter has nothing to unroll', () => {
		expect(briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY, body: '' }) }, TODAY, [], en).requestInRow).toBe(true);
	});
});

describe('letterMarkOf', () => {
	it('holds the letter\'s date and a short hash of its body', () => {
		expect(letterMarkOf(aBriefing({ created: '2026-11-02', body: 'Shalom.' }))).toEqual({ date: '2026-11-02', hash: shortHash('Shalom.') });
		expect(letterMarkOf(aBriefing({ created: null, body: '' }))).toEqual({ date: null, hash: shortHash('') });
	});
});

// Pin (calm-ui S4): the copy command and its toast are unchanged by S13.
describe('briefingRequestMessage', () => {
	it('names the command and where to run it after copying', () => {
		expect(briefingRequestMessage('copied', es)).toBe('Comando copiado: /dromos-briefing. Córrelo en OpenCode desde la carpeta de tu bóveda.');
		expect(briefingRequestMessage('copied', en)).toBe('Command copied: /dromos-briefing. Run it in OpenCode from your vault folder.');
	});

	it('still names the command when it could not be copied', () => {
		expect(briefingRequestMessage('failed', es)).toBe('No se pudo copiar. El comando es /dromos-briefing: córrelo en OpenCode desde la carpeta de tu bóveda.');
		expect(briefingRequestMessage('failed', en)).toBe('Could not copy it. The command is /dromos-briefing: run it in OpenCode from your vault folder.');
	});
});
