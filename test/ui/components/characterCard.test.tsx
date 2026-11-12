import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Character } from '../../../src/domain';
import { createTranslator } from '../../../src/i18n';
import { PortraitButton } from '../../../src/ui/atoms/Portrait';
import { XpBar } from '../../../src/ui/atoms/XpBar';
import { I18nProvider } from '../../../src/ui/i18n';
import { CharacterCard, TitleLine, titleNews } from '../../../src/ui/organisms/CharacterCard';
import { CharacterPanel } from '../../../src/ui/organisms/CharacterPanel';
import { characterCardView } from '../../../src/ui/presenters/characterCardView';
import { clickOf, elementsOf } from './elements';

const t = createTranslator('en');
const CHARACTER: Character = {
	name: 'Nicolás',
	title: 'Corredor',
	level: 3,
	totalXp: 600,
	xpIntoLevel: 240,
	xpToNext: 520,
	stats: { fuerza: 3, vitalidad: 8, inteligencia: 4, sabiduria: 1, espiritu: 0, disciplina: 6 },
	gameStart: null,
};
const view = characterCardView(CHARACTER, t);
const card = (ceremony: Parameters<typeof CharacterCard>[0]['ceremony'] = null): string => renderToStaticMarkup(<CharacterCard view={view} footer={<p>sync line</p>} ceremony={ceremony} />);

/** The width of the XP bar's fill, in percent. */
const fillWidth = (html: string): string | undefined => /class="dromos-xp-fill" style="width:(\d+)%"/.exec(html)?.[1];

describe('CharacterCard after the design (game-ui S3)', () => {
	it('opens with a level medallion named by the level, and drops the level chip', () => {
		const html = card();

		expect(html).toMatch(/<span class="dromos-level-medal" role="img" aria-label="Level 3">.*<span class="dromos-level-medal-number">3<\/span><\/span>/);
		expect(html).not.toContain('dromos-character-level');
	});

	it('names the title and the level in one line, and the next level under the bar', () => {
		const html = card();

		expect(html).toContain(
			'<p class="dromos-character-title"><span class="dromos-character-title-part">Corredor</span><span class="dromos-character-title-part"><span class="dromos-character-title-dot"> · </span>level 3</span></p>',
		);
		expect(html).toMatch(/<span class="dromos-xp-text">240 \/ 520 XP<\/span><span class="dromos-xp-next">Level 4 in 280 XP<\/span>/);
	});

	it('draws the six stats under the bar as a radar, in place of the dots (S9)', () => {
		const html = card();

		expect(html).toMatch(/<\/div><\/div><\/div><div class="dromos-character-row"><svg class="dromos-radar" role="img" aria-label="Strength 3, Vitality 8, Intelligence 4, Wisdom 1, Spirit 0, Discipline 6"/);
		expect([...html.matchAll(/<tspan class="dromos-radar-label">(\w+)<\/tspan> <tspan class="dromos-radar-value">(\d+)<\/tspan>/g)].map((match) => `${match[1]} ${match[2]}`)).toEqual(['STR 3', 'VIT 8', 'INT 4', 'WIS 1', 'SPI 0', 'DIS 6']);
		expect(html.indexOf('dromos-radar')).toBeGreaterThan(html.indexOf('dromos-xp-next'));
		expect(html).not.toMatch(/dromos-stats?\b|dromos-pip/);
	});

	it('keeps the sync line at its foot and the name as the heading that takes the focus', () => {
		const html = card();

		expect(html).toMatch(/^<section class="dromos-card dromos-plaque dromos-character" aria-label="Character">/);
		expect(html).toMatch(/<h2[^>]*tabindex="-1"[^>]*data-screen-heading="true"[^>]*>Nicolás<\/h2>/);
		expect(html.endsWith('<p>sync line</p></section>')).toBe(true);
	});

	it('puts the skills part beside the radar, in one row above the sync line (S3, S9)', () => {
		const html = renderToStaticMarkup(<CharacterCard view={view} footer={<p>sync line</p>} skills={<p>skills</p>} />);

		expect(html).toMatch(/<div class="dromos-character-row"><svg class="dromos-radar".*<\/svg><p>skills<\/p><\/div><p>sync line<\/p><\/section>$/);
	});

	it('keeps the name a heading on the other screens, but not the one their screen focuses', () => {
		const html = renderToStaticMarkup(<CharacterCard view={view} footer={null} heading={false} />);

		expect(html).toContain('<h2 class="dromos-character-name">Nicolás</h2>');
		expect(html).not.toContain('data-screen-heading');
	});
});

