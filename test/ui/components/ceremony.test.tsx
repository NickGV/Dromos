import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { GameEvent } from '../../../src/application';
import { createTranslator } from '../../../src/i18n';
import { LevelRibbon } from '../../../src/ui/atoms/LevelRibbon';
import { HomeScreen } from '../../../src/ui/containers/HomeScreen';
import { LevelUpPanel } from '../../../src/ui/organisms/LevelUpPanel';
import { Scene } from '../../../src/ui/organisms/Scene';
import { ceremonyView } from '../../../src/ui/presenters/levelUpView';
import { IDLE_GAME, homeDeps, noop } from './homeDeps';

const en = createTranslator('en');
const levelUp: GameEvent = { kind: 'character-level', level: 4 };
const readerUp: GameEvent = { kind: 'skill-level', skillId: 'lector', name: 'Reader', level: 3, rank: 'Scholar', rankChanged: true };
const unlocked: GameEvent = { kind: 'skill-unlocked', skillId: 'atleta', name: 'Athlete' };

/** The markup of the scene, up to `<main>`. */
const sceneOf = (html: string): string => /<div class="dromos-scene[^"]*"[^>]*>(.*?)<main/.exec(html)?.[1] ?? '';

describe('LevelRibbon (game-ui S4)', () => {
	it('says "New level" above the level, as a drawing the panel already puts in words', () => {
		const html = renderToStaticMarkup(<LevelRibbon kicker="New level" title="Level 4" />);

		expect(html).toMatch(/^<div class="dromos-ribbon" aria-hidden="true">/);
		expect(html).toMatch(/<span class="dromos-ribbon-kicker">New level<\/span><span class="dromos-ribbon-title">Level 4<\/span>/);
	});
});

describe('LevelUpPanel (game-ui S4)', () => {
	const view = ceremonyView([levelUp, readerUp, unlocked], [], en);
	if (!view) throw new Error('no ceremony');
	const html = renderToStaticMarkup(<LevelUpPanel view={view} onDismiss={noop} renderIcon={noop} />);

	it('titles the panel with the level reached', () => {
		expect(html).toMatch(/^<section class="dromos-card dromos-ceremony" aria-label="Level up">/);
		expect(html).toMatch(/<h2 class="dromos-ceremony-title">You reached level 4<\/h2>/);
	});

	it('lists each skill event of the sync as a row with a small medallion, the rank when it changed and the unlock', () => {
		const rows = [...html.matchAll(/<li class="dromos-ceremony-row">(.*?)<\/li>/g)].map((match) => match[1] ?? '');

		expect(rows).toHaveLength(2);
		expect(rows.every((row) => row.includes('class="dromos-ring is-earned"'))).toBe(true);
		expect(rows[0]).toMatch(/<span class="dromos-ceremony-text">Reader rose to level 3<\/span><span class="dromos-ceremony-detail">New rank: Scholar<\/span>/);
		expect(rows[1]).toContain('<span class="dromos-ceremony-text">New skill: Athlete</span>');
	});

	it('closes with one button', () => {
		expect(html.match(/<button/g)).toHaveLength(1);
		expect(html).toMatch(/<button type="button" class="dromos-btn is-small dromos-ceremony-dismiss">Dismiss<\/button>/);
	});

	it('draws no list when only the character moved', () => {
		const alone = ceremonyView([levelUp], [], en);
		expect(renderToStaticMarkup(<LevelUpPanel view={alone!} onDismiss={noop} renderIcon={noop} />)).not.toContain('<ul');
	});
});

describe('Scene', () => {
	it('holds the ribbon over the landscape when given one', () => {
		const html = renderToStaticMarkup(<Scene screen="home" offline={false} onGo={noop} onSettings={null} ribbon={<LevelRibbon kicker="New level" title="Level 4" />} />);

		expect(html).toMatch(/<\/nav><div class="dromos-ribbon"/);
	});

	it('keeps the landscape and the signpost alone without one', () => {
		const html = renderToStaticMarkup(<Scene screen="home" offline={false} onGo={noop} onSettings={null} />);

		expect(html).toMatch(/^<div class="dromos-scene is-home" data-period="day"><svg[^>]*class="dromos-landscape"/);
		expect(html).not.toContain('dromos-ribbon');
	});
});

// Server rendering runs no timers, so the screen shows the ceremony's final state, as under reduced motion.
describe('HomeScreen runs the ceremony from the game events (game-ui S4)', () => {
	const render = (events: readonly GameEvent[]) => renderToStaticMarkup(<HomeScreen deps={homeDeps({ game: { ...IDLE_GAME, events } })} />);

	it('unfurls the ribbon over the scene and opens the panel under the card for a character level', () => {
		const html = render([levelUp, readerUp]);

		expect(sceneOf(html)).toContain('<span class="dromos-ribbon-kicker">New level</span><span class="dromos-ribbon-title">Level 4</span>');
		expect(html).toMatch(/<main[^>]*><section[^>]*aria-label="Character">.*?<\/section><section class="dromos-card dromos-ceremony"/);
		expect(html).toContain('You reached level 4');
		expect(html).toContain('Reader rose to level 3');
	});

	it('opens the panel without the ribbon when only skills moved', () => {
		const html = render([unlocked]);

		expect(sceneOf(html)).not.toContain('dromos-ribbon');
		expect(html).toContain('<h2 class="dromos-ceremony-title">Your skills moved forward</h2>');
		expect(html).toContain('New skill: Athlete');
	});

	it('draws neither while there is nothing to celebrate', () => {
		const html = render([]);

		expect(html).not.toContain('dromos-ribbon');
		expect(html).not.toContain('dromos-ceremony');
	});

	it('celebrates on the home screen only', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps({ game: { ...IDLE_GAME, events: [levelUp] } })} initialScreen="skills" />);

		expect(html).not.toContain('dromos-ribbon');
		expect(html).not.toContain('dromos-ceremony');
	});
});
