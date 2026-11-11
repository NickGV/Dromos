import { describe, expect, it } from 'vitest';
import { PayLevelBonus } from '../../src/application/PayLevelBonus';
import { DEFAULT_RULES, type PurseEntry } from '../../src/domain';
import { TaskSourceError } from '../../src/ports/TaskSourceError';
import { FakeHabiticaShop } from '../fakes/FakeHabiticaShop';
import { FixedClock } from '../fakes/FixedClock';
import { InMemoryDeviceStore } from '../fakes/InMemoryDeviceStore';
import { InMemoryPurseRepository } from '../fakes/InMemoryPurseRepository';
import { InMemoryRulesRepository } from '../fakes/InMemoryRulesRepository';

const TODAY = '2026-11-11';
const bonusRow = (level: number, gold: number): PurseEntry => ({ date: TODAY, kind: 'bonus', what: `Level ${level}`, gold, level, offer: null });

interface Options {
	gold?: number;
	purse?: PurseEntry[];
	goldPerLevel?: number;
	credentials?: boolean;
	store?: InMemoryDeviceStore;
}

function setup(options: Options = {}) {
	const habitica = new FakeHabiticaShop(options.gold ?? 100);
	const purse = new InMemoryPurseRepository(options.purse ?? []);
	const rules = new InMemoryRulesRepository({ rules: { ...DEFAULT_RULES, goldPerLevel: options.goldPerLevel ?? DEFAULT_RULES.goldPerLevel }, invalid: null });
	const store = options.store ?? new InMemoryDeviceStore();
	const make = () => new PayLevelBonus({ gold: habitica, purse, rules, clock: new FixedClock(new Date(`${TODAY}T15:00:00Z`), TODAY), hasCredentials: () => options.credentials ?? true, store });
	return { habitica, purse, store, bonus: make(), make };
}

