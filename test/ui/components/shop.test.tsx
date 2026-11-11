import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ShopSnapshot } from '../../../src/application';
import { createTranslator } from '../../../src/i18n';
import { HomeScreen } from '../../../src/ui/containers/HomeScreen';
import { ShopConfirm } from '../../../src/ui/organisms/ShopConfirm';
import { ShopScreen } from '../../../src/ui/organisms/ShopScreen';
import { purchaseConfirmView, shopView } from '../../../src/ui/presenters/shopView';
import { aReward } from '../../fakes/FakeHabiticaShop';
import { elementsOf } from './elements';
import { homeDeps, noop } from './homeDeps';

const en = createTranslator('en');
const es = createTranslator('es');

const COFFEE = aReward('r-coffee', 'Coffee out', 20, { notes: 'At the corner café' });
const BOOK = aReward('r-book', 'A new book', 175);
const READY: ShopSnapshot = { status: { kind: 'ready' }, gold: 124.62, rewards: [COFFEE, BOOK] };

const screen = (shop: ShopSnapshot | null, busy: string | null = null, t = en) => renderToStaticMarkup(<ShopScreen view={shopView(shop, busy, t)} onBuy={noop} />);

/** Every `<button>` as its opening tag and its text. */
const buttons = (html: string): { tag: string; text: string }[] => [...html.matchAll(/(<button[^>]*>)(.*?)<\/button>/g)].map((match) => ({ tag: match[1] ?? '', text: (match[2] ?? '').replace(/<[^>]+>/g, '') }));

describe('ShopScreen (M10 S1, S4)', () => {
	it('opens with its header card, "Shop", and the gold in it, named in words', () => {
		const html = screen(READY);

		expect(html).toMatch(/^<div class="dromos-shop"><header class="dromos-panel dromos-screen-header has-aside"><h2[^>]*data-screen-heading="true">Shop<\/h2>/);
		expect(html).toContain('<span class="dromos-visually-hidden">Your gold: 124 gold</span>');
		expect(html).toMatch(/<span class="dromos-shop-gold-amount" aria-hidden="true">124<\/span>/);
		expect(html).not.toContain('124.62');
	});

	it('lists the rewards under their title, each with a buy button that names what it buys and its price', () => {
		const html = screen(READY);

		expect(html).toContain('<h3 class="dromos-card-title">Habitica rewards</h3>');
		expect(html).toContain('Coffee out');
		expect(html).toContain('At the corner café');
		expect(buttons(html).map(({ tag, text }) => [/aria-label="([^"]*)"/.exec(tag)?.[1], text])).toEqual([
			['Buy Coffee out for 20 gold', 'Buy'],
			['Buy A new book for 175 gold', 'Buy'],
		]);
	});

	it('holds the button of a reward dearer than the gold, focusable, with the reason as its description', () => {
		const html = screen(READY);
		const book = buttons(html)[1]?.tag ?? '';

		expect(book).toContain('aria-disabled="true"');
		const described = /aria-describedby="([^"]*)"/.exec(book)?.[1] ?? '';
		expect(described).not.toBe('');
		expect(html).toContain(`id="${described}">You need 51 more gold</p>`);
		expect(buttons(html)[0]?.tag).not.toContain('aria-disabled');
	});

	it('gives the click of an available button the key of its reward, and none to a held one', () => {
		const clicked: string[] = [];
		const tree = ShopScreen({ view: shopView(READY, null, en), onBuy: (key) => clicked.push(key) });
		const [coffee, book] = elementsOf(tree).filter((element) => element.type === 'button');

		(coffee?.props.onClick as () => void)();
		expect(book?.props.onClick).toBeUndefined();
		expect(clicked).toEqual(['reward:r-coffee']);
	});

	it('says offline that nothing can be bought, and draws no buy button', () => {
		const html = screen({ status: { kind: 'offline' }, gold: null, rewards: null });

		expect(html).toContain('Habitica cannot be reached, so nothing can be bought now. Select Sync to try again.');
		expect(buttons(html)).toEqual([]);
		expect(html).not.toContain('Your gold');
	});

	it('says while reading that it is reading', () => {
		expect(screen(null)).toContain('Reading your gold and rewards from Habitica…');
	});

	it('speaks Spanish', () => {
		const html = screen(READY, null, es);

		expect(html).toMatch(/<h2[^>]*>Tienda<\/h2>/);
		expect(html).toContain('Tu oro: 124 monedas de oro');
		expect(buttons(html)[0]?.tag).toContain('aria-label="Comprar Coffee out por 20 monedas de oro"');
	});
});

describe('ShopConfirm (M10 S1)', () => {
	const view = purchaseConfirmView({ name: 'Coffee out', price: 20 }, 124.62, en);

	it('names the reward, its price and the gold left after it, with Buy first and Cancel', () => {
		const html = renderToStaticMarkup(<ShopConfirm view={view} answer={noop} />);

		expect(html).toContain('Buy Coffee out?');
		expect(html).toMatch(/Price<\/dt><dd[^>]*>20 gold<\/dd>/);
		expect(html).toMatch(/Gold left after<\/dt><dd[^>]*>104 gold<\/dd>/);
		expect(buttons(html).map(({ text }) => text)).toEqual(['Buy', 'Cancel']);
	});

	it('answers yes from Buy and no from Cancel', () => {
		const answers: boolean[] = [];
		const [buy, cancel] = elementsOf(ShopConfirm({ view, answer: (yes) => answers.push(yes) })).filter((element) => element.type === 'button');

		(buy?.props.onClick as () => void)();
		(cancel?.props.onClick as () => void)();

		expect(answers).toEqual([true, false]);
	});
});

describe('HomeScreen: the Shop screen (M10 S4)', () => {
	it('opens the shop behind its plank, burnt in, with nothing of the other screens', () => {
		const html = renderToStaticMarkup(<HomeScreen deps={homeDeps()} initialScreen="shop" />);

		expect(html).toMatch(/<button type="button" class="dromos-plank is-current" aria-current="page">Shop<\/button>/);
		expect(html).toMatch(/<h2[^>]*>Shop<\/h2>/);
		expect(html).toContain('Reading your gold and rewards from Habitica…');
		for (const section of ['dromos-quests', 'dromos-campaigns', 'dromos-skills', 'dromos-chronicle', 'dromos-library']) expect(html).not.toContain(section);
	});

	it('keeps the shop off the other screens', () => {
		for (const screen of ['home', 'campaigns', 'skills', 'library', 'chronicle'] as const) expect(renderToStaticMarkup(<HomeScreen deps={homeDeps()} initialScreen={screen} />)).not.toContain('dromos-shop');
	});
});
