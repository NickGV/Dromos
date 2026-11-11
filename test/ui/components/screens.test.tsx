import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { QuestSnapshot } from '../../../src/application';
import { createTranslator } from '../../../src/i18n';
import { Landscape } from '../../../src/ui/atoms/Landscape';
import { HomeScreen } from '../../../src/ui/containers/HomeScreen';
import { I18nProvider } from '../../../src/ui/i18n';
import { Signpost, type DromosScreen } from '../../../src/ui/molecules/Signpost';
import { ScreenHeader } from '../../../src/ui/organisms/ScreenHeader';
import { IDLE_GAME, IDLE_QUESTS, homeDeps, noop } from './homeDeps';

/** The accessible name and the text of every plank of the signpost, in order; the current one's name is its text. */
function planks(html: string): string[][] {
	return [...html.matchAll(/<button[^>]*class="dromos-plank[^"]*"[^>]*>(.*?)<\/button>/g)].map((match) => [/aria-label="([^"]*)"/.exec(match[0])?.[1] ?? match[1] ?? '', match[1] ?? '']);
}

/** The plank marked as the screen on show, by its text. */
function currentPlank(html: string): string[] {
	return [...html.matchAll(/<button[^>]*class="dromos-plank is-current"[^>]*aria-current="page"[^>]*>(.*?)<\/button>/g)].map((match) => match[1] ?? '');
}

/**
 * The markup of the first element inside `<main>`. The columns of home (home-header S1) are layout
 * only, drawn on every screen; off home they hold the screen's own content, so they are skipped.
 */
function firstInMain(html: string): string {
	const main = /<main[^>]*>/.exec(html);
	const rest = main ? html.slice(main.index + main[0].length) : '';
	return rest.replace(/^(?:<div class="dromos-home-column is-(?:start|end)">(?:<\/div>)?)+/, '');
}

const at = (iso: string): Date => new Date(iso);
const quests = (status: QuestSnapshot['status'], lastSyncedAt: Date | null = at('2026-11-03T12:00:00Z')): QuestSnapshot => ({ quests: [], lastSyncedAt, status });

describe('Signpost', () => {
	it('always shows its six planks in a fixed order, the one of the current screen burnt in and marked as the page (game-ui S14, M7 S5, M10 S4)', () => {
		const html = (current: DromosScreen) => renderToStaticMarkup(<Signpost current={current} onGo={noop} onSettings={noop} />);

		expect(planks(html('home'))).toEqual([
			['Path', 'Path'],
			['Go to Campaigns', 'Campaigns'],
			['Go to Skills', 'Skills'],
			['Go to Library', 'Library'],
			['Go to Shop', 'Shop'],
			['Go to Settings', 'Settings'],
		]);
		expect(planks(html('campaigns'))).toEqual([
			['Go to Path', 'Path'],
			['Campaigns', 'Campaigns'],
			['Go to Skills', 'Skills'],
			['Go to Library', 'Library'],
			['Go to Shop', 'Shop'],
			['Go to Settings', 'Settings'],
		]);
		expect(planks(html('library'))).toEqual([
			['Go to Path', 'Path'],
			['Go to Campaigns', 'Campaigns'],
			['Go to Skills', 'Skills'],
			['Library', 'Library'],
			['Go to Shop', 'Shop'],
			['Go to Settings', 'Settings'],
		]);
		expect(planks(html('shop'))).toEqual([
			['Go to Path', 'Path'],
			['Go to Campaigns', 'Campaigns'],
			['Go to Skills', 'Skills'],
			['Go to Library', 'Library'],
			['Shop', 'Shop'],
			['Go to Settings', 'Settings'],
		]);
		expect(planks(html('skills')).map(([, text]) => text)).toEqual(['Path', 'Campaigns', 'Skills', 'Library', 'Shop', 'Settings']);
		expect([currentPlank(html('home')), currentPlank(html('campaigns')), currentPlank(html('skills')), currentPlank(html('library')), currentPlank(html('shop'))]).toEqual([['Path'], ['Campaigns'], ['Skills'], ['Library'], ['Shop']]);
		expect(html('home').match(/aria-current/g)).toHaveLength(1);
		expect(html('library').match(/aria-current/g)).toHaveLength(1);
		expect(html('shop').match(/aria-current/g)).toHaveLength(1);
	});

	it('keeps the other planks named "Go to X" as before, and no plank disabled', () => {
		const html = renderToStaticMarkup(<Signpost current="skills" onGo={noop} onSettings={noop} />);

		expect(html).not.toContain('disabled');
		expect(planks(html).map(([name]) => name)).toEqual(['Go to Path', 'Go to Campaigns', 'Skills', 'Go to Library', 'Go to Shop', 'Go to Settings']);
	});

	it('speaks Spanish when the interface does', () => {
		const html = renderToStaticMarkup(
			<I18nProvider t={createTranslator('es')}>
				<Signpost current="campaigns" onGo={noop} onSettings={noop} />
			</I18nProvider>,
		);
		expect(planks(html)).toEqual([
			['Ir a Camino', 'Camino'],
			['Campañas', 'Campañas'],
			['Ir a Skills', 'Skills'],
			['Ir a Biblioteca', 'Biblioteca'],
			['Ir a Tienda', 'Tienda'],
			['Ir a Ajustes', 'Ajustes'],
		]);
	});

	it('hides the settings plank where the settings cannot be opened', () => {
		expect(planks(renderToStaticMarkup(<Signpost current="home" onGo={noop} onSettings={null} />)).map(([name]) => name)).toEqual(['Path', 'Go to Campaigns', 'Go to Skills', 'Go to Library', 'Go to Shop']);
	});

	it('is a navigation landmark of buttons', () => {
		const html = renderToStaticMarkup(<Signpost current="home" onGo={noop} onSettings={noop} />);
		expect(html).toMatch(/^<nav[^>]*class="dromos-signpost"[^>]*aria-label="Sections"/);
		expect(html.match(/<button type="button"/g)).toHaveLength(6);
	});
});

describe('HomeScreen signpost', () => {
	it('offers the settings plank only when the settings can be opened', () => {
		expect(planks(renderToStaticMarkup(<HomeScreen deps={homeDeps()} />)).map(([name]) => name)).toEqual(['Path', 'Go to Campaigns', 'Go to Skills', 'Go to Library', 'Go to Shop']);
		expect(planks(renderToStaticMarkup(<HomeScreen deps={homeDeps({ openSettings: noop })} />)).map(([name]) => name)).toEqual(['Path', 'Go to Campaigns', 'Go to Skills', 'Go to Library', 'Go to Shop', 'Go to Settings']);
		expect(currentPlank(renderToStaticMarkup(<HomeScreen deps={homeDeps()} initialScreen="campaigns" />))).toEqual(['Campaigns']);
	});

	it('leaves the signpost out of the drawing that screen readers skip', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps()} />);
		const scene = /<div class="dromos-scene[^"]*"[^>]*>(.*?)<main/.exec(html)?.[1] ?? '';
		expect(scene).toMatch(/^<svg[^>]*aria-hidden="true"/);
		expect(scene.indexOf('<nav')).toBeGreaterThan(scene.indexOf('</svg>'));
	});
});

