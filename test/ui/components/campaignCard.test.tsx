import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CampaignTaskRow } from '../../../src/ui/molecules/CampaignTaskRow';
import { HabitRow } from '../../../src/ui/molecules/HabitRow';
import type { HabitRowView } from '../../../src/ui/presenters/campaignView';
import { noop } from './homeDeps';

const habit = (canSend: boolean): HabitRowView => ({ title: 'Code 30 minutes', state: 'unsent', canSend, canResend: false, schedule: 'Every day', items: null, progress: { done: 0, total: 21, percent: 0 }, text: 'Target: 21 days' });

describe('an unsent task or habit says so once', () => {
	it('shows only the send button when the task can be sent', () => {
		const html = renderToStaticMarkup(<CampaignTaskRow row={{ title: 'Login screen', completed: false, chip: { label: 'Pending', tone: 'pending' }, canSend: true, canResend: false }} sending={false} onSend={noop} />);
		expect(html).toContain('Send to Habitica');
		expect(html).not.toContain('Not linked');
	});

	it('keeps the Not linked chip when it cannot be sent, as while Habitica is not set up', () => {
		const html = renderToStaticMarkup(<CampaignTaskRow row={{ title: 'Login screen', completed: false, chip: { label: 'Not linked', tone: 'unsent' }, canSend: false, canResend: false }} sending={false} onSend={noop} />);
		expect(html).toContain('Not linked');
		expect(html).not.toContain('Send to Habitica');
	});

	it('does the same for a habit', () => {
		expect(renderToStaticMarkup(<HabitRow row={habit(true)} sending={false} onSend={noop} />)).not.toContain('Not linked');
		expect(renderToStaticMarkup(<HabitRow row={habit(false)} sending={false} onSend={noop} />)).toContain('Not linked');
	});
});

describe('a daily row: its days, its checklist and a delete in Habitica (ADR-021)', () => {
	const daily = (overrides: Partial<HabitRowView> = {}): HabitRowView => ({ ...habit(false), state: 'tracking', ...overrides });

	it('shows its days and its checklist count under the title', () => {
		const html = renderToStaticMarkup(<HabitRow row={daily({ schedule: 'Mon · Wed · Fri', items: '5 items' })} sending={false} onSend={noop} />);

		expect(html).toContain('<span class="dromos-habit-meta"><span>Mon · Wed · Fri</span><span>5 items</span></span>');
	});

	it('shows only its days when it has no checklist', () => {
		const html = renderToStaticMarkup(<HabitRow row={daily({ schedule: 'Every day' })} sending={false} onSend={noop} />);

		expect(html).toContain('<span class="dromos-habit-meta"><span>Every day</span></span>');
	});

	it('draws no bar for a routine, which has no target', () => {
		expect(renderToStaticMarkup(<HabitRow row={daily({ progress: null, text: 'Streak: 5 days' })} sending={false} onSend={noop} />)).not.toContain('role="progressbar"');
		expect(renderToStaticMarkup(<HabitRow row={daily()} sending={false} onSend={noop} />)).toContain('role="progressbar"');
	});

	it('chips a daily deleted in Habitica and offers "Send again" in place of "Send to Habitica"', () => {
		const html = renderToStaticMarkup(<HabitRow row={daily({ state: 'deleted', canResend: true })} sending={false} onSend={noop} />);

		expect(html).toContain('Deleted in Habitica');
		expect(html).toContain('Send again');
		expect(html).not.toContain('Send to Habitica');
	});

	it('chips a deleted daily with no button when it cannot be sent again', () => {
		const html = renderToStaticMarkup(<HabitRow row={daily({ state: 'deleted', canResend: false })} sending={false} onSend={noop} />);

		expect(html).toContain('Deleted in Habitica');
		expect(html).not.toContain('<button');
	});

	it('offers "Send again" on a task deleted in Habitica', () => {
		const row = { title: 'Report', completed: false, chip: { label: 'Deleted in Habitica', tone: 'deleted' as const }, canSend: false, canResend: true };
		const html = renderToStaticMarkup(<CampaignTaskRow row={row} sending={false} onSend={noop} />);

		expect(html).toContain('Send again');
		expect(html).not.toContain('Send to Habitica');
	});

	it('says "Sending…" while it is sent again, as a first send does', () => {
		const row = { title: 'Report', completed: false, chip: { label: 'Deleted in Habitica', tone: 'deleted' as const }, canSend: false, canResend: true };

		expect(renderToStaticMarkup(<CampaignTaskRow row={row} sending onSend={noop} />)).toContain('Sending…');
	});
});
