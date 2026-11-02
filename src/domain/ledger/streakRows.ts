import { XP_TABLE, streakBonusFor, type XpTable } from '../rules/XpRules';
import type { LedgerRow } from './LedgerRow';
import type { TaskObservation } from './nextRows';

/**
 * The bonus rows of a daily whose streak sits on a milestone (every 7 days by default). It is paid
 * once per day: a daily synced twice adds nothing. Unchecking the daily, or a streak that
 * is no longer on a milestone, takes the bonus back with a negative `streak` row, and
 * checking it again pays it again. To-dos have no streak and get nothing.
 */
export function streakRows(history: readonly LedgerRow[], observation: TaskObservation, table: XpTable = XP_TABLE): LedgerRow[] {
	if (observation.kind !== 'daily') return [];
	const own = history.filter((row) => row.source === 'streak' && row.habiticaId === observation.habiticaId && row.date === observation.date);
	const paid = new Map<string | null, number>();
	for (const row of own) paid.set(row.skill, (paid.get(row.skill) ?? 0) + row.xp);
	const active = [...paid.values()].some((xp) => xp > 0);
	const bonus = observation.completed ? streakBonusFor(observation.streak ?? 0, table) : 0;
	const n = own.reduce((highest, row) => Math.max(highest, row.n), 0) + 1;
	const make = (skill: string | null, xp: number): LedgerRow => ({
		date: observation.date,
		habiticaId: observation.habiticaId,
		task: observation.title,
		kind: 'daily',
		skill,
		xp,
		source: 'streak',
		n,
	});

	if (bonus > 0 && !active) {
		const skills = observation.skills.length > 0 ? [...new Set(observation.skills)] : [null];
		return skills.map((skill) => make(skill, bonus));
	}
	if (bonus === 0 && active) return [...paid].filter(([, xp]) => xp > 0).map(([skill, xp]) => make(skill, -xp));
	return [];
}
