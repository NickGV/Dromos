import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ShopSnapshot } from '../../../src/application';
import { createTranslator } from '../../../src/i18n';
import { HomeScreen } from '../../../src/ui/containers/HomeScreen';
import { focusOnDraw } from '../../../src/ui/organisms/cardEvents';
import { ShopConfirm } from '../../../src/ui/organisms/ShopConfirm';
import { ShopScreen, type ShopScreenProps } from '../../../src/ui/organisms/ShopScreen';
import { purchaseConfirmView } from '../../../src/ui/presenters/shopView';
import { NO_CHOICE, stallView, type StallChoice } from '../../../src/ui/presenters/stallView';
import { aReward } from '../../fakes/FakeHabiticaShop';
import { elementsOf } from './elements';
import { homeDeps, noop } from './homeDeps';

const en = createTranslator('en');
const es = createTranslator('es');

const COFFEE = aReward('r-coffee', 'Coffee out', 20, { notes: 'At the corner café' });
const BOOK = aReward('r-book', 'A new book', 175);
const READY: ShopSnapshot = { status: { kind: 'ready' }, gold: 124.62, rewards: [COFFEE, BOOK], purchases: [], purseUnreadable: [], offers: [], offersUnreadable: [] };

const screen = (shop: ShopSnapshot | null, busy: string | null = null, t = en, choice: StallChoice = NO_CHOICE) => renderToStaticMarkup(<ShopScreen view={stallView(shop, busy, choice, t)} onBuy={noop} onTab={noop} onChoose={noop} />);

/** The screen's tree, its components not called, so a test reaches its buttons' handlers. */
const treeOf = (shop: ShopSnapshot, handlers: Partial<Pick<ShopScreenProps, 'onBuy' | 'onTab' | 'onChoose'>> = {}, choice: StallChoice = NO_CHOICE) =>
	elementsOf(ShopScreen({ view: stallView(shop, null, choice, en), onBuy: noop, onTab: noop, onChoose: noop, ...handlers }));

/** Every `<button>` as its opening tag and its text. */
const buttons = (html: string): { tag: string; text: string }[] => [...html.matchAll(/(<button[^>]*>)(.*?)<\/button>/g)].map((match) => ({ tag: match[1] ?? '', text: (match[2] ?? '').replace(/<[^>]+>/g, '') }));
const attribute = (tag: string, name: string): string | undefined => new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1];
/** The tiles of the panel shown, as their opening tags. */
const tiles = (html: string) => buttons(shownPanels(html)).filter(({ tag }) => tag.includes('dromos-ware ') || tag.includes('dromos-ware"'));
/** The Buy buttons of the panel shown. */
const buyButtons = (html: string) => buttons(shownPanels(html)).filter(({ tag }) => tag.includes('data-shop-key'));
/** The markup of the tab panels that are not hidden. */
const shownPanels = (html: string): string =>
	html
		.split(/(?=<div role="tabpanel")/)
		.filter((part) => part.startsWith('<div role="tabpanel"') && !/^<div role="tabpanel"[^>]*hidden=""/.test(part))
		.join('');

