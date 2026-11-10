import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { DeedEntry, GameSnapshot, QuestSnapshot } from '../../../src/application';
import { createTranslator } from '../../../src/i18n';
import { Campfire } from '../../../src/ui/atoms/Campfire';
import { HomeScreen } from '../../../src/ui/containers/HomeScreen';
import { I18nProvider } from '../../../src/ui/i18n';
import { Chronicle } from '../../../src/ui/organisms/Chronicle';
import { QuestList } from '../../../src/ui/organisms/QuestList';
import { Scene } from '../../../src/ui/organisms/Scene';
import { chronicleView } from '../../../src/ui/presenters/chronicleView';
import { questListView, questPanelView } from '../../../src/ui/presenters/questListView';
import { aQuest } from '../../fakes/quests';
import { IDLE_GAME, homeDeps, noop } from './homeDeps';

const en = createTranslator('en');
const es = createTranslator('es');
const TODAY = '2026-11-03';
const synced = (quests: QuestSnapshot['quests']): QuestSnapshot => ({ quests, lastSyncedAt: new Date('2026-11-03T12:00:00Z'), status: { kind: 'synced' } });
const scene = (props: Partial<Parameters<typeof Scene>[0]> = {}): string => renderToStaticMarkup(<Scene screen="home" offline={false} onGo={noop} onSettings={null} {...props} />);
const sceneOf = (html: string): string => /<div class="dromos-scene[^"]*"[^>]*>(.*?)<main/.exec(html)?.[0] ?? '';
const deed = (overrides: Partial<DeedEntry> = {}): DeedEntry => ({ date: '2026-11-02', task: 'Read 20 pages', xp: 10, source: 'complete', skills: [{ id: 'lector', name: 'Reader' }], ...overrides });
const withDeeds = (deeds: readonly DeedEntry[] | undefined): GameSnapshot => ({ ...IDLE_GAME, status: { kind: 'synced' }, deeds });

describe('Campfire (game-ui S17)', () => {
	it('is drawn in the line style of the scene: a glow, a flame of tongues, logs and stones, every color a token', () => {
		const html = renderToStaticMarkup(<Campfire />);

		expect(html).toMatch(/^<g class="dromos-campfire" transform="translate\([\d.]+ [\d.]+\)">/);
		for (const part of ['dromos-campfire-glow', 'dromos-campfire-flame', 'dromos-campfire-tongue is-outer', 'dromos-campfire-tongue is-inner', 'dromos-campfire-log', 'dromos-campfire-stones']) expect(html).toContain(part);
		expect(html).not.toMatch(/(fill|stroke|stop-color)="#/);
	});
});

describe('Scene: the campfire burns only on a complete day (game-ui S17)', () => {
	it('lights the campfire inside the drawing, before the walker, when it is told to', () => {
		const html = scene({ campfire: true });

		expect(html).toContain('<g class="dromos-campfire"');
		expect(html.indexOf('dromos-campfire')).toBeLessThan(html.indexOf('dromos-walker'));
		expect(html.indexOf('dromos-campfire')).toBeLessThan(html.indexOf('</svg>'));
		expect(scene()).not.toContain('dromos-campfire');
	});

	it('on the home screen, lights it when every daily is done, and not before the first quest sync or with one pending', () => {
		const done = synced([aQuest('d1', { completed: true }), aQuest('d2', { completed: true }), aQuest('t1', { type: 'todo' })]);
		const pending = synced([aQuest('d1', { completed: true }), aQuest('d2')]);
		const todosOnly = synced([aQuest('t1', { type: 'todo', completed: true })]);
		const html = (quests: QuestSnapshot) => renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests })} />);

		expect(sceneOf(html(done))).toContain('dromos-campfire');
		expect(html(done)).toContain('Day complete');
		expect(sceneOf(html(pending))).not.toContain('dromos-campfire');
		expect(sceneOf(html(todosOnly))).not.toContain('dromos-campfire');
		expect(sceneOf(html({ quests: null, lastSyncedAt: null, status: { kind: 'idle' } }))).not.toContain('dromos-campfire');
	});

	it('keeps it on the other screens of a complete day, since the world is the same', () => {
		const done = synced([aQuest('d1', { completed: true })]);

		expect(sceneOf(renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: done })} initialScreen="skills" />))).toContain('dromos-campfire');
	});
});