describe('CharacterCard during the level-up ceremony (game-ui S4)', () => {
	it('shows the real progress and a plain medallion when there is no ceremony', () => {
		expect(fillWidth(card(null))).toBe('46');
		expect(card(null)).not.toContain('is-lit');
	});

	it('fills the bar first, before the medallion changes', () => {
		const html = card('fill');

		expect(fillWidth(html)).toBe('100');
		expect(html).toContain('<span class="dromos-level-medal" role="img"');
	});

	it('then turns the medallion ochre and shows the progress into the new level', () => {
		for (const phase of ['medal', 'final'] as const) {
			const html = card(phase);
			expect(html).toContain('<span class="dromos-level-medal is-lit" role="img" aria-label="Level 3">');
			expect(fillWidth(html)).toBe('46');
		}
	});

	it('keeps the screen reader values of the bar real while it fills', () => {
		expect(card('fill')).toMatch(/role="progressbar"[^>]*aria-valuemax="520"[^>]*aria-valuenow="240"/);
	});
});

describe('XpBar', () => {
	it('keeps its markup for the skill cards, which pass no caption', () => {
		expect(renderToStaticMarkup(<XpBar current={40} total={100} percent={40} text="40 / 100 XP" />)).toBe(
			'<div class="dromos-xp"><div class="dromos-xp-track" role="progressbar" aria-label="Experience" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40" aria-valuetext="40 / 100 XP"><div class="dromos-xp-fill" style="width:40%"></div></div><span class="dromos-xp-text">40 / 100 XP</span></div>',
		);
	});
});

describe('CharacterPanel, the plaque (S2)', () => {
	it('still names the expected note when the character is missing, without a card', () => {
		const html = renderToStaticMarkup(<CharacterPanel state={{ kind: 'missing', path: 'Dromos/Character.md' }} footer={null} />);

		expect(html).toContain('<code>Dromos/Character.md</code>');
		expect(html).not.toContain('dromos-level-medal');
	});

	it('keeps the texts of loading, missing and unreadable on the plaque, with the skills and the sync line under them', () => {
		const states = [
			[{ kind: 'loading' }, 'Loading the character…'],
			[{ kind: 'missing', path: 'Dromos/Character.md' }, 'Character not found'],
			[{ kind: 'unreadable' }, 'The character note could not be read.'],
		] as const;
		for (const [state, text] of states) {
			const html = renderToStaticMarkup(<CharacterPanel state={state} skills={<p>skills</p>} footer={<p>sync line</p>} />);

			expect(html).toMatch(/^<section class="dromos-card dromos-plaque dromos-character-empty" aria-label="Character">/);
			expect(html).toContain(text);
			expect(html.endsWith('<p>skills</p><p>sync line</p></section>')).toBe(true);
		}
	});

	it('makes the missing title the screen heading on home only', () => {
		const missing = { kind: 'missing', path: 'Dromos/Character.md' } as const;

		expect(renderToStaticMarkup(<CharacterPanel state={missing} footer={null} />)).toMatch(/<h2[^>]*tabindex="-1"[^>]*data-screen-heading="true"[^>]*>Character not found<\/h2>/);
		expect(renderToStaticMarkup(<CharacterPanel state={missing} footer={null} heading={false} />)).toContain('<h2 class="dromos-card-title">Character not found</h2>');
	});

	it('gives the found character the same plaque', () => {
		const html = renderToStaticMarkup(<CharacterPanel state={{ kind: 'found', view }} skills={<p>skills</p>} footer={<p>sync line</p>} heading={false} />);

		expect(html).toMatch(/^<section class="dromos-card dromos-plaque dromos-character"/);
		expect(html).not.toContain('data-screen-heading');
		expect(html.endsWith('<p>skills</p></div><p>sync line</p></section>')).toBe(true);
	});
});

