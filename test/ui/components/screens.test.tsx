import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { QuestSnapshot } from '../../../src/application';
import { createTranslator } from '../../../src/i18n';
import { Landscape } from '../../../src/ui/atoms/Landscape';
import { HomeScreen } from '../../../src/ui/containers/HomeScreen';
import { I18nProvider } from '../../../src/ui/i18n';
import { Signpost } from '../../../src/ui/molecules/Signpost';
import { ScreenHeader } from '../../../src/ui/organisms/ScreenHeader';
import { IDLE_QUESTS, homeDeps, noop } from './homeDeps';

/** The accessible name and the text of every plank of the signpost, in order. */
function planks(html: string): string[][] {
	return [...html.matchAll(/<button[^>]*class="dromos-plank"[^>]*>(.*?)<\/button>/g)].map((match) => [/aria-label="([^"]*)"/.exec(match[0])?.[1] ?? '', match[1] ?? '']);
}

/** The markup of the first element inside `<main>`. */
function firstInMain(html: string): string {
	const main = /<main[^>]*>/.exec(html);
	return main ? html.slice(main.index + main[0].length) : '';
}

const at = (iso: string): Date => new Date(iso);
const quests = (status: QuestSnapshot['status'], lastSyncedAt: Date | null = at('2026-11-03T12:00:00Z')): QuestSnapshot => ({ quests: [], lastSyncedAt, status });

describe('Signpost', () => {
	it('lists the screens other than the current one, then the settings', () => {
		expect(planks(renderToStaticMarkup(<Signpost current="home" onGo={noop} onSettings={noop} />))).toEqual([
			['Go to Campaigns', 'Campaigns'],
			['Go to Skills', 'Skills'],
			['Go to Settings', 'Settings'],
		]);
		expect(planks(renderToStaticMarkup(<Signpost current="campaigns" onGo={noop} onSettings={noop} />))).toEqual([
			['Go to Path', 'Path'],
			['Go to Skills', 'Skills'],
			['Go to Settings', 'Settings'],
		]);
		expect(planks(renderToStaticMarkup(<Signpost current="skills" onGo={noop} onSettings={noop} />))).toEqual([
			['Go to Path', 'Path'],
			['Go to Campaigns', 'Campaigns'],
			['Go to Settings', 'Settings'],
		]);
	});

	it('speaks Spanish when the interface does', () => {
		const html = renderToStaticMarkup(
			<I18nProvider t={createTranslator('es')}>
				<Signpost current="campaigns" onGo={noop} onSettings={noop} />
			</I18nProvider>,
		);
		expect(planks(html)).toEqual([
			['Ir a Camino', 'Camino'],
			['Ir a Skills', 'Skills'],
			['Ir a Ajustes', 'Ajustes'],
		]);
	});

	it('hides the settings plank where the settings cannot be opened', () => {
		expect(planks(renderToStaticMarkup(<Signpost current="home" onGo={noop} onSettings={null} />)).map(([name]) => name)).toEqual(['Go to Campaigns', 'Go to Skills']);
	});

	it('is a navigation landmark of buttons', () => {
		const html = renderToStaticMarkup(<Signpost current="home" onGo={noop} onSettings={noop} />);
		expect(html).toMatch(/^<nav[^>]*class="dromos-signpost"[^>]*aria-label="Sections"/);
		expect(html.match(/<button type="button"/g)).toHaveLength(3);
	});
});

