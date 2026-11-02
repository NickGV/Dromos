import type { BriefingLoadResult, BriefingRepository, CharacterLoadResult, GameStateRepository } from '../ports';
import type { QuestSnapshot, QuestState } from './QuestState';

export interface LoadHomeDeps {
	readonly repository: GameStateRepository;
	readonly briefings: BriefingRepository;
	readonly state: QuestState;
}

/** The briefing as the home view gets it: a note that cannot be read is said so, not hidden. */
export type BriefingState = BriefingLoadResult | { readonly kind: 'unreadable' };

/** What the home view shows: the character and the briefing from the vault, and the session's quests. */
export interface HomeSnapshot {
	readonly character: CharacterLoadResult;
	readonly briefing: BriefingState;
	readonly quests: QuestSnapshot;
}

/**
 * Composes the notes with the quests already in memory. Never touches the
 * network (D1); reads the notes on every call, so a hand edit shows on reopen.
 */
export class LoadHome {
	constructor(private readonly deps: LoadHomeDeps) {}

	async execute(): Promise<HomeSnapshot> {
		const [character, briefing] = await Promise.all([this.deps.repository.loadCharacter(), this.loadBriefing()]);
		return { character, briefing, quests: this.deps.state.snapshot() };
	}

	// A briefing that cannot be read must not take the character down with it.
	private async loadBriefing(): Promise<BriefingState> {
		try {
			return await this.deps.briefings.load();
		} catch {
			return { kind: 'unreadable' };
		}
	}
}