// game-ui S15: since the last visit, the line under the bar and the bar catching up.
describe('CharacterCard since the last visit (game-ui S15)', () => {
	const visit = (overrides: Partial<NonNullable<Parameters<typeof CharacterCard>[0]['visit']>> = {}) => ({ line: null, parts: [], heldPercent: null, catchUp: false, ...overrides });
	const parts = ['+45 XP since yesterday', 'Reader +15', '2 quests'];
	const withVisit = (value: ReturnType<typeof visit>, ceremony: Parameters<typeof CharacterCard>[0]['ceremony'] = null): string =>
		renderToStaticMarkup(<CharacterCard view={view} footer={<p>sync line</p>} ceremony={ceremony} visit={value} />);

	it('shows the line under the bar and its numbers, each part kept whole and the dot at the end of a line', () => {
		const html = withVisit(visit({ line: parts.join(' · '), parts }));

		expect(html).toMatch(/<span class="dromos-xp-next">Level 4 in 280 XP<\/span><\/div><\/div><p class="dromos-since">/);
		expect(html).toContain(
			'<p class="dromos-since"><span><span class="dromos-since-part">+45 XP since yesterday</span></span><span>\u00a0· <span class="dromos-since-part">Reader +15</span></span><span>\u00a0· <span class="dromos-since-part">2 quests</span></span></p>',
		);
	});

	it('draws no line without one', () => {
		expect(withVisit(visit())).not.toContain('dromos-since');
		expect(card()).not.toContain('dromos-since');
	});

	it('holds the bar at the value last seen while the sync runs, with the real values for screen readers', () => {
		const html = withVisit(visit({ heldPercent: 20 }));

		expect(fillWidth(html)).toBe('20');
		expect(html).toMatch(/role="progressbar"[^>]*aria-valuemax="520"[^>]*aria-valuenow="240"/);
	});

	it('then lets the bar catch up slowly', () => {
		expect(withVisit(visit({ catchUp: true }))).toContain('<div class="dromos-xp is-stacked is-catching-up">');
		expect(fillWidth(withVisit(visit({ catchUp: true })))).toBe('46');
	});

	it('leaves the bar to the ceremony: it fills while held, then shows the new level', () => {
		expect(fillWidth(withVisit(visit({ heldPercent: 20, catchUp: true }), 'fill'))).toBe('100');
		expect(withVisit(visit({ heldPercent: 20, catchUp: true }), 'fill')).not.toContain('is-catching-up');
		expect(fillWidth(withVisit(visit({ heldPercent: 20 }), 'medal'))).toBe('46');
	});

	it('keeps the text of the bar and its next level as they were', () => {
		const html = withVisit(visit({ line: '+45 XP since yesterday', parts: ['+45 XP since yesterday'], heldPercent: 20, catchUp: true }));

		expect(html).toMatch(/<span class="dromos-xp-text">240 \/ 520 XP<\/span><span class="dromos-xp-next">Level 4 in 280 XP<\/span>/);
	});
});

