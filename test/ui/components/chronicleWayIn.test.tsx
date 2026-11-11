import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { DeedEntry, GameSnapshot, WeekEntry } from '../../../src/application';
import { createTranslator } from '../../../src/i18n';
import { HomeScreen } from '../../../src/ui/containers/HomeScreen';
import { Signpost } from '../../../src/ui/molecules/Signpost';
import { Chronicle } from '../../../src/ui/organisms/Chronicle';
import { chronicleView } from '../../../src/ui/presenters/chronicleView';
import { elementsOf } from './elements';
import { IDLE_GAME, homeDeps, noop } from './homeDeps';

const en = createTranslator('en');
/** The test clock's day, a Tuesday: the current week starts on Monday 2 November. */
const TODAY = '2026-11-03';
const ZERO = { fuerza: 0, vitalidad: 0, inteligencia: 0, sabiduria: 0, espiritu: 0, disciplina: 0 };

const deed = (overrides: Partial<DeedEntry> = {}): DeedEntry => ({ date: '2026-11-02', task: 'Read 20 pages', xp: 10, source: 'complete', skills: [{ id: 'lector', name: 'Reader' }], ...overrides });
const HISTORY: WeekEntry[] = [
	{ start: '2026-10-26', xp: 40, previousXp: null, days: [0, 0, 0, 0, 40, 0, 0], statXp: { ...ZERO, sabiduria: 40 }, unskilledXp: 0, deeds: [deed({ date: '2026-10-30', xp: 40 })] },
	{ start: '2026-11-02', xp: 25, previousXp: 40, days: [10, 15, 0, 0, 0, 0, 0], statXp: { ...ZERO, sabiduria: 10 }, unskilledXp: 15, deeds: [deed({ date: TODAY, task: 'Stretch', xp: 15, skills: [] }), deed()] },
];
const game = (overrides: Partial<GameSnapshot> = {}): GameSnapshot => ({ ...IDLE_GAME, status: { kind: 'synced' }, deeds: [deed()], history: HISTORY, ...overrides });

describe('Chronicle on home: the way into the history (M9 S3)', () => {
	it('offers "View history" also while the ledger has fewer than three deeds, and it opens the history', () => {
		const chronicle = chronicleView([deed()], TODAY, en);
		if (!chronicle) throw new Error('no chronicle');
		const onOpenHistory = vi.fn();

		const html = renderToStaticMarkup(<Chronicle view={chronicle} listId="dromos-chronicle-1" onOpenHistory={onOpenHistory} />);
		const button = elementsOf(Chronicle({ view: chronicle, listId: 'dromos-chronicle-1', onOpenHistory })).find((element) => element.props.className === 'dromos-btn is-small dromos-chronicle-history');
		(button?.props.onClick as () => void)();

		expect(html).toContain('<button type="button" class="dromos-btn is-small dromos-chronicle-history">View history</button>');
		expect(html).not.toContain('dromos-list-toggle');
		expect(onOpenHistory).toHaveBeenCalledTimes(1);
	});

	it('keeps "View more" beside it once there are more than three deeds', () => {
		const chronicle = chronicleView([deed(), deed(), deed(), deed()], TODAY, en);
		if (!chronicle) throw new Error('no chronicle');

		const html = renderToStaticMarkup(<Chronicle view={chronicle} listId="dromos-chronicle-1" onToggleMore={noop} onOpenHistory={noop} />);

		expect(html).toMatch(/<div class="dromos-chronicle-actions"><button[^>]*dromos-list-toggle[^>]*>View more \(1\)<\/button><button[^>]*dromos-chronicle-history[^>]*>View history<\/button><\/div>/);
	});

	it('shows it on home, in Spanish too', () => {
		expect(renderToStaticMarkup(<HomeScreen deps={homeDeps({ game: game() })} />)).toContain('>View history</button>');
		expect(renderToStaticMarkup(<HomeScreen deps={homeDeps({ game: game(), language: 'es' })} />)).toContain('>Ver historial</button>');
	});
});

describe('HomeScreen: the Chronicle screen (M9 S3)', () => {
	const planks = (html: string): string[] => [...html.matchAll(/<button[^>]*class="dromos-plank[^"]*"[^>]*>(.*?)<\/button>/g)].map((match) => match[1] ?? '');
	const currentPlank = (html: string): string[] => [...html.matchAll(/<button[^>]*class="dromos-plank is-current"[^>]*aria-current="page"[^>]*>(.*?)<\/button>/g)].map((match) => match[1] ?? '');

	it('shows the header card, the weeks and nothing of home, the signpost with its five planks and Path burnt in', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps({ game: game(), openSettings: noop })} initialScreen="chronicle" />);
		const main = /<main[^>]*>(.*)<\/main>/.exec(html)?.[1] ?? '';

		expect(planks(html)).toEqual(['Path', 'Campaigns', 'Skills', 'Library', 'Settings']);
		expect(currentPlank(html)).toEqual(['Path']);
		expect(main).toMatch(/<header class="dromos-panel dromos-screen-header has-back">.*<h2[^>]*>Chronicle<\/h2><\/header>/);
		expect(main).toContain('dromos-weeks');
		for (const section of ['dromos-quests', 'dromos-campaigns', 'dromos-chronicle', 'dromos-skills', 'dromos-library']) expect(main).not.toContain(section);
	});

	it('leaves one screen heading, the header card\'s, for the focus to move to when the screen opens', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps({ game: game() })} initialScreen="chronicle" />);

		expect(html.match(/data-screen-heading/g)).toHaveLength(1);
		expect(html).toMatch(/<h2 class="dromos-screen-title" tabindex="-1" data-screen-heading="true">Chronicle<\/h2>/);
	});

	it('says in Spanish "Crónica" and "← Camino"', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps({ game: game(), language: 'es' })} initialScreen="chronicle" />);

		expect(html).toMatch(/aria-label="Volver al camino"><span aria-hidden="true">←<\/span>Camino<\/button><h2[^>]*>Crónica<\/h2>/);
	});

	it('says the ledger is empty before the first game sync', () => {
		expect(renderToStaticMarkup(<HomeScreen deps={homeDeps()} initialScreen="chronicle" />)).toContain('No deeds in the ledger yet.');
	});
});

describe('Signpost on the Chronicle screen (M9 S3)', () => {
	it('keeps its five planks and burns Path in, as the screen belongs to the path', () => {
		const html = renderToStaticMarkup(<Signpost current="chronicle" onGo={noop} onSettings={noop} />);

		expect(html.match(/<button type="button"/g)).toHaveLength(5);
		expect(html).toMatch(/<button type="button" class="dromos-plank is-current" aria-current="page">Path<\/button>/);
		expect(html.match(/aria-current/g)).toHaveLength(1);
	});
});