describe('ShopScreen: the stall (M10 S1, S4, S6)', () => {
	it('opens with its header card, "Shop", and the gold on a coin plaque hung in the stall, named in words', () => {
		const html = screen(READY);

		expect(html).toMatch(/^<div class="dromos-shop"><header class="dromos-panel dromos-screen-header"><h2[^>]*data-screen-heading="true">Shop<\/h2><\/header>/);
		expect(html).toMatch(/<p class="dromos-stall-plaque"><span class="dromos-visually-hidden">Your gold: 124 gold<\/span>/);
		expect(html).toMatch(/<span class="dromos-stall-plaque-amount" aria-hidden="true">124<\/span>/);
		expect(html).not.toContain('124.62');
	});

	it('draws the stall for the time of day as a picture screen readers skip, and still and faded offline', () => {
		const html = renderToStaticMarkup(<ShopScreen view={stallView(READY, null, NO_CHOICE, en)} period="dusk" onBuy={noop} onTab={noop} onChoose={noop} />);

		expect(html).toMatch(/<div class="dromos-stall" data-period="dusk"><svg class="dromos-stall-art[^"]*"[^>]*aria-hidden="true"/);
		expect(screen({ ...READY, status: { kind: 'offline' }, gold: null, rewards: null })).toContain('<div class="dromos-stall is-offline" data-period="day">');
	});

	it("puts the tabs in a real tab list, each controlling its panel, the user's Habitica rewards shown first and the others hidden", () => {
		const html = screen(READY);
		const tabs = buttons(html).filter(({ tag }) => tag.includes('role="tab"'));

		expect(html).toContain('<div class="dromos-stall-tabs" role="tablist" aria-label="The stall">');
		expect(tabs.map(({ tag }) => [attribute(tag, 'aria-label'), attribute(tag, 'aria-selected'), attribute(tag, 'tabindex')])).toEqual([
			['Habitica rewards', 'true', '0'],
			['Esdras&#x27;s offers', 'false', '-1'],
			['Last purchases', 'false', '-1'],
		]);
		expect(html).toContain('<span class="dromos-stall-tab-long">Habitica rewards</span><span class="dromos-stall-tab-short">Rewards</span>');
		for (const { tag } of tabs) {
			const panel = attribute(tag, 'aria-controls') ?? '';
			expect(html).toMatch(new RegExp(`<div role="tabpanel" id="${panel}" aria-labelledby="${attribute(tag, 'id') ?? ''}"`));
		}
		expect(html.match(/<div role="tabpanel"[^>]*hidden=""/g)).toHaveLength(2);
	});

	it('shows the tab the user chose and hands a tab its click', () => {
		const chosen: string[] = [];
		const tab = treeOf(READY, { onTab: (id) => chosen.push(id) }).filter((element) => element.props.role === 'tab')[2];
		(tab?.props.onClick as () => void)();

		expect(chosen).toEqual(['purchases']);
		expect(shownPanels(screen(READY, null, en, { tab: 'purchases', chosen: {} }))).toContain('Nothing bought yet.');
	});

	it('moves along the tabs with the arrow keys and gives the focus to the tab it moves to', () => {
		const chosen: string[] = [];
		const focused: string[] = [];
		const list = treeOf(READY, { onTab: (id) => chosen.push(id) }).find((element) => element.props.role === 'tablist');
		const keyDown = list?.props.onKeyDown as (event: unknown) => void;
		const event = (key: string) => ({ key, preventDefault: noop, currentTarget: { querySelector: (selector: string) => ({ focus: () => focused.push(selector) }) } });

		keyDown(event('ArrowRight'));
		keyDown(event('End'));
		keyDown(event('Tab'));

		expect(chosen).toEqual(['offers', 'purchases']);
		expect(focused).toEqual(['[data-tab="offers"]', '[data-tab="purchases"]']);
	});

	it('lists the rewards as tiles, each a button named by its ware, its price and whether it can be bought, the first affordable pressed', () => {
		const html = screen(READY);

		expect(tiles(html).map(({ tag }) => [attribute(tag, 'aria-label'), attribute(tag, 'aria-pressed')])).toEqual([
			['Coffee out, 20 gold, can be bought', 'true'],
			['A new book, 175 gold, you need 51 more gold', 'false'],
		]);
	});

	it("draws each tile's object and, out of reach, a lock and how much gold is missing", () => {
		const [coffee, book] = tiles(screen(READY));

		expect(coffee?.tag).toContain('class="dromos-ware is-figs"');
		expect(book?.tag).toContain('class="dromos-ware is-chest is-locked"');
		expect(screen(READY)).toMatch(/<span class="dromos-ware-missing" aria-hidden="true">51 more<\/span>/);
	});

	it('gives a tile its tab and key to choose it, and buys nothing', () => {
		const chosen: string[] = [];
		const bought: string[] = [];
		const book = treeOf(READY, { onChoose: (tab, key) => chosen.push(`${tab} ${key}`), onBuy: (key) => bought.push(key) }).find((element) => element.props['data-ware-key'] === 'reward:r-book');
		(book?.props.onClick as () => void)();

		expect(chosen).toEqual(['rewards reward:r-book']);
		expect(bought).toEqual([]);
	});

	it('shows the chosen ware in a detail panel labelled by its name: its notes, its price, the gold left after it, and Buy naming what it buys and its price', () => {
		const html = screen(READY);
		const detail = /<section class="dromos-panel dromos-ware-detail" aria-labelledby="([^"]*)">/.exec(shownPanels(html));

		expect(detail).not.toBeNull();
		expect(shownPanels(html)).toContain(`<h3 class="dromos-ware-detail-name" id="${detail?.[1] ?? ''}">Coffee out</h3>`);
		expect(shownPanels(html)).toContain('At the corner café');
		expect(shownPanels(html)).toMatch(/Price<\/dt><dd[^>]*>20 gold<\/dd>/);
		expect(shownPanels(html)).toMatch(/Gold left after<\/dt><dd[^>]*>104 gold<\/dd>/);
		expect(buyButtons(html).map(({ tag, text }) => [attribute(tag, 'aria-label'), text])).toEqual([['Buy Coffee out for 20 gold', 'Buy']]);
	});

	it('holds Buy of a reward dearer than the gold, focusable, with the reason as its description', () => {
		const html = screen(READY, null, en, { tab: null, chosen: { rewards: 'reward:r-book' } });
		const [buy] = buyButtons(html);

		expect(buy?.tag).toContain('aria-disabled="true"');
		const described = attribute(buy?.tag ?? '', 'aria-describedby') ?? '';
		expect(described).not.toBe('');
		expect(html).toContain(`id="${described}">You need 51 more gold</p>`);
		expect(buyButtons(screen(READY))[0]?.tag).not.toContain('aria-disabled');
	});

	it('gives the click of an available Buy the key of its reward, and none to a held one', () => {
		const clicked: string[] = [];
		const buyOf = (choice: StallChoice) => treeOf(READY, { onBuy: (key) => clicked.push(key) }, choice).find((element) => element.props['data-shop-key'] === choice.chosen.rewards);

		(buyOf({ tab: null, chosen: { rewards: 'reward:r-coffee' } })?.props.onClick as () => void)();
		expect(buyOf({ tab: null, chosen: { rewards: 'reward:r-book' } })?.props.onClick).toBeUndefined();
		expect(clicked).toEqual(['reward:r-coffee']);
	});

	it('says offline that nothing can be bought, and draws no Buy', () => {
		const html = screen({ status: { kind: 'offline' }, gold: null, rewards: null, purchases: [], purseUnreadable: [], offers: [], offersUnreadable: [] });

		expect(html).toContain('Habitica cannot be reached, so nothing can be bought now. Select Sync to try again.');
		expect(buttons(html).filter(({ tag }) => tag.includes('data-shop-key'))).toEqual([]);
		expect(html).not.toContain('Your gold');
	});

	it('says while reading that it is reading, and draws no tabs', () => {
		const html = screen(null);

		expect(html).toContain('Reading your gold and rewards from Habitica…');
		expect(html).not.toContain('role="tablist"');
	});

	it('says in a sentence when Habitica has no rewards, with no tiles and no detail', () => {
		const html = screen({ ...READY, rewards: [] });

		expect(shownPanels(html)).toContain('No rewards in Habitica yet. Add them there, under Rewards.');
		expect(tiles(html)).toEqual([]);
		expect(shownPanels(html)).not.toContain('dromos-ware-detail');
	});

	it('speaks Spanish', () => {
		const html = screen(READY, null, es);

		expect(html).toMatch(/<h2[^>]*>Tienda<\/h2>/);
		expect(html).toContain('Tu oro: 124 monedas de oro');
		expect(buyButtons(html)[0]?.tag).toContain('aria-label="Comprar Coffee out por 20 monedas de oro"');
		expect(attribute(tiles(html)[1]?.tag ?? '', 'aria-label')).toBe('A new book, 175 monedas de oro, te faltan 51 monedas de oro');
	});
});

