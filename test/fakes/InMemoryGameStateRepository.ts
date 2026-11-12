import type { CharacterLoadResult, CharacterProjection, CharacterSaveResult, GameStateRepository, TitleSaveResult } from '../../src/ports';

/** Game state held in memory. `loads` counts reads. */
export class InMemoryGameStateRepository implements GameStateRepository {
	loads = 0;
	/** Every projection saved, in order. */
	readonly saved: CharacterProjection[] = [];
	/** Every title written, in order. */
	readonly titles: string[] = [];
	/** `saveTitle` rejects with it, as a save that fails does. */
	failTitleWith: Error | null = null;
	/** Every note created, in order. */
	readonly created: { projection: CharacterProjection; created: string }[] = [];

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
		const { character } = this.result;
		this.result = {
			kind: 'found',
			character: { ...character, level: projection.level, totalXp: projection.totalXp, xpToNext: projection.xpToNext, stats: projection.stats, gameStart: projection.gameStart },
		};
		return Promise.resolve('saved');
	}

	saveTitle(title: string): Promise<TitleSaveResult> {
		if (this.failTitleWith) return Promise.reject(this.failTitleWith);
		if (this.result.kind === 'missing') return Promise.resolve('missing');
		this.titles.push(title);
		this.result = { kind: 'found', character: { ...this.result.character, title } };
		return Promise.resolve('saved');
	}

	createCharacter(projection: CharacterProjection, created: string): Promise<void> {
		this.created.push({ projection, created });
		this.result = {
			kind: 'found',
			character: { name: '', title: '', level: projection.level, totalXp: projection.totalXp, xpIntoLevel: 0, xpToNext: projection.xpToNext, stats: projection.stats, gameStart: projection.gameStart },
		};
		return Promise.resolve();
	}
}
