import type { LedgerRow } from '../../../src/domain/ledger/LedgerRow';

export function row(overrides: Partial<LedgerRow> = {}): LedgerRow {
	return {
		date: '2026-11-03',
		habiticaId: 'task-1',
		task: 'Read chapter 3',
		kind: 'todo',
		skill: 'lector',
		xp: 10,
		source: 'complete',
		n: 1,
		...overrides,
	};
}