describe("ShopScreen: Esdras's offers (M10 S2)", () => {
	const OFFERS: ShopSnapshot = { ...READY, offers: [{ id: 'book-week', offer: 'A book of the week', price: 40, why: 'Five days of reading in a row', until: '2026-11-20' }] };
	const ON_OFFERS: StallChoice = { tab: 'offers', chosen: {} };

	it('shows them in their tab, the chosen one with its why, its last day and a Buy naming it and its price', () => {
		const html = screen(OFFERS, null, en, ON_OFFERS);

		expect(shownPanels(html)).toContain('Five days of reading in a row');
		expect(shownPanels(html)).toContain('<p class="dromos-shop-item-until">Until 20 Nov</p>');
		expect(buyButtons(html).map(({ tag }) => attribute(tag, 'aria-label'))).toEqual(['Buy A book of the week for 40 gold']);
	});

	it('hands the click the key of the offer', () => {
		const clicked: string[] = [];
		const offer = treeOf({ ...OFFERS, rewards: [] }, { onBuy: (key) => clicked.push(key) }, ON_OFFERS).find((element) => element.props['data-shop-key'] === 'offer:book-week');

		(offer?.props.onClick as () => void)();
		expect(clicked).toEqual(['offer:book-week']);
	});

	it('shows them offline, opened on their tab, with no Buy', () => {
		const html = screen({ ...OFFERS, status: { kind: 'offline' }, gold: null, rewards: null });

		expect(shownPanels(html)).toContain('A book of the week');
		expect(buttons(html).filter(({ tag }) => tag.includes('data-shop-key'))).toEqual([]);
	});

	it("says in a sentence when Esdras has none, and which rows of Shop.md it could not read", () => {
		const html = screen({ ...READY, offersUnreadable: [{ path: 'Dromos/Shop.md', line: 7, text: '| x |' }] }, null, en, ON_OFFERS);

		expect(shownPanels(html)).toContain('Esdras has no offers right now.');
		expect(shownPanels(html)).toContain('1 row of Dromos/Shop.md could not be read (line 7).');
	});
});

