import { describe, expect, it } from 'vitest';
import { createTranslator } from '../../src/i18n';
import { briefingRequestMessage, briefingView } from '../../src/ui/presenters/briefingView';
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
	it('shows a briefing of today with no notice, undimmed and signed', () => {
		const view = briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY, body: 'Shalom.' }) }, TODAY, [], es);

		expect(view.notice).toBeNull();
		expect(view.dimmed).toBe(false);
		expect(view.markdown).toEqual({ body: 'Shalom.', sourcePath: 'Dromos/Briefing.md' });
		expect(view.signature).toBe('— Esdras');
	});

	it('dims a briefing of another day and says Esdras has not written today, keeping the text', () => {
		const view = briefingView({ kind: 'found', briefing: aBriefing({ created: '2026-11-02', body: 'Shalom.' }) }, TODAY, [], es);

		expect(view.notice).toBe('Esdras aún no escribió hoy');
		expect(view.dimmed).toBe(true);
		expect(view.markdown).toEqual({ body: 'Shalom.', sourcePath: 'Dromos/Briefing.md' });
		expect(view.signature).toBe('— Esdras');
	});

	it('treats a note that names no day as written on another day', () => {
		const view = briefingView({ kind: 'found', briefing: aBriefing({ created: null }) }, TODAY, [], es);

		expect(view.notice).toBe('Esdras aún no escribió hoy');
		expect(view.dimmed).toBe(true);
	});

	it('says Esdras has not written today when there is no note, with nothing to dim or sign', () => {
		const view = briefingView({ kind: 'missing' }, TODAY, [], es);

		expect(view).toEqual({ ariaLabel: 'Briefing de Esdras', notice: 'Esdras aún no escribió hoy', requestLabel: 'Copiar comando del briefing', dimmed: false, mission: null, near: null, markdown: null, signature: null });
	});

	it('says so when the note cannot be read', () => {
		const view = briefingView({ kind: 'unreadable' }, TODAY, [], es);

		expect(view).toEqual({ ariaLabel: 'Briefing de Esdras', notice: 'No se pudo leer el briefing.', requestLabel: 'Copiar comando del briefing', dimmed: false, mission: null, near: null, markdown: null, signature: null });
	});

	it('has no text block when the note has an empty body, and keeps the mission', () => {
		const mission = { title: 'Cerrar Kairos', why: null };
		const view = briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY, body: '', mission }) }, TODAY, [], es);

		expect(view.markdown).toBeNull();
		expect(view.mission).toEqual({ label: 'Misión del día', title: 'Cerrar Kairos', why: null });
	});

	it('signs only what has something written', () => {
		const empty = briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY, body: '' }) }, TODAY, [], es);
		const onlyMission = briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY, body: '', mission: { title: 'Cerrar Kairos', why: null } }) }, TODAY, [], es);

		expect(empty.signature).toBeNull();
		expect(onlyMission.signature).toBe('— Esdras');
	});

	it('highlights the mission with its why', () => {
		const mission = { title: 'Cerrar Kairos', why: 'Lleva 9 días sin moverse.' };
		const view = briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY, mission }) }, TODAY, [], en);

		expect(view.mission).toEqual({ label: 'Mission of the day', title: 'Cerrar Kairos', why: 'Lleva 9 días sin moverse.' });
	});

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
