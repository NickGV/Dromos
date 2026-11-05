import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createTranslator } from '../../../src/i18n';
import { QuestList } from '../../../src/ui/organisms/QuestList';
import { questListView, questPanelView } from '../../../src/ui/presenters/questListView';
import { aQuest } from '../../fakes/quests';

const en = createTranslator('en');
const TODAY = '2026-11-03';
const prices = new Map([
	['d1', { xp: 10, skills: [] }],
	['d2', { xp: 15, skills: [{ id: 'lector', name: 'Reader' }] }],
]);
const html = renderToStaticMarkup(
	<QuestList view={questPanelView(questListView([aQuest('t1', { title: 'Call the dentist', type: 'todo', dueDate: TODAY }), aQuest('d1', { title: 'Morning routine', completed: true }), aQuest('d2', { title: 'Read 20 pages' })], TODAY, en, prices), en)} />,
);
const rows = [...html.matchAll(/<li class="dromos-quest[^"]*">.*?<\/li>/g)].map((match) => match[0]);

describe('QuestList as one panel (game-ui S6)', () => {
	it('opens with the header line: dailies done on the left, XP to earn on the right', () => {
		expect(html).toContain('<p class="dromos-quest-header"><span>1 of 2 dailies done</span><span>+15 XP to earn</span></p>');
	});

	it('lists dailies first, then to-dos, in one list of rows that are not buttons', () => {
		expect(html.match(/<ul/g)).toHaveLength(1);
		expect(rows.map((row) => /class="dromos-quest-title">([^<]*)/.exec(row)?.[1])).toEqual(['Morning routine', 'Read 20 pages', 'Call the dentist']);
		expect(html).not.toContain('<button');
	});

	it('draws the hand-drawn circle on every row, and the check only on a completed one', () => {
		expect(rows.every((row) => row.includes('class="dromos-quest-circle"'))).toBe(true);
		expect(rows[0]).toMatch(/^<li class="dromos-quest is-completed">/);
		expect(rows[0]).toMatch(/<path class="dromos-quest-tick" d="[^"]+" stroke-dasharray="22"/);
		expect(rows[1]).not.toContain('dromos-quest-tick');
		expect(rows[0]).toContain('<span class="dromos-visually-hidden"> (completed)</span>');
	});

	it('chips the kind, the skill, the XP and the due label', () => {
		const chips = (row: string | undefined) => [...(row ?? '').matchAll(/<span class="dromos-quest-chip ([^"]+)">([^<]*)<\/span>/g)].map((match) => [match[1], match[2]]);

		expect(chips(rows[1])).toEqual([
			['is-type', 'Daily'],
			['is-skill', 'Reader'],
			['is-xp', '+15 XP'],
		]);
		expect(chips(rows[2])).toEqual([
			['is-type', 'To-do'],
			['is-due is-today', 'Today'],
		]);
	});

	it('keeps the empty states, with no header line', () => {
		const empty = renderToStaticMarkup(<QuestList view={questPanelView(questListView([], TODAY, en), en)} />);

		expect(empty).toContain('<p class="dromos-empty">No quests for today</p>');
		expect(empty).not.toContain('dromos-quest-header');
		expect(empty).toMatch(/<h2[^>]*>Today&#x27;s quests<\/h2>/);
	});
});

describe('QuestList: missions (missions S1)', () => {
	it('shows a mission chip with its progress in English', () => {
		const mission = renderToStaticMarkup(<QuestList view={questPanelView(questListView([aQuest('t1', { title: 'Plan the trip', type: 'todo', checklist: { done: 1, total: 4 } })], TODAY, en), en)} />);

		expect(mission).toContain('<span class="dromos-quest-chip is-mission">Mission · 1/4</span>');
	});
});

describe('QuestList: "View more" (missions S3)', () => {
	it('draws the toggle under a folded list, and none under a short one', () => {
		const many = Array.from({ length: 8 }, (_, index) => aQuest(`t${index}`, { type: 'todo' }));
		const folded = renderToStaticMarkup(<QuestList view={questPanelView(questListView(many, TODAY, en), en)} />);

		expect(folded.match(/<li class="dromos-quest/g)).toHaveLength(6);
		expect(folded).toContain('<button type="button" class="dromos-btn is-small dromos-list-toggle" aria-expanded="false">View more (2)</button>');
		expect(html).not.toContain('dromos-list-toggle');
	});
});