describe('ShopScreen: the last purchases (M10 S3, S4)', () => {
	const ON_PURCHASES: StallChoice = { tab: 'purchases', chosen: {} };

	it('lists them as journal lines in their tab, the gold they took in words for screen readers', () => {
		const html = screen({ ...READY, purchases: [{ date: '2026-11-11', kind: 'purchase', what: 'Coffee out', gold: -20, level: null, offer: null }] }, null, en, ON_PURCHASES);

		expect(shownPanels(html)).toMatch(/<li class="dromos-shop-purchase"><span class="dromos-shop-purchase-day">11 Nov<\/span><span class="dromos-shop-purchase-what">Coffee out<\/span><span class="dromos-shop-purchase-gold"><span aria-hidden="true">−20<\/span><span class="dromos-visually-hidden">20 gold spent<\/span><\/span><\/li>/);
	});

	it('says when nothing was bought yet, and which rows of the purse it could not read', () => {
		const html = screen({ ...READY, purseUnreadable: [{ path: 'Dromos/Purse.md', line: 9, text: '| x |' }] }, null, en, ON_PURCHASES);

		expect(shownPanels(html)).toContain('Nothing bought yet.');
		expect(shownPanels(html)).toContain('1 row of Dromos/Purse.md could not be read (line 9).');
	});
});

describe('ShopConfirm (M10 S1)', () => {
	const view = purchaseConfirmView({ name: 'Coffee out', price: 20 }, 124.62, en);

	it('names the reward, its price and the gold left after it, with Cancel first and Buy after it', () => {
		const html = renderToStaticMarkup(<ShopConfirm view={view} answer={noop} />);

		expect(html).toContain('Buy Coffee out?');
		expect(html).toMatch(/Price<\/dt><dd[^>]*>20 gold<\/dd>/);
		expect(html).toMatch(/Gold left after<\/dt><dd[^>]*>104 gold<\/dd>/);
		expect(buttons(html).map(({ text }) => text)).toEqual(['Cancel', 'Buy']);
	});

	it('gives the focus to Cancel, so a second Enter on the Shop never confirms; Buy is one Tab away (L8)', () => {
		const [cancel, buy] = elementsOf(ShopConfirm({ view, answer: noop })).filter((element) => element.type === 'button');
		const refOf = (element: unknown) => (element as { ref?: unknown }).ref ?? null;

		expect(refOf(cancel)).toBe(focusOnDraw);
		expect(refOf(buy)).toBeNull();
	});

	it('answers yes from Buy and no from Cancel', () => {
		const answers: boolean[] = [];
		const [cancel, buy] = elementsOf(ShopConfirm({ view, answer: (yes) => answers.push(yes) })).filter((element) => element.type === 'button');

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