describe('HomeScreen signpost', () => {
	it('offers the settings plank only when the settings can be opened', () => {
		expect(planks(renderToStaticMarkup(<HomeScreen deps={homeDeps()} />)).map(([name]) => name)).toEqual(['Go to Campaigns', 'Go to Skills']);
		expect(planks(renderToStaticMarkup(<HomeScreen deps={homeDeps({ openSettings: noop })} />)).map(([name]) => name)).toEqual(['Go to Campaigns', 'Go to Skills', 'Go to Settings']);
	});

	it('leaves the signpost out of the drawing that screen readers skip', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps()} />);
		const scene = /<div class="dromos-scene[^"]*">(.*?)<main/.exec(html)?.[1] ?? '';
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
	it('names the screen and carries the character line', () => {
		const html = renderToStaticMarkup(<ScreenHeader title="Campaigns" character={{ name: 'Nicolás', title: 'Corredor', level: 3, xpText: '240 / 520 XP' }} />);
		expect(html).toMatch(/<h2[^>]*>Campaigns<\/h2>/);
		expect(html).toContain('Nicolás · Corredor · level 3 · 240 / 520 XP');
	});

	it('leaves out a missing title and speaks Spanish when the interface does', () => {
		const html = renderToStaticMarkup(
			<I18nProvider t={createTranslator('es')}>
				<ScreenHeader title="Skills" character={{ name: 'Nicolás', title: null, level: 3, xpText: '240 / 520 XP' }} />
			</I18nProvider>,
		);
		expect(html).toContain('Nicolás · nivel 3 · 240 / 520 XP');
	});

	it('shows no character line while there is no character', () => {
		const html = renderToStaticMarkup(<ScreenHeader title="Skills" character={null} />);
		expect(html).toMatch(/<h2[^>]*>Skills<\/h2>/);
		expect(html).not.toContain('·');
	});

	it('is the heading that takes the focus when the screen opens', () => {
		const html = renderToStaticMarkup(<ScreenHeader title="Skills" character={null} />);
		expect(html).toMatch(/<h2[^>]*tabindex="-1"[^>]*data-screen-heading="true"/);
	});
});

describe('HomeScreen screens', () => {
	it('opens the other screens with the header card instead of the character', () => {
		const campaigns = firstInMain(renderToStaticMarkup(<HomeScreen deps={homeDeps()} initialScreen="campaigns" />));
		const skills = firstInMain(renderToStaticMarkup(<HomeScreen deps={homeDeps()} initialScreen="skills" />));
		expect(campaigns).toMatch(/^<header[^>]*class="dromos-panel dromos-screen-header"/);
		expect(campaigns).toMatch(/^<header[^>]*>(?:(?!<\/header>).)*<h2[^>]*>Campaigns<\/h2>/);
		expect(skills).toMatch(/^<header[^>]*>(?:(?!<\/header>).)*<h2[^>]*>Skills<\/h2>/);
	});

	it('keeps the home screen as it was, with no header card', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps()} />);
		expect(html).not.toContain('dromos-screen-header');
		expect(firstInMain(html)).toMatch(/^<section[^>]*aria-label="Character"/);
		for (const section of ['dromos-quests', 'dromos-campaigns', 'dromos-skills']) expect(html).toContain(section);
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

	it('draws the tall scene on the home screen only', () => {
		expect(renderToStaticMarkup(<HomeScreen deps={homeDeps()} />)).toContain('class="dromos-scene is-home"');
		expect(renderToStaticMarkup(<HomeScreen deps={homeDeps()} initialScreen="skills" />)).toContain('class="dromos-scene"');
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
		expect(renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: quests({ kind: 'offline' }) })} />)).toContain('class="dromos-scene is-home is-offline"');
		expect(renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: quests({ kind: 'error' }) })} />)).toContain('class="dromos-scene is-home"');
	});

	it('lets the band tell it, so the sync line stays quiet while offline; other failures keep the prominent banner', () => {
		const offline = renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: quests({ kind: 'offline' }) })} />);
		const error = renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: quests({ kind: 'error' }) })} />);
		expect(offline).toContain('class="dromos-banner is-warning"');
		expect(error).toContain('class="dromos-banner is-error is-prominent"');
		expect(renderToStaticMarkup(<HomeScreen deps={homeDeps({ quests: { ...IDLE_QUESTS, status: { kind: 'unauthorized' } } })} />)).toContain('class="dromos-banner is-error is-prominent"');
	});
});
