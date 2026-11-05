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
		// The filters above the panel are buttons (missions S6); the rows and the list never are.
		expect(/<ul class="dromos-quest-items">.*<\/ul>/.exec(html)?.[0]).not.toContain('<button');
		expect(rows.some((row) => row.includes('<button'))).toBe(false);
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

describe('QuestList: open a mission (missions S5)', () => {
	const items = [
		{ title: 'Book the bus', completed: true },
		{ title: 'Pack', completed: false },
		{ title: 'Leave', completed: false },
	];
	const quests = [aQuest('m1', { title: 'Plan the trip', type: 'todo', checklist: { done: 1, total: 3, items } })];

	it('draws a toggle on a mission row, folded at first', () => {
		const folded = renderToStaticMarkup(<QuestList view={questPanelView(questListView(quests, TODAY, en), en)} />);

		expect(folded).toContain('<button type="button" class="dromos-subtasks-toggle" aria-expanded="false" aria-label="Show the subtasks of Plan the trip">');
		expect(folded).not.toContain('dromos-subtask"');
	});

	it('lists the subtasks under the title once open, a done one checked, struck and announced', () => {
		const open = renderToStaticMarkup(<QuestList view={questPanelView(questListView(quests, TODAY, en), en, { openMissions: new Set(['m1']) })} />);

		expect(open).toContain('aria-expanded="true" aria-label="Hide the subtasks of Plan the trip"');
		expect([...open.matchAll(/<li class="(dromos-subtask[^"]*)">/g)].map((match) => match[1])).toEqual(['dromos-subtask is-completed', 'dromos-subtask', 'dromos-subtask']);
		expect(open).toContain('<span class="dromos-subtask-title">Book the bus<span class="dromos-visually-hidden"> (completed)</span></span>');
		expect(open).toContain('<span class="dromos-subtask-title">Pack</span>');
	});
});

describe('QuestList: filters (missions S6)', () => {
	it('draws the filters above the panel, the chosen one pressed, each with its count', () => {
		const filtered = renderToStaticMarkup(
			<QuestList view={questPanelView(questListView([aQuest('d1'), aQuest('t1', { type: 'todo', checklist: { done: 0, total: 3 } })], TODAY, en), en, { filter: 'missions' })} />,
		);

		expect(filtered).toContain('<div class="dromos-quest-filters" role="group" aria-label="Filter quests">');
		expect(filtered).toContain('<button type="button" class="dromos-quest-filter" aria-pressed="false">All <span class="dromos-quest-filter-count">2</span></button>');
		expect(filtered).toContain('<button type="button" class="dromos-quest-filter is-selected" aria-pressed="true">Missions <span class="dromos-quest-filter-count">1</span></button>');
		expect(filtered.indexOf('dromos-quest-filters')).toBeLessThan(filtered.indexOf('dromos-quest-panel'));
	});

	it('says so inside the panel when the filter leaves nothing', () => {
		const empty = renderToStaticMarkup(<QuestList view={questPanelView(questListView([aQuest('t1', { type: 'todo' })], TODAY, en), en, { filter: 'dailies' })} />);

		expect(empty).toContain('<p class="dromos-empty">No quests of this kind today</p>');
		expect(empty).not.toContain('<ul');
	});
});
