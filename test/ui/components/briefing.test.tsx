import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createTranslator } from '../../../src/i18n';
import { BriefingPanel } from '../../../src/ui/organisms/BriefingPanel';
import { briefingView, letterMarkOf, type BriefingView } from '../../../src/ui/presenters/briefingView';
import type { SkillCardView } from '../../../src/ui/presenters/skillsView';
import { aBriefing } from '../../fakes/InMemoryBriefingRepository';
import { elementsOf } from './elements';
import { noop, renderNothing } from './homeDeps';

const en = createTranslator('en');
const TODAY = '2026-11-03';
const caregiver: SkillCardView = {
	id: 'cuidador',
	icon: 'heart-pulse',
	name: 'Caregiver',
	statLabel: 'Vitality',
	description: '',
	unlocked: false,
	level: null,
	levelText: null,
	rankName: null,
	rankDescription: null,
	caption: null,
	xp: null,
	requirements: [{ text: 'See a doctor this year', detail: null, met: false, percent: 0 }],
	progressPercent: 0,
	earnedText: null,
};
const todayBriefing = aBriefing({ created: TODAY, mission: { title: 'Finish the login screen', why: 'It unblocks the beta.' }, nearSkillId: 'cuidador' });
const today = briefingView({ kind: 'found', briefing: todayBriefing }, TODAY, [caregiver], en, letterMarkOf(todayBriefing));
const old = briefingView({ kind: 'found', briefing: aBriefing({ created: '2026-11-01' }) }, TODAY, [], en, null);
const missing = briefingView({ kind: 'missing' }, TODAY, [], en);
const LETTER_ID = 'dromos-letter-7';

function panel(view: BriefingView, options: { readonly open?: boolean; readonly onRequest?: (() => void) | null } = {}) {
	return <BriefingPanel view={view} renderMarkdown={renderNothing} onRequest={options.onRequest === undefined ? noop : options.onRequest} renderIcon={noop} open={options.open ?? false} letterId={LETTER_ID} onToggle={noop} onFold={noop} />;
}
const render = (view: BriefingView = today, options: { readonly open?: boolean; readonly onRequest?: (() => void) | null } = {}) => renderToStaticMarkup(panel(view, options));

/** The markup of the element with class `name`, up to the closing tag of the same kind that closes it. */
function block(html: string, name: string): string {
	const start = html.search(new RegExp(`<(\\w+)[^>]*? class="(?:[^"]*\\s)?${name}(?:\\s[^"]*)?"`));
	if (start < 0) return '';
	const tag = /^<(\w+)/.exec(html.slice(start))?.[1] ?? 'div';
	let depth = 0;
	const pattern = new RegExp(`<${tag}[ >]|</${tag}>`, 'g');
	pattern.lastIndex = start;
	for (let match = pattern.exec(html); match; match = pattern.exec(html)) {
		depth += match[0].startsWith('</') ? -1 : 1;
		if (depth === 0) return html.slice(start, match.index + match[0].length);
	}
	return html.slice(start);
}

describe('BriefingPanel as a scroll (game-ui S5)', () => {
	it('rolls the scroll at its top and its bottom, folded and unrolled', () => {
		for (const open of [false, true]) {
			const html = render(today, { open });

			expect(html).toMatch(/^<section class="dromos-card dromos-briefing[^"]*" aria-label="Briefing from Esdras"><h2 class="dromos-visually-hidden">Briefing from Esdras<\/h2><div class="dromos-scroll-edge" aria-hidden="true"><\/div>/);
			expect(html.endsWith('<div class="dromos-scroll-edge" aria-hidden="true"></div></section>')).toBe(true);
		}
	});

	it('draws Esdras as a scribe in an arched niche, never the wise man of the plaque (M11 S2)', () => {
		const html = render();

		expect(html).toMatch(/<span class="dromos-briefing-seal" aria-hidden="true"><svg class="dromos-portrait-art is-niche is-scribe" viewBox="0 0 100 124" aria-hidden="true" focusable="false">/);
		expect(html).not.toContain('is-sage');
		expect(html).not.toContain('📜');
	});

	it('gives every portrait its own arch, so two letters in one window never share a clip', () => {
		const html = renderToStaticMarkup(
			<>
				{panel(today, {})}
				{panel(today, {})}
			</>,
		);
		const clips = [...html.matchAll(/<clipPath id="([^"]+)">/g)].map((match) => match[1]);

		expect(clips).toHaveLength(2);
		expect(new Set(clips).size).toBe(2);
		for (const clip of clips) expect(html).toContain(`<g clip-path="url(#${clip})">`);
	});

	it('signs today\'s letter "— Esdras" at its foot next to the copy-command button, a secondary button', () => {
		expect(block(render(today, { open: true }), 'dromos-briefing-foot')).toMatch(
			/^<div class="dromos-briefing-foot"><button type="button" class="dromos-btn is-small dromos-briefing-request">Copy briefing command<\/button><button[^>]*>.*?Fold the letter<\/button><p class="dromos-briefing-signature">— Esdras<\/p><\/div>$/,
		);
	});

	// Pin (calm-ui S2): the mission, the close skill and its icon from the host app.
	it('keeps the mission, the closest skill and its icon from the host app', () => {
		const html = render();

		expect(html).toContain('Finish the login screen');
		expect(html).toContain('It unblocks the beta.');
		expect(html).toContain('<span class="dromos-briefing-near-icon is-named" aria-hidden="true"></span> Caregiver');
		expect(html).toContain('See a doctor this year');
	});

	// Pin (calm-ui S1): the empty state keeps its notice and its copy button.
	it('keeps the notice when there is no letter, with the copy button and nothing to unroll', () => {
		const html = render(missing);

		expect(html).toContain('<p class="dromos-briefing-notice">Esdras has not written today</p>');
		expect(html.match(/<button/g)).toHaveLength(1);
		expect(html).toContain('>Copy briefing command</button>');
		expect(html).not.toContain('aria-expanded');
		expect(html).not.toContain('— Esdras');
	});

	// Pin (S5): another day's letter keeps its dimmed text.
	it('keeps the dimmed text of another day', () => {
		const html = render(old, { onRequest: null });

		expect(html).toContain('class="dromos-briefing-content is-dimmed"');
		expect(html).not.toContain('Copy briefing command');
	});
});

