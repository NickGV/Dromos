import type { Briefing } from '../../src/domain';
import type { BriefingLoadResult, BriefingRepository } from '../../src/ports';

/** The briefing held in memory; no note unless a test sets one. An `Error` makes the read fail. */
export class InMemoryBriefingRepository implements BriefingRepository {
	loads = 0;

	constructor(public result: BriefingLoadResult | Error = { kind: 'missing' }) {}

	load(): Promise<BriefingLoadResult> {
		this.loads += 1;
		return this.result instanceof Error ? Promise.reject(this.result) : Promise.resolve(this.result);
	}
}

export function aBriefing(overrides: Partial<Briefing> = {}): Briefing {
	return { path: 'Dromos/Briefing.md', created: '2026-11-03', mission: null, nearSkillId: null, body: 'Shalom.', ...overrides };
}