describe('PayLevelBonus: the gold of a new level (M10 S3)', () => {
	it('adds goldPerLevel times the level to the gold it just read, and writes the bonus into the purse once Habitica confirms', async () => {
		const { habitica, purse, bonus } = setup({ gold: 100 });

		const paid = await bonus.execute([3]);

		expect(paid).toEqual([{ kind: 'paid', level: 3, gold: 30, recorded: true }]);
		expect(habitica.calls).toEqual(['readGold', 'setGold 130']);
		expect(habitica.gold).toBe(130);
		expect(purse.appended).toEqual([[bonusRow(3, 30)]]);
	});

	it('pays 10 a level when the rules note does not set goldPerLevel, and the amount the note sets when it does', async () => {
		const byDefault = setup({ gold: 0 });
		await byDefault.bonus.execute([4]);
		expect(byDefault.habitica.calls).toContain('setGold 40');

		const set = setup({ gold: 0, goldPerLevel: 25 });
		await set.bonus.execute([4]);
		expect(set.habitica.calls).toContain('setGold 100');
		expect(set.purse.entries).toEqual([bonusRow(4, 100)]);
	});

	it('pays both levels of a double level-up, each with its own row, the second on the gold the first left', async () => {
		const { habitica, purse, bonus } = setup({ gold: 12.5 });

		const paid = await bonus.execute([4, 3]);

		expect(paid).toEqual([
			{ kind: 'paid', level: 3, gold: 30, recorded: true },
			{ kind: 'paid', level: 4, gold: 40, recorded: true },
		]);
		expect(habitica.calls).toEqual(['readGold', 'setGold 42.5', 'setGold 82.5']);
		expect(purse.entries).toEqual([bonusRow(3, 30), bonusRow(4, 40)]);
	});

	it('never pays a level that already has a bonus row in the purse, and asks Habitica nothing for it', async () => {
		const { habitica, purse, bonus } = setup({ purse: [bonusRow(3, 30)] });

		expect(await bonus.execute([3])).toEqual([]);
		expect(habitica.calls).toEqual([]);
		expect(purse.appended).toEqual([]);
	});

	it('reads the purse again right before paying: a row another device wrote meanwhile stops the payment', async () => {
		const { habitica, purse, bonus } = setup();
		purse.beforeRead = () => {
			purse.entries = [bonusRow(3, 30)];
		};

		expect(await bonus.execute([3])).toEqual([]);
		expect(purse.reads).toBe(1);
		expect(habitica.calls).toEqual([]);
	});

	it('writes nothing when Habitica refuses the payment, and pays it on the next sync', async () => {
		const { habitica, purse, bonus } = setup({ gold: 100 });
		habitica.failNext('setGold', new TaskSourceError('RateLimited', 30, 'x'));

		expect(await bonus.execute([3])).toEqual([]);
		expect(purse.appended).toEqual([]);
		expect(habitica.gold).toBe(100);

		expect(await bonus.execute([])).toEqual([{ kind: 'paid', level: 3, gold: 30, recorded: true }]);
		expect(purse.entries).toEqual([bonusRow(3, 30)]);
		expect(habitica.gold).toBe(130);
	});

	it('keeps a level not yet paid on this device, so it is paid after Obsidian restarts too', async () => {
		const first = setup({ gold: 100 });
		first.habitica.failNext('readGold', new TaskSourceError('Offline', null, 'x'));
		await first.bonus.execute([3]);

		const afterRestart = first.make();

		expect(await afterRestart.execute([])).toEqual([{ kind: 'paid', level: 3, gold: 30, recorded: true }]);
	});

	it('does not pay the rest once one payment fails, and pays them on the next sync in order', async () => {
		const { habitica, purse, bonus } = setup({ gold: 0 });
		habitica.failNext('setGold', new TaskSourceError('Unauthorized', null, 'x'));

		await bonus.execute([3, 4]);
		expect(purse.appended).toEqual([]);
		expect(habitica.calls).toEqual(['readGold', 'setGold 30']);

		await bonus.execute([]);
		expect(purse.entries).toEqual([bonusRow(3, 30), bonusRow(4, 40)]);
	});

	it('never pays again a level Habitica confirmed, even when its row could not be written', async () => {
		const { habitica, purse, bonus } = setup({ gold: 100 });
		purse.failAppendWith = new Error('disk full');

		expect(await bonus.execute([3])).toEqual([{ kind: 'paid', level: 3, gold: 30, recorded: false }]);
		purse.failAppendWith = null;

		expect(await bonus.execute([])).toEqual([]);
		expect(habitica.calls).toEqual(['readGold', 'setGold 130']);
	});

	it('asks nothing without credentials, and pays once they are set', async () => {
		const store = new InMemoryDeviceStore();
		const without = setup({ credentials: false, store });

		expect(await without.bonus.execute([3])).toEqual([]);
		expect(without.habitica.calls).toEqual([]);
		expect(without.purse.reads).toBe(0);

		expect(await setup({ store }).bonus.execute([])).toEqual([{ kind: 'paid', level: 3, gold: 30, recorded: true }]);
	});

	it('pays nothing when the purse cannot be read: it cannot tell what was paid', async () => {
		const { habitica, purse, bonus } = setup();
		purse.failReadWith = new Error('locked');

		expect(await bonus.execute([3])).toEqual([]);
		expect(habitica.calls).toEqual([]);

		purse.failReadWith = null;
		expect(await bonus.execute([])).toEqual([{ kind: 'paid', level: 3, gold: 30, recorded: true }]);
	});

	it('reads nothing at all when no level is owed', async () => {
		const { habitica, purse, bonus } = setup();

		expect(await bonus.execute([])).toEqual([]);
		expect(purse.reads).toBe(0);
		expect(habitica.calls).toEqual([]);
	});
});

