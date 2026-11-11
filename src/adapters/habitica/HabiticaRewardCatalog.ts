import type { Reward } from '../../domain';
import { TaskSourceError, type NewReward, type RewardCatalog } from '../../ports';
import type { HabiticaClient } from './HabiticaClient';
import { gpOf, typed } from './HabiticaGoldAccount';
import { readHabiticaTask, readHabiticaTasks, type HabiticaTaskDto } from './habiticaTask';

const REWARDS_PATH = '/tasks/user?type=rewards';

/**
 * The user's Habitica rewards (M10 S1, S2): listed with `GET /tasks/user?type=rewards`, bought with
 * `POST /tasks/:id/score/up`, which takes the price from the gold and answers with the user's stats.
 * Habitica keeps a bought reward, so it can be bought again. An offer's reward is looked up by its
 * alias with `GET /tasks/:alias` (a 404 means none), created with `POST /tasks/user` and deleted
 * with `DELETE /tasks/:id`. Rejects only with `TaskSourceError`.
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

	async findByAlias(alias: string): Promise<Reward | null> {
		try {
			const found = await this.client.find(`/tasks/${encodeURIComponent(alias)}`);
			return found === null ? null : expectReward(found);
		} catch (error) {
			throw typed(error, 'Habitica reward could not be read');
		}
	}

	async create(reward: NewReward): Promise<Reward> {
		try {
			return expectReward(await this.client.post('/tasks/user', { type: 'reward', text: reward.name, notes: reward.notes, value: reward.price, alias: reward.alias }));
		} catch (error) {
			throw typed(error, 'Habitica reward could not be created');
		}
	}

	async remove(id: string): Promise<void> {
		try {
			await this.client.delete(`/tasks/${encodeURIComponent(id)}`);
		} catch (error) {
			throw typed(error, 'Habitica reward could not be deleted');
		}
	}
}

/** One reward from an envelope's `data`; anything else is `Unknown`. */
function expectReward(data: unknown): Reward {
	const task = readHabiticaTask(data);
	const reward = task.type === 'reward' ? rewardOf(task) : null;
	if (!reward) throw new TaskSourceError('Unknown', null, 'Habitica sent an unexpected reward');
	return reward;
}

/** A reward of the list, or `null` for a task with no usable price: a price is never made up. */
function rewardOf(task: HabiticaTaskDto & { readonly value?: unknown; readonly notes?: unknown; readonly alias?: unknown }): Reward | null {
	const id = task.id ?? task._id;
	const { value } = task;
	if (!id || typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
	const notes = typeof task.notes === 'string' && task.notes.trim() !== '' ? task.notes : null;
	const alias = typeof task.alias === 'string' && task.alias !== '' ? task.alias : null;
	return { id, name: task.text, notes, price: value, alias, tags: task.tags ?? [] };
}
