import type { CharacterLoadResult, GameStateRepository } from '../ports';
import type { QuestSnapshot, QuestState } from './QuestState';

export interface LoadHomeDeps {
	readonly repository: GameStateRepository;
	readonly state: QuestState;
}

/** What the home view shows: the character from the vault and the session's quests. */
export interface HomeSnapshot {
	readonly character: CharacterLoadResult;
	readonly quests: QuestSnapshot;
}

/**
 * Composes the character with the quests already in memory. Never touches the
 * network (D1); reads the note on every call, so a hand edit shows on reopen.
 */
export class LoadHome {
	constructor(private readonly deps: LoadHomeDeps) {}

	async execute(): Promise<HomeSnapshot> {
		const character = await this.deps.repository.loadCharacter();
		return { character, quests: this.deps.state.snapshot() };
	}
}
