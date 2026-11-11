import { describe, expect, it } from 'vitest';
import type { PurchaseOutcome, ShopSnapshot } from '../../src/application';
import { createTranslator } from '../../src/i18n';
import { purchaseConfirmView, purchaseMessage, shopView } from '../../src/ui/presenters/shopView';
import { aReward } from '../fakes/FakeHabiticaShop';

const en = createTranslator('en');
const es = createTranslator('es');

const COFFEE = aReward('r-coffee', 'Coffee out', 20, { notes: 'At the corner café' });
const BOOK = aReward('r-book', 'A new book', 175);

const ready = (gold: number, rewards = [COFFEE, BOOK]): ShopSnapshot => ({ status: { kind: 'ready' }, gold, rewards });
const failed = (status: ShopSnapshot['status']): ShopSnapshot => ({ status, gold: null, rewards: null });

describe('shopView: the gold (M10 S1, S4)', () => {
	it('shows the gold as a whole number, named in words for screen readers', () => {
		const view = shopView(ready(124.62), null, en);

		expect(view.title).toBe('Shop');
		expect(view.gold).toEqual({ amount: '124', label: 'Your gold: 124 gold' });
	});

	it('names it in Spanish too', () => {
		expect(shopView(ready(1), null, es).gold).toEqual({ amount: '1', label: 'Tu oro: 1 moneda de oro' });
		expect(shopView(ready(30), null, es).gold?.label).toBe('Tu oro: 30 monedas de oro');
	});

	it('shows no gold while reading, and says it is reading', () => {
		const view = shopView(null, null, en);

		expect(view.gold).toBeNull();
		expect(view.rewards).toBeNull();
		expect(view.note).toEqual({ text: 'Reading your gold and rewards from Habitica…', tone: 'quiet' });
	});
});

describe('shopView: the Habitica rewards (M10 S1)', () => {
	it('lists each reward with its name, its notes and its price, and a button that names what it buys and its price', () => {
		const rows = shopView(ready(124.62), null, en).rewards?.rows ?? [];

		expect(rows.map(({ name, notes, price, priceLabel }) => ({ name, notes, price, priceLabel }))).toEqual([
			{ name: 'Coffee out', notes: 'At the corner café', price: '20', priceLabel: '20 gold' },
			{ name: 'A new book', notes: null, price: '175', priceLabel: '175 gold' },
		]);
		expect(rows[0]?.buy).toEqual({ text: 'Buy', ariaLabel: 'Buy Coffee out for 20 gold', enabled: true, reason: null, busy: false });
	});

	it('does not let a reward dearer than the gold be bought, and says how much is missing', () => {
		const book = shopView(ready(124.62), null, en).rewards?.rows[1];

		expect(book?.buy.enabled).toBe(false);
		expect(book?.buy.reason).toBe('You need 51 more gold');
		expect(shopView(ready(174), null, es).rewards?.rows[1]?.buy.reason).toBe('Te falta 1 moneda de oro');
	});

	it('marks the reward being bought as busy and holds every other button meanwhile', () => {
		const rows = shopView(ready(500), 'reward:r-coffee', en).rewards?.rows ?? [];

		expect(rows[0]?.buy).toEqual({ text: 'Buying…', ariaLabel: 'Buy Coffee out for 20 gold', enabled: false, reason: null, busy: true });
		expect(rows[1]?.buy).toMatchObject({ enabled: false, busy: false, reason: null });
	});

	it('says where to add rewards when Habitica has none', () => {
		expect(shopView(ready(10, []), null, en).rewards).toEqual({ title: 'Habitica rewards', rows: [], empty: 'No rewards in Habitica yet. Add them there, under Rewards.' });
	});

	it('lets nothing be bought offline or without credentials, and says so', () => {
		const cases = [
			[{ kind: 'offline' }, 'Habitica cannot be reached, so nothing can be bought now. Select Sync to try again.', 'warning'],
			[{ kind: 'not-configured' }, 'Connect your Habitica account to shop: enter your user ID and API token in the Dromos settings.', 'warning'],
			[{ kind: 'unauthorized' }, 'Habitica rejected the credentials: check them in the Dromos settings.', 'error'],
			[{ kind: 'rate-limited', retryAfterSeconds: 30 }, 'Too many requests to Habitica: wait 30 seconds, then select Sync.', 'warning'],
			[{ kind: 'error' }, 'Could not read the shop from Habitica. Try Sync again in a few minutes.', 'error'],
		] as const;
		for (const [status, text, tone] of cases) {
			const view = shopView(failed(status), null, en);
			expect(view.note).toEqual({ text, tone });
			expect(view.gold).toBeNull();
			expect(view.rewards).toBeNull();
		}
	});
});

describe('purchaseConfirmView (M10 S1)', () => {
	it('names the reward, its price and the gold left after it', () => {
		expect(purchaseConfirmView({ name: 'Coffee out', price: 20 }, 124.62, en)).toEqual({
			label: 'Confirm the purchase',
			title: 'Buy Coffee out?',
			lines: [
				{ term: 'Price', value: '20 gold' },
				{ term: 'Gold left after', value: '104 gold' },
			],
			confirm: 'Buy',
			cancel: 'Cancel',
		});
	});

	it('speaks Spanish', () => {
		expect(purchaseConfirmView({ name: 'Café', price: 1 }, 3, es)).toMatchObject({ title: '¿Comprar Café?', lines: [{ term: 'Precio', value: '1 moneda de oro' }, { term: 'Oro que te queda', value: '2 monedas de oro' }], confirm: 'Comprar', cancel: 'Cancelar' });
	});
});

describe('purchaseMessage (M10 S1)', () => {
	const message = (outcome: PurchaseOutcome) => purchaseMessage(outcome, en);

	it('says what was bought and the gold Habitica returned', () => {
		expect(message({ kind: 'bought', reward: COFFEE, gold: 104.62 })).toBe('Bought Coffee out. You have 104 gold left.');
		expect(message({ kind: 'bought', reward: COFFEE, gold: null })).toBe('Bought Coffee out.');
	});

	it('says why nothing was bought', () => {
		expect(message({ kind: 'too-dear', reward: BOOK, gold: 60 })).toBe('A new book costs 175 gold and you have 60 gold. Nothing was bought.');
		expect(message({ kind: 'not-configured' })).toBe('Connect your Habitica account to shop.');
		expect(message({ kind: 'failed', reward: COFFEE, status: { kind: 'unauthorized' } })).toBe('Habitica refused the purchase: check the credentials in the Dromos settings. Nothing was bought.');
		expect(message({ kind: 'failed', reward: COFFEE, status: { kind: 'rate-limited', retryAfterSeconds: 1 } })).toBe('Too many requests to Habitica: wait 1 second and try again. Nothing was bought.');
		expect(message({ kind: 'failed', reward: COFFEE, status: { kind: 'error' } })).toBe('Habitica could not complete the purchase. Nothing was bought.');
	});

	it('does not claim nothing was bought when Habitica did not answer', () => {
		expect(message({ kind: 'failed', reward: COFFEE, status: { kind: 'offline' } })).toBe('No answer from Habitica. Check your gold there before buying again.');
	});

	it('says nothing for a click that came while another purchase ran', () => {
		expect(message({ kind: 'busy' })).toBeNull();
	});
});
