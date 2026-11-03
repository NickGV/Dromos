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

	it('shows a level-up as a ribbon inside the character, not above it', () => {
		const game = { ...IDLE_GAME, events: [{ kind: 'character-level' as const, level: 4 }] };
		const section = firstSection(renderToStaticMarkup(<HomeScreen deps={homeDeps({ game })} />));
		expect(section).toMatch(/^<section[^>]*aria-label="Character"/);
		expect(section).toContain('You reached level 4.');
		expect(section).toContain('Dismiss');
	});

	it('keeps a quiet sync line after a sync, and a prominent one when Habitica cannot be reached', () => {
		const synced = renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: { quests: [], lastSyncedAt: new Date('2026-11-03T13:57:00Z'), status: { kind: 'synced' } } })} />);
		const offline = renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: { ...IDLE_QUESTS, status: { kind: 'offline' } } })} />);
		expect(firstSection(synced)).toMatch(/class="dromos-banner is-success"/);
		expect(firstSection(offline)).toMatch(/class="dromos-banner is-warning is-prominent"/);
	});
});

describe('CharacterCard', () => {
	it('opens with the landscape, a drawing screen readers skip', () => {
		const view = { name: 'Nicolás', title: 'Corredor', levelText: 'Level 3', xp: { current: 240, total: 520, percent: 46, text: '240 / 520 XP' }, stats: [] };
		const html = renderToStaticMarkup(<CharacterCard view={view} ribbon={null} footer={null} />);
		expect(html).toMatch(/^<section[^>]*><svg[^>]*class="dromos-landscape"[^>]*aria-hidden="true"/);
	});
});