describe('Scene: the time of day (game-ui S17)', () => {
	it('carries the period as a data attribute, day when none is given', () => {
		expect(scene({ period: 'dusk' })).toMatch(/^<div class="dromos-scene" data-period="dusk">/);
		expect(scene()).toMatch(/^<div class="dromos-scene" data-period="day">/);
		expect(renderToStaticMarkup(<Scene screen="skills" offline period="night" onGo={noop} onSettings={null} />)).toMatch(/^<div class="dromos-scene is-offline" data-period="night">/);
	});

	it('on the home screen, follows the hour of the injected clock', () => {
		const at = (hours: number) => {
			const deps = homeDeps();
			return renderToStaticMarkup(<HomeScreen deps={{ ...deps, clock: { today: () => TODAY, now: () => new Date(2026, 10, 3, hours, 30) } }} />);
		};

		expect([at(6), at(12), at(19), at(23)].map((html) => /data-period="(\w+)"/.exec(html)?.[1])).toEqual(['dawn', 'day', 'dusk', 'night']);
	});

	it('draws the sun inside a group the period raises or lowers, so the sky changes only through tokens', () => {
		const html = scene();

		expect(html).toMatch(/<g class="dromos-scene-sun-height"><circle class="dromos-scene-sun"/);
	});
});

describe('QuestList: where quests are completed (game-ui S14)', () => {
	it('closes with a quiet note under the panel, in both languages', () => {
		const panel = (t = en) =>
			renderToStaticMarkup(
				<I18nProvider t={t}>
					<QuestList view={questPanelView(questListView([aQuest('d1')], TODAY, t), t)} />
				</I18nProvider>,
			);

		expect(panel()).toMatch(/<\/div><p class="dromos-quest-note">Complete quests in Habitica · Dromos picks them up on sync<\/p><\/section>$/);
		expect(panel(es)).toContain('<p class="dromos-quest-note">Completa las quests en Habitica · Dromos las recoge al sincronizar</p>');
	});

	it('keeps the note with the empty states too', () => {
		expect(renderToStaticMarkup(<QuestList view={questPanelView(questListView(null, TODAY, en), en)} />)).toContain('dromos-quest-note');
	});
});

describe('Chronicle (game-ui S18)', () => {
	it('is a section headed "Chronicle" like the others, with one journal line per deed', () => {
		const view = chronicleView([deed({ date: TODAY, source: 'streak', xp: 5, skills: [] }), deed(), deed({ source: 'revert', xp: -10, skills: [] })], TODAY, en);
		if (!view) throw new Error('no chronicle');
		const html = renderToStaticMarkup(<Chronicle view={view} />);

		expect(html).toMatch(/^<section class="dromos-section dromos-chronicle" aria-label="Chronicle"><h2 class="dromos-card-title">Chronicle<\/h2><div class="dromos-panel dromos-chronicle-panel"><ol class="dromos-deeds">/);
		expect([...html.matchAll(/<li class="dromos-deed[^"]*">(.*?)<\/li>/g)].map((match) => (match[1] ?? '').replace(/<[^>]+>/g, '').replaceAll(' ', ' '))).toEqual([
			'Today · Streak bonus · +5 XP',
			'Yesterday · Read 20 pages · Reader +10 XP',
			'Yesterday · Undone · Read 20 pages · −10 XP',
		]);
		expect(html).toContain('<li class="dromos-deed is-undone">');
	});

	it('speaks Spanish', () => {
		const view = chronicleView([deed({ source: 'revert', xp: -10, skills: [] })], TODAY, es);
		if (!view) throw new Error('no chronicle');
		const html = renderToStaticMarkup(<Chronicle view={view} />);

		expect(html).toContain('aria-label="Crónica"');
		expect(html.replace(/<[^>]+>/g, '').replaceAll(' ', ' ')).toContain('Ayer · Deshecho · Read 20 pages · −10 XP');
	});
});

describe('HomeScreen: the chronicle (game-ui S18)', () => {
	it('comes last in the second column, after the campaigns, on the home screen only (home-header S1)', () => {
		const deps = homeDeps({ game: withDeeds([deed()]) });
		const home = renderToStaticMarkup(<HomeScreen deps={deps} />);

		expect(home.indexOf('dromos-chronicle')).toBeGreaterThan(home.indexOf('dromos-campaigns'));
		expect(home).toMatch(/<section class="dromos-section dromos-chronicle"[^>]*>.*<\/section><\/div><\/main>/);
		expect(home).toContain('Yesterday');
		expect(renderToStaticMarkup(<HomeScreen deps={deps} initialScreen="skills" />)).not.toContain('dromos-chronicle');
		expect(renderToStaticMarkup(<HomeScreen deps={deps} initialScreen="campaigns" />)).not.toContain('dromos-chronicle');
	});

	it('shows nothing before the first game sync or while the ledger has no deed', () => {
		expect(renderToStaticMarkup(<HomeScreen deps={homeDeps({ game: withDeeds(undefined) })} />)).not.toContain('dromos-chronicle');
		expect(renderToStaticMarkup(<HomeScreen deps={homeDeps({ game: withDeeds([]) })} />)).not.toContain('dromos-chronicle');
	});
});
