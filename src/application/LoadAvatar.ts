import { byHighestSkill, daysSince, DEFAULT_RULES, foldLedger, skillStanding, stageFor, type MeasuredSkill, type StageEvidence, type StageId } from '../domain';
import type { BookRepository, CampaignRepository, Clock, GameStateRepository, LedgerRepository, RulesRepository, SkillRepository } from '../ports';

export interface LoadAvatarDeps {
	readonly characters: Pick<GameStateRepository, 'loadCharacter'>;
	readonly skills: Pick<SkillRepository, 'list'>;
	readonly ledger: Pick<LedgerRepository, 'readAll'>;
	/** The finished campaigns, the same ones a skill's `campaigns` requirement counts. */
	readonly campaigns: Pick<CampaignRepository, 'listCompleted'>;
	readonly books: Pick<BookRepository, 'list'>;
	readonly rules: RulesRepository;
	readonly clock: Pick<Clock, 'today'>;
}

/** What the figure is drawn from: the stage reached, and the earned skills, highest first. */
export interface AvatarStanding {
	readonly stage: StageId;
	readonly skills: readonly MeasuredSkill[];
}

/**
 * The character's stage and earned skills (M11 S1), for the plaque's portrait and the road's walker
 * on every screen. It reads the vault only, never Habitica: the level and `game_start` of
 * `Character.md`, the skills the last sync earned with their XP from the ledger (as a rebuild counts
 * it), the finished campaigns and the finished books. Each read answers for itself, so one that fails
 * counts as no evidence and takes nothing else down; it never rejects.
 */
export class LoadAvatar {
	constructor(private readonly deps: LoadAvatarDeps) {}

	async execute(): Promise<AvatarStanding> {
		const { characters, skills, ledger, campaigns, books, rules, clock } = this.deps;
		const [character, skillList, rows, finishedCampaigns, library, gameRules] = await Promise.all([
			orNothing(() => characters.loadCharacter(), null),
			orNothing(async () => (await skills.list()).skills, []),
			orNothing(async () => (await ledger.readAll()).rows, []),
			orNothing(() => campaigns.listCompleted(), []),
			orNothing(() => books.list(), []),
			orNothing(async () => (await rules.load()).rules, DEFAULT_RULES),
		]);

		const { skillXp } = foldLedger(rows, skillList, gameRules);
		const earned = skillList
			.filter((skill) => skill.unlocked)
			.map((skill) => {
				const xp = skillXp[skill.id] ?? 0;
				return { id: skill.id, xp, standing: skillStanding(true, xp, gameRules) };
			});

		const evidence: StageEvidence | null =
			character?.kind === 'found'
				? {
						level: character.character.level,
						days: character.character.gameStart === null ? 0 : daysSince(character.character.gameStart, clock.today()),
						earned: earned.map(({ standing }) => standing),
						totalSkills: skillList.length,
						campaigns: finishedCampaigns.length,
						// "Terminar" writes `status: completed`; the reflection decides the seal, not whether the book was read.
						books: library.filter((book) => book.status === 'completed').length,
					}
				: null;

		return {
			stage: stageFor(evidence, gameRules.stages),
			skills: earned.map(({ id, xp, standing }) => ({ id, level: standing.level, xp })).sort(byHighestSkill),
		};
	}
}

/** What `read` resolves, or `fallback` when it rejects: an unreadable note is no evidence. */
async function orNothing<T>(read: () => Promise<T>, fallback: T): Promise<T> {
	try {
		return await read();
	} catch {
		return fallback;
	}
}