describe('Landscape', () => {
	it('is the design scene, hidden from screen readers', () => {
		const html = renderToStaticMarkup(<Landscape />);
		expect(html).toMatch(/^<svg[^>]*class="dromos-landscape"/);
		expect(html).toMatch(/^<svg[^>]*viewBox="0 0 960 300"/);
		expect(html).toMatch(/^<svg[^>]*preserveAspectRatio="xMidYMax slice"/);
		expect(html).toMatch(/^<svg[^>]*aria-hidden="true"/);
	});

	it('takes every color from a token, so the night can repaint it', () => {
		const html = renderToStaticMarkup(<Landscape />);
		expect(html).not.toMatch(/(fill|stroke|stop-color)="#/);
	});

	it('gives its sky gradient an id of its own, so two open views do not share it', () => {
		const html = renderToStaticMarkup(<Landscape />);
		const id = /<linearGradient id="([^"]+)"/.exec(html)?.[1];
		expect(id).toBeTruthy();
		expect(id).not.toContain(':');
		expect(html).toContain(`fill="url(#${id})"`);
	});
});

describe('ScreenHeader', () => {
	it('names the screen and draws no character line, which the plaque holds now (S2)', () => {
		const html = renderToStaticMarkup(<ScreenHeader title="Campaigns" />);
		expect(html).toBe('<header class="dromos-panel dromos-screen-header"><h2 class="dromos-screen-title" tabindex="-1" data-screen-heading="true">Campaigns</h2></header>');
		expect(html).not.toContain('dromos-screen-character');
	});

	it('offers a way back above the title when given one (M7 S5), and none otherwise', () => {
		const html = renderToStaticMarkup(<ScreenHeader title="Teología · 4" back={{ label: 'Library', ariaLabel: 'Back to the library', onBack: noop }} />);

		expect(html).toMatch(/^<header[^>]*><button type="button" class="dromos-screen-back" aria-label="Back to the library"><span aria-hidden="true">←<\/span>Library<\/button><h2[^>]*>Teología · 4<\/h2><\/header>$/);
		expect(renderToStaticMarkup(<ScreenHeader title="Skills" />)).not.toContain('<button');
	});

	it('is the heading that takes the focus when the screen opens', () => {
		const html = renderToStaticMarkup(<ScreenHeader title="Skills" />);
		expect(html).toMatch(/<h2[^>]*tabindex="-1"[^>]*data-screen-heading="true"/);
	});
});

