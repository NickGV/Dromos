import { isValidElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import type { ShopSnapshot } from '../../src/application';
import type { CardModalOptions } from '../../src/ui/containers/LibraryPanel';
import { askToConfirm, buyAfterConfirming, shopAfter } from '../../src/ui/containers/shopActions';

/** Opens a fake card: records what it was opened with and whether it was closed. */
function fakeCard() {
	const opened: CardModalOptions[] = [];
	let closed = 0;
	const open = (options: CardModalOptions) => {
		opened.push(options);
		return {
			show: () => undefined,
			close: () => {
				closed += 1;
				options.onClose();
			},
		};
	};
	return { open, opened, closedCount: () => closed };
}

/** The answer a confirmation drawn by `askToConfirm` hands its buttons. */
type Answer = (yes: boolean) => void;

function answerOf(content: ReactNode): Answer {
	if (!isValidElement(content)) throw new Error('no element');
	const props = content.props as { answer?: Answer };
	if (typeof props.answer !== 'function') throw new Error('no answer');
	return props.answer;
}

const Confirm = (_props: { answer: Answer }) => null;
const render = (answer: Answer) => <Confirm answer={answer} />;

describe('askToConfirm (M10 S1)', () => {
	it('opens the confirmation with its name and language, and answers yes when its primary choice is taken', async () => {
		const card = fakeCard();

		const answered = askToConfirm(card.open, { label: 'Confirm the purchase', lang: 'en' }, render);
		answerOf(card.opened[0]?.content)(true);

		expect(await answered).toBe(true);
		expect(card.opened[0]).toMatchObject({ label: 'Confirm the purchase', lang: 'en' });
		expect(card.closedCount()).toBe(1);
	});

	it('answers no when cancelled, and when the card is closed any other way (Escape, its close button)', async () => {
		const cancelled = fakeCard();
		const byCancel = askToConfirm(cancelled.open, { label: 'x', lang: 'en' }, render);
		answerOf(cancelled.opened[0]?.content)(false);
		expect(await byCancel).toBe(false);

		const escaped = fakeCard();
		const byEscape = askToConfirm(escaped.open, { label: 'x', lang: 'en' }, render);
		escaped.opened[0]?.onClose();
		expect(await byEscape).toBe(false);
	});

	it('answers once: a second click after the first answer changes nothing', async () => {
		const card = fakeCard();
		const answered = askToConfirm(card.open, { label: 'x', lang: 'en' }, render);
		const answer = answerOf(card.opened[0]?.content);

		answer(false);
		answer(true);

		expect(await answered).toBe(false);
		expect(card.closedCount()).toBe(1);
	});
});

describe('buyAfterConfirming (M10 S1)', () => {
	it('buys only after the confirmation, once', async () => {
		const steps: string[] = [];

		const result = await buyAfterConfirming(
			() => {
				steps.push('ask');
				return Promise.resolve(true);
			},
			() => {
				steps.push('buy');
				return Promise.resolve('bought');
			},
		);

		expect(result).toBe('bought');
		expect(steps).toEqual(['ask', 'buy']);
	});

	it('never buys when the confirmation is cancelled', async () => {
		let bought = 0;

		const result = await buyAfterConfirming(
			() => Promise.resolve(false),
			() => {
				bought += 1;
				return Promise.resolve('bought');
			},
		);

		expect(result).toBeNull();
		expect(bought).toBe(0);
	});
});

describe('shopAfter: the shop once a purchase settles (M10 S1-S3)', () => {
	const COFFEE = { id: 'r-coffee', name: 'Coffee out', notes: null, price: 20, alias: null };
	const BOOK_WEEK = { id: 'book-week', offer: 'A book of the week', price: 40, why: null, until: null };
	const shop: ShopSnapshot = { status: { kind: 'ready' }, gold: 124, rewards: [COFFEE], purchases: [], purseUnreadable: [], offers: [BOOK_WEEK], offersUnreadable: [] };
	const offerRow = { date: '2026-11-11', kind: 'purchase', what: 'A book of the week', gold: -40, level: null, offer: 'book-week' } as const;

	it('shows the gold Habitica returned, the purchase first in the purse, and takes a bought offer away', () => {
		const after = shopAfter(shop, { kind: 'bought', item: { name: 'A book of the week', price: 40 }, gold: 84, recorded: true, entry: offerRow });

		expect(after).toEqual({ ...shop, gold: 84, purchases: [offerRow], offers: [] });
	});

	it('keeps the purse as it was when the row could not be written, but still takes the offer away', () => {
		const after = shopAfter(shop, { kind: 'bought', item: { name: 'A book of the week', price: 40 }, gold: 84, recorded: false, entry: offerRow });

		expect(after).toEqual({ ...shop, gold: 84, offers: [] });
	});

	it('shows the gold a refusal read, and changes nothing after a failure', () => {
		expect(shopAfter(shop, { kind: 'too-dear', item: COFFEE, gold: 12 })).toEqual({ ...shop, gold: 12 });
		expect(shopAfter(shop, { kind: 'failed', item: COFFEE, status: { kind: 'offline' } })).toBe(shop);
	});

	it('asks for a new read when it cannot tell the gold or the offer is gone', () => {
		expect(shopAfter(shop, { kind: 'bought', item: COFFEE, gold: null, recorded: true, entry: { ...offerRow, what: 'Coffee out', gold: -20, offer: null } })).toBeNull();
		expect(shopAfter(shop, { kind: 'already-bought', item: { name: 'A book of the week', price: 40 } })).toBeNull();
	});
});
