import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HomeScreen } from '../../../src/ui/containers/HomeScreen';
import { CharacterCard } from '../../../src/ui/organisms/CharacterCard';
import { IDLE_GAME, IDLE_QUESTS, homeDeps } from './homeDeps';

/** The markup of the first element inside `<main>`, up to its closing `</section>`. */
function firstSection(html: string): string {
	const main = /<main[^>]*>/.exec(html);
	if (!main) return '';
	const rest = html.slice(main.index + main[0].length);
	return rest.startsWith('<section') ? rest.slice(0, rest.indexOf('</section>')) : '';
}

describe('HomeScreen puts the character first', () => {
	it('opens with the character, which holds the sync line and its button', () => {
		const section = firstSection(renderToStaticMarkup(<HomeScreen deps={homeDeps()} />));
		expect(section).toMatch(/^<section[^>]*aria-label="Character"/);
		expect(section).toContain('Not synced yet');
		expect(section).toMatch(/<button[^>]*class="dromos-sync-button"/);
	});

	it('marks only the loading text as busy, so the sync line can still be announced', () => {
		const section = firstSection(renderToStaticMarkup(<HomeScreen deps={homeDeps()} />));
		expect(/^<section[^>]*>/.exec(section)?.[0]).not.toContain('aria-busy');
		expect(section).toMatch(/<p[^>]*aria-busy="true"[^>]*>Loading the character…<\/p>/);
	});

	// game-ui S4: the ceremony panel under the card replaces the banner that sat inside it.
	it('keeps the character first when there is a level-up, which opens its panel under the card', () => {
		const game = { ...IDLE_GAME, events: [{ kind: 'character-level' as const, level: 4 }] };
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps({ game })} />);
		const section = firstSection(html);
		expect(section).toMatch(/^<section[^>]*aria-label="Character"/);
		expect(section).not.toContain('Dismiss');
		expect(html).toContain('You reached level 4');
	});

	// While offline the band above the scene says it (game-ui S10), so that case lives in screens.test.tsx.
	it('keeps a quiet sync line after a sync, and a prominent one when the sync fails', () => {
		const synced = renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: { quests: [], lastSyncedAt: new Date('2026-11-03T13:57:00Z'), status: { kind: 'synced' } } })} />);
		const failed = renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: { ...IDLE_QUESTS, status: { kind: 'error' } } })} />);
		expect(firstSection(synced)).toMatch(/class="dromos-banner is-success"/);
		expect(firstSection(failed)).toMatch(/class="dromos-banner is-error is-prominent"/);
	});
});

describe('CharacterCard', () => {
	// game-ui S3 gave the view the level number, the title line, the next level and the pips.
	const view = {
		name: 'Nicolás',
		title: 'Corredor',
		level: 3,
		levelText: 'Level 3',
		titleLine: 'Corredor · level 3',
		xp: { current: 240, total: 520, percent: 46, text: '240 / 520 XP' },
		nextLevelText: 'Level 4 in 280 XP',
		stats: [{ id: 'fuerza' as const, label: 'Strength', value: 2, pips: [true, true, false, false, false, false], ariaLabel: 'Strength 2' }],
	};

	// The landscape is now the scene above every screen (game-ui S1); screens.test.tsx checks it is aria-hidden.
	it('leaves the landscape to the scene above it and keeps the name, title, level, XP and stats', () => {
		const html = renderToStaticMarkup(<CharacterCard view={view} footer={<p>sync line</p>} />);
		expect(html).not.toContain('dromos-landscape');
		expect(html).toMatch(/<h2[^>]*>Nicolás<\/h2>/);
		for (const text of ['Corredor', 'Level 3', '240 / 520 XP', 'Strength', '<p>sync line</p>']) expect(html).toContain(text);
	});

	it('gives the name as the heading that takes the focus when the home screen opens', () => {
		const html = renderToStaticMarkup(<CharacterCard view={view} footer={null} />);
		expect(html).toMatch(/<h2[^>]*tabindex="-1"[^>]*data-screen-heading="true"[^>]*>Nicolás<\/h2>/);
	});
});