/** The character's plaque: the section labelled "Character". */
function plaqueOf(html: string): string {
	return /<section class="dromos-card dromos-plaque[^"]*" aria-label="Character">.*?<\/section>/.exec(html)?.[0] ?? '';
}

describe('HomeScreen screens', () => {
	it('opens the other screens with the header card, which no longer names the character', () => {
		const campaigns = firstInMain(renderToStaticMarkup(<HomeScreen deps={homeDeps()} initialScreen="campaigns" />));
		const skills = firstInMain(renderToStaticMarkup(<HomeScreen deps={homeDeps()} initialScreen="skills" />));
		expect(campaigns).toMatch(/^<header[^>]*class="dromos-panel dromos-screen-header"/);
		expect(campaigns).toMatch(/^<header[^>]*>(?:(?!<\/header>).)*<h2[^>]*>Campaigns<\/h2><\/header>/);
		expect(skills).toMatch(/^<header[^>]*>(?:(?!<\/header>).)*<h2[^>]*>Skills<\/h2><\/header>/);
	});

	it('draws the plaque on every screen, right after the scene and before the screen, with the sync line (S2)', () => {
		for (const screen of ['home', 'campaigns', 'skills', 'library'] as const) {
			const html = renderToStaticMarkup(<HomeScreen deps={homeDeps()} initialScreen={screen} />);
			const header = /<div class="dromos-header">(.*?)<main/.exec(html)?.[1] ?? '';

			expect(header).toMatch(/^<div class="dromos-scene"[^>]*>.*<\/nav><\/div><section class="dromos-card dromos-plaque[^"]*" aria-label="Character">/);
			expect(plaqueOf(html)).toContain('Loading the character…');
			expect(plaqueOf(html)).toMatch(/<div class="dromos-sync-line">.*class="dromos-sync-button"/);
			expect(html.match(/aria-label="Character"/g)).toHaveLength(1);
		}
	});

	it('leaves one screen heading on the other screens, the header card\'s, outside the plaque', () => {
		for (const screen of ['campaigns', 'skills', 'library'] as const) {
			const html = renderToStaticMarkup(<HomeScreen deps={homeDeps()} initialScreen={screen} />);

			expect(html.match(/data-screen-heading/g)).toHaveLength(1);
			expect(plaqueOf(html)).not.toContain('data-screen-heading');
		}
	});

	it('keeps the home screen without a header card, the character out of the screen', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps()} />);
		const main = /<main[^>]*>.*<\/main>/.exec(html)?.[0] ?? '';
		expect(html).not.toContain('dromos-screen-header');
		expect(main).not.toContain('aria-label="Character"');
		for (const section of ['dromos-quests', 'dromos-campaigns']) expect(main).toContain(section);
	});

	it('shows only the campaigns on the campaigns screen, and only the skills on the skills screen', () => {
		const campaigns = renderToStaticMarkup(<HomeScreen deps={homeDeps()} initialScreen="campaigns" />);
		const skills = renderToStaticMarkup(<HomeScreen deps={homeDeps()} initialScreen="skills" />);
		expect(campaigns).toContain('dromos-campaigns');
		expect(campaigns).not.toContain('dromos-quests');
		expect(campaigns).not.toContain('dromos-skills');
		expect(skills).toContain('dromos-skills');
		expect(skills).not.toContain('dromos-quests');
		expect(skills).not.toContain('dromos-campaigns');
	});

	it('opens the library with its header card, its plank burnt in, and nothing of the other screens (M7 S5)', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps()} initialScreen="library" />);

		expect(currentPlank(html)).toEqual(['Library']);
		expect(firstInMain(html)).toMatch(/^<header[^>]*class="dromos-panel dromos-screen-header"[^>]*>(?:(?!<\/header>).)*<h2[^>]*>Library<\/h2><\/header>/);
		expect(html).toContain('Opening the library…');
		for (const section of ['dromos-quests', 'dromos-campaigns', 'dromos-skills', 'dromos-chronicle']) expect(html).not.toContain(section);
		expect(renderToStaticMarkup(<HomeScreen deps={homeDeps({ language: 'es' })} initialScreen="library" />)).toMatch(/<h2[^>]*>Biblioteca<\/h2>/);
	});

	it('keeps the library off the other screens', () => {
		for (const screen of ['home', 'campaigns', 'skills', 'shop'] as const) expect(renderToStaticMarkup(<HomeScreen deps={homeDeps()} initialScreen={screen} />)).not.toContain('dromos-library');
	});

	it('draws the same scene on every screen, as tall as the home screen had it (S2)', () => {
		for (const screen of ['home', 'campaigns', 'skills', 'library', 'shop'] as const) {
			expect(renderToStaticMarkup(<HomeScreen deps={homeDeps()} initialScreen={screen} />)).toContain('<div class="dromos-scene" data-period="day">');
		}
	});
});

