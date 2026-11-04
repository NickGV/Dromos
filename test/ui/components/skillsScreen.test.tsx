import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { GameSnapshot, SkillEntry } from '../../../src/application';
import { skillStanding } from '../../../src/domain';
import { createTranslator } from '../../../src/i18n';
import { HomeScreen } from '../../../src/ui/containers/HomeScreen';
import { SkillDetail } from '../../../src/ui/molecules/SkillDetail';
import { SkillRingButton } from '../../../src/ui/molecules/SkillRingButton';
import { SkillsScreen } from '../../../src/ui/organisms/SkillsScreen';
import { skillsPageView, skillsScreenView, type SkillDetailView, type SkillRingView } from '../../../src/ui/presenters/skillsView';
import { skill } from '../../domain/skill/skillFixtures';
import { componentsOf } from './elements';
import { IDLE_GAME, homeDeps, noop } from './homeDeps';

const en = createTranslator('en');
const reader: SkillEntry = {
	skill: skill({ id: 'lector', name: 'Reader', icon: 'book-open', stat: 'inteligencia', description: 'You read books to the end.', unlocked: true, unlockedOn: '2026-10-20' }),
	xp: 40,
	standing: skillStanding(true, 40),
	rank: { name: 'Novice', description: 'First pages.' },
	requirements: [],
	recent: [
		{ date: '2026-11-02', task: 'Clean Architecture', xp: 15, source: 'complete' },
		{ date: '2026-10-31', task: 'Atomic Habits', xp: -10, source: 'revert' },
	],
};
const athlete: SkillEntry = {
	skill: skill({ id: 'atleta', name: 'Athlete', icon: '🏃', stat: 'fuerza', description: 'You move every day.' }),
	xp: 0,
	standing: skillStanding(false, 0),
	rank: null,
	requirements: [
		{ requirement: { kind: 'habit', days: 20 }, done: 15, total: 20, met: false },
		{ requirement: { kind: 'quests', count: 2 }, done: 2, total: 2, met: true },
	],
	recent: [],
};
const game: GameSnapshot = { ...IDLE_GAME, status: { kind: 'synced' }, skills: [athlete, reader], invalidSkills: [{ path: 'Skills/Cartographer.md', reason: 'the stat is missing' }] };
const page = skillsPageView(game, en);
const screen = (selected: string | null = null) => skillsScreenView(page, selected, en);
const detailOf = (selected: string): SkillDetailView => {
	const detail = screen(selected).detail;
	if (!detail) throw new Error('no detail');
	return detail;
};
const ring: SkillRingView = { id: 'lector', name: 'Reader', icon: 'book-open', earned: true, level: 1, percent: 40, caption: 'Level 1 · 40/100', ariaLabel: 'Reader, Level 1 · 40/100' };

describe('SkillRingButton on the skills screen (game-ui S9)', () => {
	it('marks the selected medallion as pressed, and the others as not', () => {
		expect(renderToStaticMarkup(<SkillRingButton view={ring} onOpen={noop} renderIcon={noop} selected />)).toMatch(/^<button type="button" class="dromos-ring-button is-earned is-selected" aria-label="Reader, Level 1 · 40\/100" aria-pressed="true">/);
		expect(renderToStaticMarkup(<SkillRingButton view={ring} onOpen={noop} renderIcon={noop} selected={false} />)).toMatch(/^<button type="button" class="dromos-ring-button is-earned" aria-label="[^"]*" aria-pressed="false">/);
	});

	it('stays a plain button on the home row, which selects nothing', () => {
		expect(renderToStaticMarkup(<SkillRingButton view={ring} onOpen={noop} renderIcon={noop} />)).toMatch(/^<button type="button" class="dromos-ring-button is-earned" aria-label="Reader, Level 1 · 40\/100">/);
	});
});

