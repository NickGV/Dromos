import { describe, expect, it } from 'vitest';
import { createTranslator } from '../../src/i18n';
import { subtasksView } from '../../src/ui/presenters/missionView';

const en = createTranslator('en');
const es = createTranslator('es');
const plan = {
	done: 1,
	total: 3,
	items: [
		{ title: 'Book the bus', completed: true },
		{ title: 'Pack', completed: false },
		{ title: 'Leave', completed: false },
	],
};

describe('subtasksView (missions S5)', () => {
	it('folds a mission to its toggle, named after the task', () => {
		expect(subtasksView(plan, false, 'Plan the trip', en)).toEqual({ open: false, toggleLabel: 'Show the subtasks of Plan the trip', items: [] });
		expect(subtasksView(plan, false, 'Plan the trip', es)?.toggleLabel).toBe('Ver las subtareas de Plan the trip');
	});

	it('shows every subtask in order once open, each with its state', () => {
		expect(subtasksView(plan, true, 'Plan the trip', en)).toEqual({ open: true, toggleLabel: 'Hide the subtasks of Plan the trip', items: plan.items });
		expect(subtasksView(plan, true, 'Plan the trip', es)?.toggleLabel).toBe('Ocultar las subtareas de Plan the trip');
	});

	it('gives no toggle to a checklist that does not make a mission, or that came without titles', () => {
		expect(subtasksView({ done: 0, total: 2, items: plan.items.slice(0, 2) }, true, 'Small', en)).toBeUndefined();
		expect(subtasksView({ done: 1, total: 3 }, true, 'No titles', en)).toBeUndefined();
		expect(subtasksView(undefined, true, 'Plain', en)).toBeUndefined();
	});
});
