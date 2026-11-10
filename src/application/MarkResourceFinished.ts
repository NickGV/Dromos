import type { Clock, ResourceRepository, ResourceWriteResult } from '../ports';

export type MarkResourceFinishedOutcome =
	/** The resource has today as `finished`. */
	| { readonly kind: 'finished' }
	| { readonly kind: 'not-found' }
	/** It already had a `finished` date, which is kept: nothing was written. */
	| { readonly kind: 'already-finished' }
	/** The note could not be saved: the resource is still pending. */
	| { readonly kind: 'write-failed' };

export interface MarkResourceFinishedDeps {
	readonly repository: ResourceRepository;
	/** Gives `finished`. */
	readonly clock: Clock;
}

/**
 * "Marcar como leído" (visto, escuchado) on a resource of the archive (M8 S6): writes today as
 * `finished`, and nothing else. It touches no network and gives no XP (Q033). The resource is
 * sealed only once "Lo que me dejó" has text (S3). Never rejects.
 */
export class MarkResourceFinished {
	constructor(private readonly deps: MarkResourceFinishedDeps) {}

	async execute(path: string): Promise<MarkResourceFinishedOutcome> {
		const { repository, clock } = this.deps;
		const resource = (await repository.list()).find((candidate) => candidate.path === path);
		if (!resource) return { kind: 'not-found' };
		if (resource.finished !== null) return { kind: 'already-finished' };

		let result: ResourceWriteResult;
		try {
			result = await repository.markFinished(path, { finished: clock.today() });
		} catch {
			return { kind: 'write-failed' };
		}
		if (result === 'done') return { kind: 'finished' };
		return result === 'already-finished' ? { kind: 'already-finished' } : { kind: 'not-found' };
	}
}
