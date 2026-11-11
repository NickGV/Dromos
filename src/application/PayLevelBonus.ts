import { levelBonus, unpaidLevels, type PurseEntry } from '../domain';
import type { Clock, DeviceStore, GoldAccount, PurseRepository, RulesRepository } from '../ports';
import { recordInPurse } from './BuyReward';

/** Where this device keeps the levels whose bonus it still owes, so a restart does not forget them. */
export const PENDING_BONUS_KEY = 'level-bonus-pending';

/** One bonus paid: the level, the gold added, and whether its purse row could be written. */
export interface LevelBonusPaid {
	readonly level: number;
	readonly gold: number;
	readonly recorded: boolean;
}

export interface PayLevelBonusDeps {
	readonly gold: GoldAccount;
	readonly purse: PurseRepository;
	/** `goldPerLevel` comes from the rules note, read on each payment so an edit applies at once. */
	readonly rules: RulesRepository;
	readonly clock: Clock;
	/** True when both the Habitica user ID and token are set. */
	readonly hasCredentials: () => boolean;
	/** This device's store, where the levels still owed survive a restart. */
	readonly store: DeviceStore;
}

/**
 * The gold bonus of a new level (M10 S3, ADR-019): `goldPerLevel × level` added to Habitica's gold
 * for each level the game sync reached, once per level. The sync hands it the levels it reached;
 * they join the ones this device still owes. Right before paying, the purse is read again, and a
 * level with a `bonus` row there is never paid. Each level is paid with `PUT /user` on the gold
 * just read plus its bonus, then written into the purse. A payment that fails writes nothing and
 * stays owed, for the next sync; the levels after it wait too, so they are paid in order. A level
 * Habitica confirmed is never owed again, even when its row cannot be written. Never rejects.
 */
export class PayLevelBonus {
	constructor(private readonly deps: PayLevelBonusDeps) {}

	async execute(reached: readonly number[]): Promise<LevelBonusPaid[]> {
		const owed = this.remember(reached);
		if (owed.length === 0 || !this.deps.hasCredentials()) return [];
		try {
			const unpaid = unpaidLevels(owed, (await this.deps.purse.read()).entries);
			this.keep(unpaid);
			if (unpaid.length === 0) return [];
			const { goldPerLevel } = (await this.deps.rules.load()).rules;
			return await this.pay(unpaid, goldPerLevel);
		} catch {
			// The purse, the rules or the gold could not be read: nothing was paid, and every level stays owed.
			return [];
		}
	}

	private async pay(levels: readonly number[], goldPerLevel: number): Promise<LevelBonusPaid[]> {
		const { gold: account, purse, clock } = this.deps;
		const paid: LevelBonusPaid[] = [];
		let gold = await account.readGold();
		for (const level of levels) {
			const bonus = levelBonus(goldPerLevel, level);
			try {
				gold = (await account.setGold(gold + bonus)) ?? gold + bonus;
			} catch {
				// Habitica did not confirm: this level and the ones after it stay owed, in order.
				break;
			}
			// Confirmed: never owed again, before anything else can fail.
			this.keep(this.owed().filter((owed) => owed !== level));
			const entry: PurseEntry = { date: clock.today(), kind: 'bonus', what: `Level ${level}`, gold: bonus, level, offer: null };
			paid.push({ level, gold: bonus, recorded: await recordInPurse(purse, entry) });
		}
		return paid;
	}

	/** Adds `reached` to the levels owed on this device and answers with all of them. */
	private remember(reached: readonly number[]): number[] {
		const owed = [...new Set([...this.owed(), ...reached])].sort((left, right) => left - right);
		if (reached.length > 0) this.keep(owed);
		return owed;
	}

	private owed(): number[] {
		const stored = this.deps.store.read(PENDING_BONUS_KEY);
		return Array.isArray(stored) ? stored.filter((level): level is number => Number.isInteger(level) && level > 0) : [];
	}

	private keep(levels: readonly number[]): void {
		this.deps.store.write(PENDING_BONUS_KEY, levels.length > 0 ? [...levels] : null);
	}
}
