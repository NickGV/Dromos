import type { Reward } from '../../domain';
import type { RewardCatalog } from '../../ports';
import type { HabiticaClient } from './HabiticaClient';
import { gpOf, typed } from './HabiticaGoldAccount';
import { readHabiticaTasks, type HabiticaTaskDto } from './habiticaTask';

const REWARDS_PATH = '/tasks/user?type=rewards';

/**
 * The user's own Habitica rewards (M10 S1): listed with `GET /tasks/user?type=rewards`, bought with
 * `POST /tasks/:id/score/up`, which takes the price from the gold and answers with the user's stats.
 * Habitica keeps a bought reward, so it can be bought again. Rejects only with `TaskSourceError`.
 */
export class HabiticaRewardCatalog implements RewardCatalog {
	constructor(private readonly client: HabiticaClient) {}

	async list(): Promise<Reward[]> {
		try {
			return readHabiticaTasks(await this.client.get(REWARDS_PATH)).flatMap((task) => rewardOf(task) ?? []);
		} catch (error) {
			throw typed(error, 'Habitica rewards could not be read');
		}
	}

	async buy(id: string): Promise<number | null> {
		try {
			return gpOf(await this.client.post(`/tasks/${encodeURIComponent(id)}/score/up`));
		} catch (error) {
			throw typed(error, 'Habitica reward could not be bought');
		}
	}
}

/** A reward of the list, or `null` for a task with no usable price: a price is never made up. */
function rewardOf(task: HabiticaTaskDto & { readonly value?: unknown; readonly notes?: unknown; readonly alias?: unknown }): Reward | null {
	const id = task.id ?? task._id;
	const { value } = task;
	if (!id || typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
	const notes = typeof task.notes === 'string' && task.notes.trim() !== '' ? task.notes : null;
	const alias = typeof task.alias === 'string' && task.alias !== '' ? task.alias : null;
	return { id, name: task.text, notes, price: value, alias };
}