// game-ui S13: a disclosure button, not <details>, and the letter stays mounted.
describe('BriefingPanel folds and unrolls the letter (game-ui S13)', () => {
	it('starts folded: the top toggle reads the letter and controls it, which stays mounted and hidden', () => {
		const html = render();
		const toggle = /<button[^>]*class="[^"]*dromos-briefing-toggle[^"]*"[^>]*>/.exec(html)?.[0] ?? '';

		expect(html).not.toContain('<details');
		expect(html).toMatch(/^<section class="dromos-card dromos-briefing" /);
		expect(toggle).toContain(`id="${LETTER_ID}-toggle"`);
		expect(toggle).toContain('aria-expanded="false"');
		expect(toggle).toContain(`aria-controls="${LETTER_ID}-letter"`);
		expect(block(html, 'dromos-briefing-toggle')).toContain('Read the letter · 1 min');
		expect(html).toMatch(new RegExp(`<div class="dromos-briefing-letter" id="${LETTER_ID}-letter">`));
		expect(block(html, 'dromos-briefing-letter')).toContain('<div class="dromos-briefing-body markdown-rendered"></div>');
	});

	it('unrolled, the toggle says "Fold the letter" and a second fold button closes the letter', () => {
		const html = render(today, { open: true });
		const controls = [...html.matchAll(/<button[^>]*aria-controls="([^"]+)"[^>]*>/g)];

		expect(html).toMatch(/^<section class="dromos-card dromos-briefing is-open" /);
		expect(controls.map((match) => match[1])).toEqual([`${LETTER_ID}-letter`, `${LETTER_ID}-letter`]);
		expect(controls[0]?.[0]).toContain('aria-expanded="true"');
		expect(block(html, 'dromos-briefing-toggle')).toContain('Fold the letter');
		expect(block(html, 'dromos-briefing-fold')).toContain('Fold the letter');
		expect(block(html, 'dromos-briefing-letter')).toContain('dromos-briefing-fold');
	});

	it('hands each button its own handler', () => {
		const onToggle = (): void => undefined;
		const onFold = (): void => undefined;
		const buttons = elementsOf(BriefingPanel({ view: today, renderMarkdown: renderNothing, onRequest: null, renderIcon: noop, open: true, letterId: LETTER_ID, onToggle, onFold })).filter((element) => element.type === 'button');

		expect(buttons.map((button) => button.props.onClick)).toEqual([onToggle, onFold]);
	});

	// home-fit S4: the folded letter is only its head line, the mission and its buttons.
	it('folded, shows only its head line with the seal when new, the mission cut at two lines and its buttons', () => {
		const unread = briefingView({ kind: 'found', briefing: todayBriefing }, TODAY, [caregiver], en, null);
		const html = render(unread);
		const folded = html.slice(0, html.indexOf(`<div class="dromos-briefing-letter" id="${LETTER_ID}-letter">`));

		expect(folded).toContain('<p class="dromos-briefing-top">Letter from Esdras · today</p>');
		expect(folded).toContain('<span class="dromos-briefing-new">New letter</span>');
		expect(folded).toMatch(/<div class="dromos-briefing-content"><p class="dromos-briefing-mission"><span class="dromos-briefing-label">Mission of the day<\/span><strong class="dromos-briefing-title">Finish the login screen<\/strong><\/p><\/div><div class="dromos-briefing-row">/);
		expect(block(folded, 'dromos-briefing-toggle')).toContain('Read the letter · 1 min');
		expect(folded).not.toContain('dromos-briefing-near');
		expect(html).not.toContain('dromos-briefing-excerpt');
	});

	it('moves the closest skill into the letter, after the why and before the text', () => {
		for (const open of [false, true]) {
			expect(block(render(today, { open }), 'dromos-briefing-letter')).toMatch(
				/<p class="dromos-briefing-why">.*?<\/p><p class="dromos-briefing-near"><span class="dromos-briefing-label">Closest skill<\/span>.*?Caregiver.*?See a doctor this year<\/span><\/p><div class="dromos-briefing-body markdown-rendered">/,
			);
		}
	});

	it('draws no mission block while folded when the letter has no mission', () => {
		const plain = briefingView({ kind: 'found', briefing: aBriefing({ created: TODAY, nearSkillId: 'cuidador' }) }, TODAY, [caregiver], en, null);
		const html = render(plain);

		expect(html.slice(0, html.indexOf('<div class="dromos-briefing-row">'))).not.toContain('dromos-briefing-content');
		expect(block(html, 'dromos-briefing-letter')).toContain('<p class="dromos-briefing-near">');
	});

	it('signs the folded row, and only the foot once unrolled', () => {
		const folded = render();
		const unrolled = render(today, { open: true });

		expect(block(folded, 'dromos-briefing-row')).toContain('<p class="dromos-briefing-signature">— Esdras</p>');
		expect(block(unrolled, 'dromos-briefing-row')).not.toContain('— Esdras');
		expect(block(unrolled, 'dromos-briefing-foot')).toContain('— Esdras');
	});

	it('puts the mission\'s why inside the letter', () => {
		expect(block(render(), 'dromos-briefing-letter')).toMatch(/<p class="dromos-briefing-why"><span class="dromos-briefing-label">Why this mission<\/span><span>It unblocks the beta.<\/span><\/p>/);
	});

	it('marks a new letter with a wax seal and "New letter", and a read one with neither', () => {
		const unread = briefingView({ kind: 'found', briefing: todayBriefing }, TODAY, [caregiver], en, null);

		expect(render(unread)).toMatch(/<span class="dromos-briefing-seal is-wax" aria-hidden="true"><svg class="dromos-portrait-art is-niche is-scribe"[\s\S]*?<\/svg><svg class="dromos-portrait-seal" viewBox="0 0 24 26" aria-hidden="true" focusable="false">/);
		expect(render(unread)).toContain('<span class="dromos-briefing-new">New letter</span>');
		expect(render(today)).not.toContain('is-wax');
		expect(render(today)).not.toContain('dromos-portrait-seal');
		expect(render(today)).toContain('<svg class="dromos-portrait-art is-niche is-scribe"');
		expect(render(today)).not.toContain('New letter');
	});

	it('puts the copy command in the folded row for an old letter, and only at the foot for today\'s', () => {
		const oldHtml = render(old, { onRequest: noop });
		const todayHtml = render(today, { onRequest: noop });

		expect(block(oldHtml, 'dromos-briefing-row')).toContain('Copy briefing command');
		expect(block(oldHtml, 'dromos-briefing-letter')).not.toContain('Copy briefing command');
		expect(block(todayHtml, 'dromos-briefing-row')).not.toContain('Copy briefing command');
		expect(block(todayHtml, 'dromos-briefing-foot')).toContain('Copy briefing command');
	});

	it('heads an old letter "Last letter · 1 Nov"', () => {
		expect(render(old)).toContain('<p class="dromos-briefing-top">Last letter · 1 Nov</p>');
		expect(render(old)).not.toContain('Esdras has not written today');
	});
});

// game-ui S14: the why's backticks are code, and nothing else of it is markup.
describe('BriefingPanel shows code in the why', () => {
	it('renders each backtick span as <code> and escapes any other markup', () => {
		const briefing = aBriefing({ created: TODAY, mission: { title: 'Close M4', why: 'Per `phases` in <b>README</b> & `02-Phases.md`.' } });
		const html = render(briefingView({ kind: 'found', briefing }, TODAY, [], en, letterMarkOf(briefing)));
		const why = block(html, 'dromos-briefing-why');

		expect(why).toContain('<span>Per </span><code>phases</code><span> in &lt;b&gt;README&lt;/b&gt; &amp; </span><code>02-Phases.md</code><span>.</span>');
		expect(why).not.toContain('`');
		expect(why).not.toContain('<b>');
	});
});
