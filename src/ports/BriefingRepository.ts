import type { Briefing } from '../domain';

export type BriefingLoadResult = { readonly kind: 'found'; readonly briefing: Briefing } | { readonly kind: 'missing' };

/** The briefing, `Dromos/Briefing.md`. A missing note is not an error: Esdras has not written one yet. */
export interface BriefingRepository {
	load(): Promise<BriefingLoadResult>;
}
