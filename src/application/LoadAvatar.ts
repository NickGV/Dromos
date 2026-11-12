import {
	byHighestSkill,
	countedEvidence,
	daysSince,
	DEFAULT_RULES,
	foldLedger,
	LATER_STAGE_IDS,
	LevelCurve,
	skillStanding,
	stageFor,
	stageProgress,
	type Character,
	type LaterStageId,
	type MeasuredSkill,
	type StageEvidence,
	type StageId,
	type StageRequirementProgress,
} from '../domain';
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

/** One stage after the first, with what it asks against the vault (stage-card S1). */
export interface StageStep {
	readonly stage: LaterStageId;
	/** Each part the stage asks, as `stageFor` checks it. */
	readonly requirements: readonly StageRequirementProgress[];
	/** The XP the character still needs to reach the level the stage asks; 0 once it is reached. */
	readonly xpLeft: number;
}

/** What the stage card shows (stage-card S1): the stage reached and the whole road, from the read that drew the figure. */
export interface StageStanding {
	readonly stage: StageId;
	/** The evidence as the stage rules count it: what "Lo que cuenta hoy" lists. */
	readonly evidence: StageEvidence;
	/** Every stage after the first, in order. */
	readonly steps: readonly StageStep[];
	/** The character's total XP, which the level's bar measures. */
	readonly totalXp: number;
	/** `game_start` as `YYYY-MM-DD`, or `null` before the first game sync. */
	readonly gameStart: string | null;
}

/** The figure and the stage card from one read of the vault, so they never disagree. */
export interface AvatarReading {
	readonly avatar: AvatarStanding;
	/** `null` without a readable `Character.md`: there is no character to show the road of. */
	readonly stages: StageStanding | null;
}

/** How many levels past the current one the XP still needed is counted; a stage asking more is out of reach anyway. */
const MAX_LEVELS_COUNTED = 10_000;

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
		return (await this.read()).avatar;
	}

	/**
	 * The figure, as `execute` gives it, and the stage card from the same read (stage-card S1): the
	 * evidence as the rules count it, what each stage asks against it, and the XP still needed for
	 * the level each stage asks, by the character curve of `Rules.md`.
	 */
	async read(): Promise<AvatarReading> {
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

		const stage = stageFor(evidence, gameRules.stages);
		const avatar: AvatarStanding = { stage, skills: earned.map(({ id, xp, standing }) => ({ id, level: standing.level, xp })).sort(byHighestSkill) };
		if (evidence === null || character?.kind !== 'found') return { avatar, stages: null };

		const counted = countedEvidence(evidence);
		const curve = new LevelCurve(gameRules.characterCurve);
		const steps = LATER_STAGE_IDS.map((id) => {
			const requirements = gameRules.stages[id];
			return { stage: id, requirements: stageProgress(counted, requirements), xpLeft: xpLeft(character.character, requirements.level, curve) };
		});
		return { avatar, stages: { stage, evidence: counted, steps, totalXp: character.character.totalXp, gameStart: character.character.gameStart } };
	}
}

/**
 * The XP still needed to reach `level`: what the note says is left of the current level, as the
 * plaque's "Level 3 in 248 XP" does, then each level after it by the curve, up to `MAX_LEVELS_COUNTED` of them.
 */
function xpLeft(character: Pick<Character, 'level' | 'xpIntoLevel' | 'xpToNext'>, level: number, curve: LevelCurve): number {
	if (character.level >= level) return 0;
	let left = Math.max(0, character.xpToNext - character.xpIntoLevel);
	const last = Math.min(level, character.level + MAX_LEVELS_COUNTED);
	for (let next = character.level + 1; next < last; next += 1) left += curve.xpToNext(next);
	return left;
}

/** What `read` resolves, or `fallback` when it rejects: an unreadable note is no evidence. */
async function orNothing<T>(read: () => Promise<T>, fallback: T): Promise<T> {
	try {
		return await read();
	} catch {
		return fallback;
	}
}