describe('PayLevelBonus: a payment whose outcome is unknown (M10 S3, L8)', () => {
	const offline = () => new TaskSourceError('Offline', null, 'Habitica could not be reached');
	const UNSURE_KEY = 'level-bonus-unsure';

	it('B10: Habitica applied the payment but its answer was lost; the next sync finds the gold asked for, writes the row and sends nothing', async () => {
		const { habitica, purse, store, bonus } = setup({ gold: 100 });
		habitica.loseAnswerNext('setGold', offline());

		expect(await bonus.execute([2])).toEqual([]);
		expect(habitica.gold).toBe(120);
		expect(purse.appended).toEqual([]);
		expect(store.read(UNSURE_KEY)).toEqual({ level: 2, before: 100, asked: 120 });

		expect(await bonus.execute([])).toEqual([{ kind: 'paid', level: 2, gold: 20, recorded: true }]);
		expect(habitica.gold).toBe(120);
		expect(habitica.calls).toEqual(['readGold', 'setGold 120', 'readGold']);
		expect(purse.entries).toEqual([bonusRow(2, 20)]);

		expect(await bonus.execute([])).toEqual([]);
		expect(habitica.calls).toHaveLength(3);
		expect(store.read(UNSURE_KEY)).toBeNull();
	});

	it('pays again from the fresh gold when the next sync finds the gold before: the payment never landed', async () => {
		const { habitica, purse, bonus } = setup({ gold: 100 });
		habitica.failNext('setGold', offline());

		await bonus.execute([2]);
		habitica.gold = 100;

		expect(await bonus.execute([])).toEqual([{ kind: 'paid', level: 2, gold: 20, recorded: true }]);
		expect(habitica.calls).toEqual(['readGold', 'setGold 120', 'readGold', 'setGold 120']);
		expect(habitica.gold).toBe(120);
		expect(purse.entries).toEqual([bonusRow(2, 20)]);
	});

	it('never pays that level again when the gold is neither, and tells the user to check it', async () => {
		const { habitica, purse, bonus } = setup({ gold: 100 });
		habitica.loseAnswerNext('setGold', offline());
		await bonus.execute([2]);
		// Gold spent in Habitica meanwhile: Dromos cannot tell what happened.
		habitica.gold = 95;

		expect(await bonus.execute([])).toEqual([{ kind: 'unknown', level: 2, gold: 20 }]);
		expect(purse.appended).toEqual([]);

		expect(await bonus.execute([])).toEqual([]);
		expect(habitica.calls.filter((call) => call.startsWith('setGold'))).toEqual(['setGold 120']);
	});

	it('treats a timeout, an error status or an unreadable answer as unknown, but a refusal as clear', async () => {
		for (const error of [offline(), new TaskSourceError('Unknown', null, 'Habitica answered with status 502'), new Error('boom')]) {
			const { habitica, store, bonus } = setup({ gold: 100 });
			habitica.failNext('setGold', error);
			await bonus.execute([2]);
			expect(store.read(UNSURE_KEY)).toEqual({ level: 2, before: 100, asked: 120 });
		}
		for (const error of [new TaskSourceError('Unauthorized', null, 'x'), new TaskSourceError('RateLimited', 10, 'x')]) {
			const { habitica, store, bonus } = setup({ gold: 100 });
			habitica.failNext('setGold', error);
			await bonus.execute([2]);
			expect(store.read(UNSURE_KEY)).toBeNull();
		}
	});

	it('remembers an unknown payment across a restart', async () => {
		const first = setup({ gold: 100 });
		first.habitica.loseAnswerNext('setGold', offline());
		await first.bonus.execute([2]);

		expect(await first.make().execute([])).toEqual([{ kind: 'paid', level: 2, gold: 20, recorded: true }]);
		expect(first.habitica.calls.filter((call) => call.startsWith('setGold'))).toEqual(['setGold 120']);
	});

	it('reads the gold again before paying anything else, and pays the levels after it from that gold', async () => {
		const { habitica, purse, bonus } = setup({ gold: 100 });
		habitica.loseAnswerNext('setGold', offline());
		await bonus.execute([2, 3]);
		expect(habitica.calls).toEqual(['readGold', 'setGold 120']);

		expect(await bonus.execute([])).toEqual([
			{ kind: 'paid', level: 2, gold: 20, recorded: true },
			{ kind: 'paid', level: 3, gold: 30, recorded: true },
		]);
		expect(habitica.calls).toEqual(['readGold', 'setGold 120', 'readGold', 'setGold 150']);
		expect(purse.entries).toEqual([bonusRow(2, 20), bonusRow(3, 30)]);
	});

	it('drops an unknown payment whose level another device already wrote into the purse, and sends nothing', async () => {
		const { habitica, purse, store, bonus } = setup({ gold: 100 });
		habitica.loseAnswerNext('setGold', offline());
		await bonus.execute([2]);
		purse.entries = [bonusRow(2, 20)];

		expect(await bonus.execute([])).toEqual([]);
		expect(habitica.calls).toEqual(['readGold', 'setGold 120']);
		expect(store.read(UNSURE_KEY)).toBeNull();
	});

	it('keeps the unknown payment when the gold cannot be read again', async () => {
		const { habitica, store, bonus } = setup({ gold: 100 });
		habitica.loseAnswerNext('setGold', offline());
		await bonus.execute([2]);
		habitica.failNext('readGold', offline());

		expect(await bonus.execute([])).toEqual([]);
		expect(store.read(UNSURE_KEY)).toEqual({ level: 2, before: 100, asked: 120 });
	});
});