describe('SkillDetail (game-ui S9)', () => {
	it('shows an earned skill: the 96 px medallion, its name, level, stat and next-level bar', () => {
		const html = renderToStaticMarkup(<SkillDetail view={detailOf('lector')} renderIcon={noop} />);

		expect(html).toContain('<span class="dromos-ring is-earned" style="width:96px;height:96px" aria-hidden="true">');
		expect(html).not.toContain('dromos-ring-badge');
		expect(html).toContain('<h4 class="dromos-skill-detail-name">Reader</h4>');
		expect(html).toContain('<p class="dromos-skill-detail-level">Level 1 · Novice</p>');
		expect(html).toContain('<p class="dromos-skill-detail-rank">First pages.</p>');
		expect(html).toContain('<p class="dromos-skill-detail-feeds">Feeds · Intelligence</p>');
		expect(html).toMatch(/<span>Next level: 2<\/span><span>40 \/ 100 XP<\/span>/);
		expect(html).toMatch(/role="progressbar" aria-label="Experience of Reader" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40" aria-valuetext="40 \/ 100 XP"/);
		expect(html).not.toContain('dromos-skill-requirements');
	});

	it('says what counts, and lists the recent entries as task, XP and day', () => {
		const html = renderToStaticMarkup(<SkillDetail view={detailOf('lector')} renderIcon={noop} />);

		expect(html).toContain('<h5 class="dromos-skill-detail-title">What counts</h5><p class="dromos-skill-detail-text">You read books to the end.</p>');
		expect([...html.matchAll(/<li class="dromos-skill-entry">(.*?)<\/li>/g)].map((match) => (match[1] ?? '').replace(/<[^>]+>/g, ''))).toEqual([
			'Clean Architecture · +15 XP · 2 Nov',
			'Atomic Habits · −10 XP · 31 Oct',
		]);
		expect(html).not.toContain('No entries yet');
	});

	it('shows a locked skill: Locked, no XP bar, each requirement with its bar and met state, and no entries yet', () => {
		const html = renderToStaticMarkup(<SkillDetail view={detailOf('atleta')} renderIcon={noop} />);

		expect(html).toContain('<span class="dromos-ring is-locked" style="width:96px;height:96px" aria-hidden="true">');
		expect(html).toContain('<p class="dromos-skill-detail-level">Locked</p>');
		expect(html).not.toContain('Next level');
		expect([...html.matchAll(/<li( class="is-met")?><span class="dromos-skill-requirement-text">([^<]*)<\/span><div class="dromos-progress-track" role="progressbar" aria-label="[^"]*" aria-valuemin="0" aria-valuemax="100" aria-valuenow="(\d+)"/g)].map((match) => [match[2], match[3], match[1] !== undefined])).toEqual([
			['Habit streak: 15 of 20 days', '75', false],
			['Quests with this skill: 2 of 2', '100', true],
		]);
		expect(html).toContain('<p class="dromos-skill-detail-none">No entries yet</p>');
	});
});

describe('SkillsScreen (game-ui S9)', () => {
	const render = (selected: string | null = null) => renderToStaticMarkup(<SkillsScreen page={page} view={screen(selected)} onSelect={noop} renderIcon={noop} />);

	it('draws one grid of medallions, earned first, the selected one pressed', () => {
		expect([...render('atleta').matchAll(/<button type="button" class="dromos-ring-button[^"]*" aria-label="([^",]+)[^"]*" aria-pressed="(\w+)">/g)].map((match) => [match[1], match[2]])).toEqual([
			['Reader', 'false'],
			['Athlete', 'true'],
		]);
	});

	it('announces the detail when the selection changes', () => {
		expect(render()).toMatch(/<section class="dromos-section dromos-skill-detail-section" aria-label="Detail" aria-live="polite"><h3 class="dromos-card-title">Detail<\/h3>/);
	});

	it('selects the skill of the medallion chosen', () => {
		const chosen: string[] = [];
		const tree = SkillsScreen({ page, view: screen(), onSelect: (id) => chosen.push(id), renderIcon: noop });

		for (const element of componentsOf(tree, SkillRingButton)) (element.props.onOpen as (id: string) => void)(String((element.props.view as SkillRingView).id));

		expect(chosen).toEqual(['lector', 'atleta']);
	});

	it('keeps the problems on this screen', () => {
		expect(render()).toContain('<li>Skills/Cartographer.md: the stat is missing</li>');
	});

	it('keeps the empty states, with no detail', () => {
		const empty = skillsPageView({ ...IDLE_GAME, status: { kind: 'synced' }, skills: [] }, en);
		const html = renderToStaticMarkup(<SkillsScreen page={empty} view={skillsScreenView(empty, null, en)} onSelect={noop} renderIcon={noop} />);

		expect(html).toContain('No skill notes found in the Skills folder.');
		expect(html).not.toContain('dromos-skill-detail');
	});
});

describe('HomeScreen on the skills screen (game-ui S9)', () => {
	const html = renderToStaticMarkup(<HomeScreen deps={homeDeps({ game })} initialScreen="skills" />);

	it('shows the grid and the detail of the first skill', () => {
		expect(html).toMatch(/aria-label="Reader, [^"]*" aria-pressed="true"/);
		expect(html).toContain('<h4 class="dromos-skill-detail-name">Reader</h4>');
		expect(html).not.toContain('dromos-medallion');
	});

	it('nests its headings under the screen heading', () => {
		const levels = [...html.matchAll(/<h(\d)[^>]*>(.*?)<\/h\1>/g)].map((match) => [Number(match[1]), (match[2] ?? '').replace(/<[^>]+>/g, '')]);

		expect(levels).toEqual([
			[2, 'Skills'],
			[3, 'Medallions'],
			[3, 'Detail'],
			[4, 'Reader'],
			[5, 'What counts'],
			[5, 'Recent entries'],
		]);
	});
});
