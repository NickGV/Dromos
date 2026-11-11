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

		expect(paid).toEqual([{ level: 3, gold: 30, recorded: true }]);
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
			{ level: 3, gold: 30, recorded: true },
			{ level: 4, gold: 40, recorded: true },
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

	it('writes nothing when the payment fails, and pays it on the next sync', async () => {
		const { habitica, purse, bonus } = setup({ gold: 100 });
		habitica.failNext('setGold', new TaskSourceError('Offline', null, 'x'));

		expect(await bonus.execute([3])).toEqual([]);
		expect(purse.appended).toEqual([]);
		expect(habitica.gold).toBe(100);

		expect(await bonus.execute([])).toEqual([{ level: 3, gold: 30, recorded: true }]);
		expect(purse.entries).toEqual([bonusRow(3, 30)]);
		expect(habitica.gold).toBe(130);
	});

	it('keeps a level not yet paid on this device, so it is paid after Obsidian restarts too', async () => {
		const first = setup({ gold: 100 });
		first.habitica.failNext('readGold', new TaskSourceError('Offline', null, 'x'));
		await first.bonus.execute([3]);

		const afterRestart = first.make();

		expect(await afterRestart.execute([])).toEqual([{ level: 3, gold: 30, recorded: true }]);
	});

	it('does not pay the rest once one payment fails, and pays them on the next sync in order', async () => {
		const { habitica, purse, bonus } = setup({ gold: 0 });
		habitica.failNext('setGold', new Error('boom'));

		await bonus.execute([3, 4]);
		expect(purse.appended).toEqual([]);
		expect(habitica.calls).toEqual(['readGold', 'setGold 30']);

		await bonus.execute([]);
		expect(purse.entries).toEqual([bonusRow(3, 30), bonusRow(4, 40)]);
	});

	it('never pays again a level Habitica confirmed, even when its row could not be written', async () => {
		const { habitica, purse, bonus } = setup({ gold: 100 });
		purse.failAppendWith = new Error('disk full');

		expect(await bonus.execute([3])).toEqual([{ level: 3, gold: 30, recorded: false }]);
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

		expect(await setup({ store }).bonus.execute([])).toEqual([{ level: 3, gold: 30, recorded: true }]);
	});

	it('pays nothing when the purse cannot be read: it cannot tell what was paid', async () => {
		const { habitica, purse, bonus } = setup();
		purse.failReadWith = new Error('locked');

		expect(await bonus.execute([3])).toEqual([]);
		expect(habitica.calls).toEqual([]);

		purse.failReadWith = null;
		expect(await bonus.execute([])).toEqual([{ level: 3, gold: 30, recorded: true }]);
	});

	it('reads nothing at all when no level is owed', async () => {
		const { habitica, purse, bonus } = setup();

		expect(await bonus.execute([])).toEqual([]);
		expect(purse.reads).toBe(0);
		expect(habitica.calls).toEqual([]);
	});
});