describe('HomeScreen home layout (S1)', () => {
	const deed = { date: '2026-11-02', task: 'Read 20 pages', xp: 10, source: 'complete' as const, skills: [] };
	const game = { ...IDLE_GAME, status: { kind: 'synced' as const }, deeds: [deed] };

	it('puts the quests in the first column, and the campaigns then the chronicle in the second', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps({ game })} />);
		const main = /<main[^>]*>(.*)<\/main>/.exec(html)?.[1] ?? '';

		expect(main).toMatch(/^<div class="dromos-home-column is-start"><section class="dromos-section dromos-quests"/);
		const end = main.slice(main.indexOf('<div class="dromos-home-column is-end">'));
		expect(end).toMatch(/^<div class="dromos-home-column is-end"><section class="dromos-section dromos-campaigns"/);
		expect(end.indexOf('dromos-chronicle')).toBeGreaterThan(end.indexOf('dromos-campaigns'));
		expect(main.indexOf('dromos-home-column is-end')).toBeGreaterThan(main.indexOf('dromos-quests'));
	});

	it('opens the level-up panel above both columns', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps({ game: { ...game, events: [{ kind: 'character-level', level: 4 }] } })} />);

		expect(html).toMatch(/<main[^>]*><section class="dromos-card dromos-ceremony"[^>]*>.*?<\/section><div class="dromos-home-column is-start">/);
	});

	it('keeps the columns on every screen, so the campaigns panel keeps its parent and stays mounted', () => {
		for (const screen of ['home', 'campaigns', 'skills', 'library'] as const) {
			const html = renderToStaticMarkup(<HomeScreen deps={homeDeps({ game })} initialScreen={screen} />);
			expect(html.match(/<div class="dromos-home-column is-(start|end)">/g)).toEqual(['<div class="dromos-home-column is-start">', '<div class="dromos-home-column is-end">']);
		}
		const campaigns = renderToStaticMarkup(<HomeScreen deps={homeDeps()} initialScreen="campaigns" />);
		expect(campaigns).toMatch(/<div class="dromos-home-column is-end"><header class="dromos-panel dromos-screen-header"><h2[^>]*>Campaigns<\/h2><\/header><div class="dromos-campaign-screen/);
	});

	it('leaves the reading desk out while the library loads, and the library to its own screen', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps({ game })} />);

		expect(html).not.toContain('dromos-reading-desk');
		expect(html).not.toContain('dromos-library-room');
	});
});