describe('CharacterCard portrait (M11 S1)', () => {
	/** The portrait's drawing, from its svg to its closing tag. */
	const drawing = (html: string): string => /<svg class="dromos-portrait-art[\s\S]*?<\/svg>/.exec(html)?.[0] ?? '';

	it('shows the character in an arched niche, with the level medallion on its corner', () => {
		expect(card()).toMatch(
			/<div class="dromos-character-who"><span class="dromos-portrait is-character"><svg class="dromos-portrait-art is-niche is-character" viewBox="0 0 100 124" aria-hidden="true" focusable="false">[\s\S]*?<\/svg><span class="dromos-level-medal" role="img" aria-label="Level 3">.*?<\/span><\/span><div class="dromos-character-names">/,
		);
	});

	it('is decoration: the drawing names nothing, so the medallion and the name are heard once', () => {
		const art = drawing(card());

		expect(art).not.toBe('');
		expect(art).not.toMatch(/<title|<text|aria-label|role=/);
		expect(art).not.toContain('Nicolás');
		expect(card().match(/aria-label="Level 3"/g)).toHaveLength(1);
	});

	it('draws the character inside his own arch', () => {
		const art = drawing(card());
		const clip = /<clipPath id="([^"]+)">/.exec(art)?.[1];

		expect(clip).toBeDefined();
		expect(art).toContain(`<g clip-path="url(#${clip})">`);
	});

	it('keeps the portrait while the medallion turns ochre in a level-up', () => {
		const html = card('medal');

		expect(html).toContain('<span class="dromos-portrait is-character">');
		expect(html).toContain('<span class="dromos-level-medal is-lit" role="img" aria-label="Level 3">');
	});

	// L6: "podria iniciar con el mismo personaje que esta en el paisaje".
	it('draws the young runner by default, carrying nothing', () => {
		const art = drawing(card());

		expect(art).toContain('<g class="dromos-portrait-stage is-runner">');
		expect(art).not.toContain('dromos-avatar-thing');
	});

	it('draws the stage and the objects it is given, and keeps the medallion and the name', () => {
		const html = renderToStaticMarkup(<CharacterCard view={view} footer={null} avatar={{ stage: 'traveller', objects: ['atleta', 'lector'] }} />);
		const art = drawing(html);

		expect(art).toContain('<g class="dromos-portrait-stage is-traveller">');
		expect(art).not.toContain('is-runner');
		expect(art).toContain('<g class="dromos-avatar-thing is-atleta">');
		expect(art).toContain('<g class="dromos-avatar-thing is-lector">');
		expect(html).toMatch(/<span class="dromos-level-medal" role="img" aria-label="Level 3">.*<span class="dromos-level-medal-number">3<\/span><\/span>/);
		expect(html).toMatch(/<h2[^>]*>Nicolás<\/h2>/);
	});

	it('draws nothing for a skill without an object', () => {
		const art = drawing(renderToStaticMarkup(<CharacterCard view={view} footer={null} avatar={{ stage: 'sage', objects: ['juggler'] }} />));

		expect(art).toContain('<g class="dromos-portrait-stage is-sage">');
		expect(art).not.toContain('dromos-avatar-thing');
	});

	it('is passed through the plaque when the character is found', () => {
		const html = renderToStaticMarkup(<CharacterPanel state={{ kind: 'found', view }} footer={null} avatar={{ stage: 'elder', objects: ['maestro'] }} />);

		expect(drawing(html)).toContain('<g class="dromos-portrait-stage is-elder">');
		expect(drawing(html)).toContain('<g class="dromos-avatar-thing is-maestro">');
	});
});

