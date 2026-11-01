import type { CharacterLoadResult, CharacterProjection, CharacterSaveResult, GameStateRepository } from '../../src/ports';

/** Game state held in memory. `loads` counts reads. */
export class InMemoryGameStateRepository implements GameStateRepository {
	loads = 0;
	/** Every projection saved, in order. */
	readonly saved: CharacterProjection[] = [];

	constructor(private result: CharacterLoadResult) {}

	/** Replaces what the next read returns, like editing `Character.md` by hand. */
	set(result: CharacterLoadResult): void {
		this.result = result;
	}

	loadCharacter(): Promise<CharacterLoadResult> {
		this.loads += 1;
		return Promise.resolve(this.result);
	}

	saveCharacter(projection: CharacterProjection): Promise<CharacterSaveResult> {
		if (this.result.kind === 'missing') return Promise.resolve('missing');
		this.saved.push(projection);
		return Promise.resolve('saved');
	}
}
