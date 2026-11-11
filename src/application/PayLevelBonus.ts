import { levelBonus, paidLevels, unpaidLevels, type PurseEntry } from '../domain';
import { TaskSourceError, type Clock, type DeviceStore, type GoldAccount, type PurseRepository, type RulesRepository } from '../ports';
import { recordInPurse } from './BuyReward';

/** Where this device keeps the levels whose bonus it still owes, so a restart does not forget them. */
export const PENDING_BONUS_KEY = 'level-bonus-pending';

/** Where this device keeps a payment whose outcome it does not know, until a later sync reads the gold (L8). */
export const UNSURE_BONUS_KEY = 'level-bonus-unsure';

/** What the bonus did for one level. */
export type LevelBonusNews =
	/** `gold` was added to Habitica for `level`; `recorded` is false when the purse could not keep its row. */
	| { readonly kind: 'paid'; readonly level: number; readonly gold: number; readonly recorded: boolean }
	/** A payment whose outcome could not be told: never paid again, and the user is told to check the gold. */
	| { readonly kind: 'unknown'; readonly level: number; readonly gold: number };

/** A `PUT /user` sent with no answer that says what Habitica did: the gold read before it and the gold it asked for. */
interface UnsurePayment {
	readonly level: number;
	readonly before: number;
	readonly asked: number;
}

export interface PayLevelBonusDeps {
	readonly gold: GoldAccount;
	readonly purse: PurseRepository;
	/** `goldPerLevel` comes from the rules note, read on each payment so an edit applies at once. */
	readonly rules: RulesRepository;
	readonly clock: Clock;
	/** True when both the Habitica user ID and token are set. */
	readonly hasCredentials: () => boolean;
	/** This device's store, where the levels still owed and an unsure payment survive a restart. */
	readonly store: DeviceStore;
}

/** How close two amounts of gold must be to be the same: Habitica keeps the number Dromos sent. */
const SAME_GOLD = 1e-6;

/**
 * The gold bonus of a new level (M10 S3, ADR-019): `goldPerLevel × level` added to Habitica's gold
 * for each level the game sync reached, once per level. The sync hands it the levels it reached;
 * they join the ones this device still owes. Right before paying, the purse is read again, and a
 * level with a `bonus` row there is never paid. Each level is paid with `PUT /user` on the gold
 * just read plus its bonus, then written into the purse. A payment Habitica clearly refused writes
 * nothing and stays owed, for the next sync; the levels after it wait too, so they are paid in order.
 *
 * A payment with no clear answer (no answer, a timeout, an error status, an unreadable answer) may
 * still have landed, since a request cannot be called back (L8). This device keeps the gold read
 * before it and the gold it asked for; the next sync reads the gold first: the gold asked for means
 * it was paid (its row is written, nothing is sent), the gold before means it was not (it is paid
 * again from that gold), and anything else is never paid again and the user is told to check.
 * A level Habitica confirmed is never owed again, even when its row cannot be written. Never rejects.
 */
export class PayLevelBonus {
	constructor(private readonly deps: PayLevelBonusDeps) {}

	async execute(reached: readonly number[]): Promise<LevelBonusNews[]> {
		const owed = this.remember(reached);
		const unsure = this.unsure();
		if ((owed.length === 0 && unsure === null) || !this.deps.hasCredentials()) return [];
		try {
			const { entries } = await this.deps.purse.read();
			if (unsure && paidLevels(entries).has(unsure.level)) this.keepUnsure(null);
			const unpaid = unpaidLevels(owed, entries);
			this.keep(unpaid);
			const pending = this.unsure();
			if (unpaid.length === 0 && pending === null) return [];
			const gold = await this.deps.gold.readGold();
			const news = pending ? await this.settle(pending, gold) : [];
			const { goldPerLevel } = (await this.deps.rules.load()).rules;
			return [...news, ...(await this.pay(this.owed(), goldPerLevel, gold))];
		} catch {
			// The purse, the rules or the gold could not be read: nothing was paid, and every level stays owed.
			return [];
		}
	}

	/** What the gold read now says of a payment whose outcome was unknown. */
	private async settle(unsure: UnsurePayment, gold: number): Promise<LevelBonusNews[]> {
		const bonus = unsure.asked - unsure.before;
		this.keepUnsure(null);
		if (Math.abs(gold - unsure.before) < SAME_GOLD) return [];
		this.keep(this.owed().filter((level) => level !== unsure.level));
		if (Math.abs(gold - unsure.asked) < SAME_GOLD) return [{ kind: 'paid', level: unsure.level, gold: bonus, recorded: await this.record(unsure.level, bonus) }];
		return [{ kind: 'unknown', level: unsure.level, gold: bonus }];
	}

	private async pay(levels: readonly number[], goldPerLevel: number, start: number): Promise<LevelBonusNews[]> {
		const paid: LevelBonusNews[] = [];
		let gold = start;
		for (const level of levels) {
			const bonus = levelBonus(goldPerLevel, level);
			try {
				gold = (await this.deps.gold.setGold(gold + bonus)) ?? gold + bonus;
			} catch (error) {
				// Refused, it stays owed; with no clear answer it may have landed, and the next sync reads the gold to tell.
				if (!isRefusal(error)) this.keepUnsure({ level, before: gold, asked: gold + bonus });
				break;
			}
			// Confirmed: never owed again, before anything else can fail.
			this.keep(this.owed().filter((owed) => owed !== level));
			paid.push({ kind: 'paid', level, gold: bonus, recorded: await this.record(level, bonus) });
		}
		return paid;
	}

	private record(level: number, bonus: number): Promise<boolean> {
		const entry: PurseEntry = { date: this.deps.clock.today(), kind: 'bonus', what: `Level ${level}`, gold: bonus, level, offer: null };
		return recordInPurse(this.deps.purse, entry);
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

	private unsure(): UnsurePayment | null {
		const stored = this.deps.store.read(UNSURE_BONUS_KEY);
		if (typeof stored !== 'object' || stored === null) return null;
		const { level, before, asked } = stored as Record<string, unknown>;
		return Number.isInteger(level) && typeof before === 'number' && typeof asked === 'number' ? { level: level as number, before, asked } : null;
	}

	private keepUnsure(payment: UnsurePayment | null): void {
		this.deps.store.write(UNSURE_BONUS_KEY, payment);
	}
}

/**
 * Whether Habitica answered that it would not apply the request: bad credentials (401) or too many
 * requests (429), checked before anything is changed. Anything else may have been applied.
 */
function isRefusal(error: unknown): boolean {
	return error instanceof TaskSourceError && (error.kind === 'Unauthorized' || error.kind === 'RateLimited');
}
