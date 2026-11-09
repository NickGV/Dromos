import type { AreaRepository } from '../ports';
import type { LinkOutcome } from './sendAndLink';
import { sendHabit, type SendHabitDeps } from './sendHabit';

export interface LinkHabitToAreaDeps extends SendHabitDeps {
	readonly repository: AreaRepository;
}

/**
 * "Enviar a Habitica" for a habit of an area (ADR-017): the same daily, tags, notes and write as a
 * campaign habit's, on an `archeion` note. Idempotent: a habit that already has an id is never
 * created again. Its outcomes are a campaign habit's, but never `not-a-project`. Never rejects.
 */
export class LinkHabitToArea {
	private readonly inFlight = new Map<string, Promise<LinkOutcome>>();

	constructor(private readonly deps: LinkHabitToAreaDeps) {}

	/** Runs one link per habit; a second call for the same habit joins the one already running. */
	execute(areaPath: string, habitTitle: string): Promise<LinkOutcome> {
		const key = `${areaPath}\u0000${habitTitle}`;
		const running = this.inFlight.get(key);
		if (running) return running;

		const started = this.run(areaPath, habitTitle).finally(() => this.inFlight.delete(key));
		this.inFlight.set(key, started);
		return started;
	}

	private async run(areaPath: string, habitTitle: string): Promise<LinkOutcome> {
		const { repository } = this.deps;
		const area = (await repository.listAreas()).find((candidate) => candidate.path === areaPath);
		if (!area) return { kind: 'not-found' };

		return sendHabit(this.deps, area, habitTitle, (habiticaId) => repository.linkHabitHabiticaId(areaPath, habitTitle, habiticaId));
	}
}
