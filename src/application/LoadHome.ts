import type { BriefingLoadResult, BriefingRepository, CharacterLoadResult, GameStateRepository } from '../ports';
import type { QuestSnapshot, QuestState } from './QuestState';

export interface LoadHomeDeps {
	readonly repository: GameStateRepository;
	readonly briefings: BriefingRepository;
	readonly state: QuestState;
}

/** A note that cannot be read is said so, not hidden. */
export type CharacterState = CharacterLoadResult | { readonly kind: 'unreadable' };
export type BriefingState = BriefingLoadResult | { readonly kind: 'unreadable' };

/** What the home view shows: the character and the briefing from the vault, and the session's quests. */
export interface HomeSnapshot {
	readonly character: CharacterState;
	readonly briefing: BriefingState;
	readonly quests: QuestSnapshot;
}

/**
 * Composes the notes with the quests already in memory. Never touches the
 * network (D1); reads the notes on every call, so a hand edit shows on reopen.
 * Never rejects: each note answers for itself, so one that fails takes nothing else down,
 * and the quests still sync.
 */
export class LoadHome {
	constructor(private readonly deps: LoadHomeDeps) {}

	async execute(): Promise<HomeSnapshot> {
		const [character, briefing] = await Promise.all([this.readable(() => this.deps.repository.loadCharacter()), this.readable(() => this.deps.briefings.load())]);
		return { character, briefing, quests: this.deps.state.snapshot() };
	}

	private async readable<T>(read: () => Promise<T>): Promise<T | { readonly kind: 'unreadable' }> {
		try {
			return await read();
		} catch {
			return { kind: 'unreadable' };
		}
	}
}