describe('HomeScreen offline', () => {
	it('shows the band above the scene only while the quests are offline', () => {
		const offline = renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: quests({ kind: 'offline' }) })} />);
		expect(offline).toMatch(/<div class="dromos-band">(?:(?!<\/div>).)*Last known state · 2 h ago/);
		expect(offline.indexOf('dromos-band')).toBeLessThan(offline.indexOf('dromos-scene'));
		for (const status of [{ kind: 'synced' }, { kind: 'error' }, { kind: 'unauthorized' }, { kind: 'idle' }] as const) {
			expect(renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: quests(status) })} />)).not.toContain('dromos-band');
		}
	});

	it('says it in Spanish, and without a time when nothing was fetched this session', () => {
		expect(renderToStaticMarkup(<HomeScreen deps={homeDeps({ language: 'es', quests: quests({ kind: 'offline' }) })} />)).toContain('Último estado conocido · hace 2 h');
		const never = renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: quests({ kind: 'offline' }, null) })} />);
		expect(never).toMatch(/<span>Last known state<\/span>/);
	});

	it('takes the color out of the scene while offline', () => {
		expect(renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: quests({ kind: 'offline' }) })} />)).toContain('class="dromos-scene is-offline"');
		expect(renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: quests({ kind: 'error' }) })} />)).toContain('class="dromos-scene"');
	});

	it('still announces going offline through the hidden live region, though the line shows only Sync (S12)', () => {
		const offline = renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: quests({ kind: 'offline' }) })} />);
		const syncLine = /<div class="dromos-sync-line">(.*?)<\/section>/.exec(offline)?.[1] ?? '';
		expect(syncLine).toMatch(/<span class="dromos-visually-hidden" role="status" aria-live="polite">Offline<\/span>/);
	});

	it('keeps the same live region element between syncing and offline, so only its text changes (S12)', () => {
		// React keeps a DOM node when the element type and position stay the same: the banner's
		// <div> first in the line, its live <span> third, with the hidden message slots left empty.
		const shape = (html: string) => {
			const line = /<div class="dromos-sync-line">(.*?)<\/section>/.exec(html)?.[1] ?? '';
			return /^<div class="dromos-banner[^"]*">(.*?)<\/div><button/.exec(line)?.[1] ?? null;
		};
		const syncing = shape(renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: quests({ kind: 'syncing' }) })} />));
		const offline = shape(renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: quests({ kind: 'offline' }) })} />));
		expect(syncing).toMatch(/<span class="dromos-visually-hidden" role="status" aria-live="polite">[^<]+<\/span>$/);
		expect(offline).toBe('<span class="dromos-visually-hidden" role="status" aria-live="polite">Offline</span>');
	});

	it('lets the band tell it, so the sync line shows only Sync while offline (game-ui S14); other failures keep the prominent banner', () => {
		const offline = renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: quests({ kind: 'offline' }) })} />);
		const error = renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: quests({ kind: 'error' }) })} />);
		const syncLine = (html: string) => /<div class="dromos-sync-line">(.*?)<\/section>/.exec(html)?.[1] ?? '';
		expect(syncLine(offline)).not.toContain('dromos-banner-message');
		expect(syncLine(offline)).toMatch(/^<div class="dromos-banner is-quiet"><span class="dromos-visually-hidden"[^>]*>[^<]*<\/span><\/div><button[^>]*class="dromos-sync-button"[^>]*>.*Sync<\/button><\/div>$/);
		expect(syncLine(renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: quests({ kind: 'synced' }) })} />))).toContain('Synced 2 h ago');
		expect(error).toContain('class="dromos-banner is-error is-prominent"');
		expect(renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: { ...IDLE_QUESTS, status: { kind: 'unauthorized' } } })} />)).toContain('class="dromos-banner is-error is-prominent"');
	});
});