describe('CharacterCard: the portrait opens the stages (stage-card S1)', () => {
	const es = createTranslator('es');
	const open = (): void => undefined;
	const plaque = (props: Partial<Parameters<typeof CharacterCard>[0]> = {}, language = t): string =>
		renderToStaticMarkup(
			<I18nProvider t={language}>
				<CharacterCard view={characterCardView(CHARACTER, language)} footer={null} {...props} />
			</I18nProvider>,
		);

	it('wraps only the niche in a button named by the stage, which opens a dialog; the medallion stays outside it, still named', () => {
		expect(plaque({ onOpenStages: open }, es)).toMatch(
			/<span class="dromos-portrait is-character"><button type="button" class="dromos-portrait-open" aria-label="Corredor, etapa 1 de 12. Ver las etapas" aria-haspopup="dialog"><svg class="dromos-portrait-art is-niche is-character"[^>]*>[\s\S]*?<\/svg><\/button><span class="dromos-level-medal" role="img" aria-label="Nivel 3">.*?<\/span><\/span><div class="dromos-character-names">/,
		);
	});

	it('names the stage the portrait shows, in the interface language', () => {
		expect(plaque({ onOpenStages: open, avatar: { stage: 'traveller', objects: [] } }, es)).toContain('aria-label="Viajero, etapa 6 de 12. Ver las etapas"');
		expect(plaque({ onOpenStages: open, avatar: { stage: 'sage', objects: [] } })).toContain('aria-label="Sage, stage 12 of 12. See the stages"');
	});

	it('without a handler the portrait stays a plain decoration, drawn as before', () => {
		const html = plaque();

		expect(html).not.toContain('<button');
		expect(html).not.toContain('aria-haspopup');
		expect(html).toMatch(/<span class="dromos-portrait is-character"><svg class="dromos-portrait-art is-niche is-character"[^>]*>[\s\S]*?<\/svg><span class="dromos-level-medal" role="img" aria-label="Level 3">/);
	});

	it('is passed through the plaque when the character is found, and no empty state has one', () => {
		const found = renderToStaticMarkup(<CharacterPanel state={{ kind: 'found', view }} footer={null} onOpenStages={open} />);
		const missing = renderToStaticMarkup(<CharacterPanel state={{ kind: 'missing', path: 'Dromos/Character.md' }} footer={null} onOpenStages={open} />);

		expect(found).toContain('<button type="button" class="dromos-portrait-open" aria-label="Runner, stage 1 of 12. See the stages" aria-haspopup="dialog">');
		expect(missing).not.toContain('<button');
	});

	it('the button opens the stages, and holds only what it is given', () => {
		const opened: string[] = [];
		const button = PortraitButton({ label: 'Corredor, etapa 1 de 12. Ver las etapas', onOpen: () => opened.push('stages'), children: <svg /> });

		clickOf(button)();

		expect(opened).toEqual(['stages']);
		expect(elementsOf(button).map((element) => element.type)).toEqual(['button', 'svg']);
	});
});

describe('CharacterCard: the title opens the titles (titles S5)', () => {
	const es = createTranslator('es');
	const open = (): void => undefined;
	const plaque = (props: Partial<Parameters<typeof CharacterCard>[0]> = {}, language = es, character: Character = CHARACTER): string =>
		renderToStaticMarkup(
			<I18nProvider t={language}>
				<CharacterCard view={characterCardView(character, language)} footer={null} {...props} />
			</I18nProvider>,
		);

	it('wraps only the title in a button named by it, which opens a dialog; the level stays text beside it', () => {
		expect(plaque({ onOpenTitles: open })).toContain(
			'<p class="dromos-character-title"><span class="dromos-character-title-part"><button type="button" class="dromos-title-open" aria-label="Corredor. Ver los títulos" aria-haspopup="dialog">Corredor</button></span><span class="dromos-character-title-part"><span class="dromos-character-title-dot"> · </span>nivel 3</span></p>',
		);
		expect(plaque({ onOpenTitles: open }, t)).toContain('aria-label="Corredor. See the titles"');
	});

	it('without a handler the title stays plain text, drawn as before', () => {
		const html = plaque();

		expect(html).toContain('<p class="dromos-character-title"><span class="dromos-character-title-part">Corredor</span><span class="dromos-character-title-part"><span class="dromos-character-title-dot"> · </span>nivel 3</span></p>');
		expect(html).not.toContain('dromos-title-open');
		expect(html).not.toContain('<button');
	});

	it('is no button when Character.md holds no title: the line shows the level alone', () => {
		const html = plaque({ onOpenTitles: open }, es, { ...CHARACTER, title: '' });

		expect(html).toContain('<p class="dromos-character-title"><span class="dromos-character-title-part">Nivel 3</span></p>');
		expect(html).not.toContain('<button');
	});

	it('the button opens the titles, and holds only the title', () => {
		const opened: string[] = [];
		const line = TitleLine({ parts: ['Corredor', 'nivel 3'], titleLabel: 'Corredor. Ver los títulos', onOpenTitles: () => opened.push('titles') });
		const button = elementsOf(line).find((element) => element.type === 'button');

		(button?.props.onClick as () => void)();

		expect(opened).toEqual(['titles']);
		expect(button?.props.children).toBe('Corredor');
	});

	it('is passed through the plaque when the character is found, and no empty state has one', () => {
		const found = renderToStaticMarkup(<CharacterPanel state={{ kind: 'found', view }} footer={null} onOpenTitles={open} />);
		const missing = renderToStaticMarkup(<CharacterPanel state={{ kind: 'missing', path: 'Dromos/Character.md' }} footer={null} onOpenTitles={open} titleNews="Perseverante" />);

		expect(found).toContain('<button type="button" class="dromos-title-open" aria-label="Corredor. See the titles" aria-haspopup="dialog">Corredor</button>');
		expect(missing).not.toContain('<button');
		expect(missing).not.toContain('dromos-title-news');
	});
});

