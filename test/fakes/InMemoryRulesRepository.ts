import { DEFAULT_RULES } from '../../src/domain/rules/GameRules';
import type { RulesLoadResult, RulesRepository } from '../../src/ports';

/** The rules held in memory; the defaults unless a test sets others. */
export class InMemoryRulesRepository implements RulesRepository {
	constructor(public result: RulesLoadResult = { rules: DEFAULT_RULES, invalid: null }) {}

	load(): Promise<RulesLoadResult> {
		return Promise.resolve(this.result);
	}
}
