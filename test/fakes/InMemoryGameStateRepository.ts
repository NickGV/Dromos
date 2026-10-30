import type { CharacterLoadResult, GameStateRepository } from '../../src/ports';

/** Game state held in memory. `loads` counts reads. */
export class InMemoryGameStateRepository implements GameStateRepository {
	loads = 0;

	constructor(private result: CharacterLoadResult) {}

	/** Replaces what the next read returns, like editing `Character.md` by hand. */
	set(result: CharacterLoadResult): void {
		this.result = result;
	}

	loadCharacter(): Promise<CharacterLoadResult> {
		this.loads += 1;
		return Promise.resolve(this.result);
	}
}
