import { describe, expect, it } from 'vitest';
import type { GameEvent } from '../../src/application';
import { createTranslator } from '../../src/i18n';
import { ceremonyView, gameNotices } from '../../src/ui/presenters/levelUpView';
import type { SkillCardView } from '../../src/ui/presenters/skillsView';

const es = createTranslator('es');
const en = createTranslator('en');

// game-ui S4: the ceremony replaces the banner; its rows keep the banner's wording rules.
function card(id: string, name: string, icon: string, statLabel: string): SkillCardView {
	return { id, icon, name, statLabel, description: '', unlocked: true, level: 1, levelText: 'Level 1', rankName: null, rankDescription: null, caption: null, xp: null, requirements: [], progressPercent: 100, earnedText: null };
}
const cards = [card('lector', 'Lector', 'book-open', 'Inteligencia'), card('atleta', 'Atleta', '🏃', 'Fuerza')];

describe('ceremonyView', () => {
	it('is null when there is nothing to celebrate', () => {
		expect(ceremonyView([], cards, es)).toBeNull();
	});

	it('crowns a character level with the ribbon and the title, and the dismiss button', () => {
		expect(ceremonyView([{ kind: 'character-level', level: 4 }], cards, es)).toEqual({
			level: 4,
			ribbon: { kicker: 'Nuevo nivel', title: 'Nivel 4' },
			title: 'Has alcanzado el nivel 4',
			rows: [],
			dismissLabel: 'Cerrar',
			ariaLabel: 'Subida de nivel',
		});
		expect(ceremonyView([{ kind: 'character-level', level: 4 }], cards, en)).toMatchObject({ ribbon: { kicker: 'New level', title: 'Level 4' }, title: 'You reached level 4' });
	});

	it('keeps the highest level when several syncs raised it before the panel was closed', () => {
		const events: GameEvent[] = [
			{ kind: 'character-level', level: 4 },
			{ kind: 'character-level', level: 5 },
		];

		expect(ceremonyView(events, cards, en)?.level).toBe(5);
	});

	it('lists the skill events of the sync as rows, with the rank only when it changed and a row per unlock', () => {
		const events: GameEvent[] = [
			{ kind: 'character-level', level: 4 },
			{ kind: 'skill-level', skillId: 'lector', name: 'Lector', level: 3, rank: 'Hojeador', rankChanged: false },
			{ kind: 'skill-level', skillId: 'lector', name: 'Lector', level: 5, rank: 'Lector constante', rankChanged: true },
			{ kind: 'skill-unlocked', skillId: 'atleta', name: 'Atleta' },
		];

		expect(ceremonyView(events, cards, en)?.rows).toEqual([
			{ key: '1:lector', skillId: 'lector', icon: 'book-open', text: 'Lector rose to level 3', detail: null },
			{ key: '2:lector', skillId: 'lector', icon: 'book-open', text: 'Lector rose to level 5', detail: 'New rank: Lector constante' },
			{ key: '3:atleta', skillId: 'atleta', icon: '🏃', text: 'New skill: Atleta', detail: 'Feeds Fuerza' },
		]);
	});

	it('does not name a rank the note does not describe', () => {
		const event: GameEvent = { kind: 'skill-level', skillId: 'lector', name: 'Lector', level: 5, rank: null, rankChanged: true };

		expect(ceremonyView([event], cards, es)?.rows).toEqual([{ key: '0:lector', skillId: 'lector', icon: 'book-open', text: 'Lector subió al nivel 5', detail: null }]);
	});

	it('shows skill events alone without a ribbon, under a title of their own', () => {
		const view = ceremonyView([{ kind: 'skill-unlocked', skillId: 'atleta', name: 'Atleta' }], cards, es);

		expect(view).toMatchObject({ level: null, ribbon: null, title: 'Tus skills avanzaron' });
		expect(view?.rows.map((row) => [row.text, row.detail])).toEqual([['Nueva skill: Atleta', 'Alimenta Fuerza']]);
	});

	it('draws no icon and names no stat for a skill whose note is gone', () => {
		const view = ceremonyView([{ kind: 'skill-unlocked', skillId: 'ghost', name: 'Fantasma' }], cards, en);

		expect(view?.rows).toEqual([{ key: '0:ghost', skillId: 'ghost', icon: '', text: 'New skill: Fantasma', detail: null }]);
	});
});

describe('gameNotices: the toast of an unlock (S18)', () => {
	const unlocked: GameEvent = { kind: 'skill-unlocked', skillId: 'lector', name: 'Lector' };

	it('words each unlock, in both languages', () => {
		expect(gameNotices([unlocked], en)).toEqual(['Skill unlocked: Lector.']);
		expect(gameNotices([unlocked], es)).toEqual(['Skill desbloqueada: Lector.']);
	});

	it('leaves level-ups to the ceremony', () => {
		const events: GameEvent[] = [
			{ kind: 'character-level', level: 3 },
			{ kind: 'skill-level', skillId: 'atleta', name: 'Atleta', level: 2, rank: null, rankChanged: false },
			unlocked,
		];

		expect(gameNotices(events, en)).toEqual(['Skill unlocked: Lector.']);
	});

	it('has nothing to say without an unlock', () => {
		expect(gameNotices([], en)).toEqual([]);
	});
});

describe('gameNotices: the gold bonus of a level (M10 S3)', () => {
	it('tells the bonus as other game news, in both languages', () => {
		const bonus: GameEvent = { kind: 'level-bonus', level: 3, gold: 30, recorded: true };

		expect(gameNotices([bonus], en)).toEqual(['+30 gold for reaching level 3.']);
		expect(gameNotices([bonus], es)).toEqual(['+30 monedas de oro por llegar al nivel 3.']);
	});

	it('says when the purse could not keep it, so the row can be written by hand', () => {
		expect(gameNotices([{ kind: 'level-bonus', level: 4, gold: 40, recorded: false }], en)).toEqual(['+40 gold for reaching level 4. Purse.md could not be written: add its bonus row by hand so no device pays it again.']);
	});

	it('keeps the bonus out of the ceremony, which is the level\'s', () => {
		const view = ceremonyView([{ kind: 'character-level', level: 3 }, { kind: 'level-bonus', level: 3, gold: 30, recorded: true }], [], en);

		expect(view?.level).toBe(3);
		expect(view?.rows).toEqual([]);
		expect(ceremonyView([{ kind: 'level-bonus', level: 3, gold: 30, recorded: true }], [], en)).toBeNull();
	});
});
