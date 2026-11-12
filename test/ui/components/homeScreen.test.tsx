import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HomeScreen } from '../../../src/ui/containers/HomeScreen';
import { CharacterCard } from '../../../src/ui/organisms/CharacterCard';
import { IDLE_GAME, IDLE_QUESTS, homeDeps } from './homeDeps';

/** The character's plaque, which follows the scene before `<main>`, up to its closing `</section>`. */
function firstSection(html: string): string {
	const start = html.indexOf('<section class="dromos-card dromos-plaque');
	if (start < 0 || start > html.indexOf('<main')) return '';
	return html.slice(start, html.indexOf('</section>', start));
}

describe('HomeScreen puts the character on the plaque right after the scene (S2)', () => {
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
	it('keeps the character on the plaque when there is a level-up, which opens its panel first on the screen', () => {
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
	// game-ui S3 gave the view the level number, the title line and the next level; S9 the stats radar.
	const view = {
		name: 'Nicolás',
		title: 'Corredor',
		level: 3,
		levelText: 'Level 3',
		titleLine: 'Corredor · level 3',
		titleParts: ['Corredor', 'level 3'],
		xp: { current: 240, total: 520, percent: 46, text: '240 / 520 XP' },
		nextLevelText: 'Level 4 in 280 XP',
		radar: { max: 6, rings: [2, 4, 6], ariaLabel: 'Strength 2', axes: [{ id: 'fuerza' as const, shortLabel: 'STR', label: 'Strength', value: 2, text: 'Strength 2', reach: 2 / 6, x: 0, y: -1 }] },
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

describe('HomeScreen draws the figure before the vault is read (M11 S1)', () => {
	it('puts the young runner on the road, carrying nothing, until the stage is known', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps()} />);

		expect(html).toContain('<g class="dromos-walker is-runner"');
		expect(html).not.toMatch(/dromos-walker is-(?!runner)/);
		expect(html).not.toContain('dromos-avatar-thing');
	});
});