describe('CharacterCard: the notice of a new title (titles S5)', () => {
	const es = createTranslator('es');
	const open = (): void => undefined;
	const plaque = (props: Partial<Parameters<typeof CharacterCard>[0]> = {}): string =>
		renderToStaticMarkup(
			<I18nProvider t={es}>
				<CharacterCard view={characterCardView(CHARACTER, es)} footer={null} {...props} />
			</I18nProvider>,
		);

	it('draws a line on the plaque, under the name and above the stats, with the wax seal, the title and "Ver los títulos"', () => {
		const html = plaque({ onOpenTitles: open, titleNews: 'Perseverante' });

		expect(html).toMatch(
			/<\/div><\/div><div class="dromos-title-news"><span class="dromos-title-news-seal" aria-hidden="true"><svg class="dromos-portrait-seal"[^>]*>.*?<\/svg><\/span><p class="dromos-title-news-kicker" id="([^"]+)-kicker">Esdras te otorgó un título:<\/p><p class="dromos-title-news-name" id="\1-name">Perseverante<\/p><button type="button" class="dromos-title-news-open" aria-haspopup="dialog" aria-describedby="\1-kicker \1-name">Ver los títulos<\/button><\/div><div class="dromos-character-row">/,
		);
	});

	it('keeps the plaque’s markup as it was: the portrait’s clip id, which React derives from the plaque’s count of children, does not move', () => {
		const clipId = (html: string): string | undefined => /<clipPath id="([^"]+)">/.exec(html)?.[1];

		// The id this plaque drew before the titles; the notice shares the row's slot, so it stays with or without them.
		for (const props of [{}, { onOpenTitles: open }, { onOpenTitles: open, titleNews: 'Perseverante' }]) expect(clipId(plaque(props))).toBe('dromos-portrait-character-Rl');
	});

	it('draws no notice without a new title, or without a handler to open the titles', () => {
		expect(plaque({ onOpenTitles: open })).not.toContain('dromos-title-news');
		expect(plaque({ titleNews: 'Perseverante' })).not.toContain('dromos-title-news');
	});

	it('its button opens the titles', () => {
		const opened: string[] = [];
		const news = titleNews({ id: 'news', kicker: 'Esdras te otorgó un título:', title: 'Perseverante', openText: 'Ver los títulos', onOpen: () => opened.push('titles') });

		clickOf(news)();

		expect(opened).toEqual(['titles']);
	});
});
