import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CampaignTaskRow } from '../../../src/ui/molecules/CampaignTaskRow';
import { HabitRow } from '../../../src/ui/molecules/HabitRow';
import { noop } from './homeDeps';

const habit = (canSend: boolean) => ({ title: 'Code 30 minutes', state: 'unsent' as const, canSend, progress: { done: 0, total: 21, percent: 0 }, text: 'Target: 21 days' });

describe('an unsent task or habit says so once', () => {
	it('shows only the send button when the task can be sent', () => {
		const html = renderToStaticMarkup(<CampaignTaskRow row={{ title: 'Login screen', completed: false, chip: { label: 'Pending', tone: 'pending' }, canSend: true }} sending={false} onSend={noop} />);
		expect(html).toContain('Send to Habitica');
		expect(html).not.toContain('Not linked');
	});

	it('keeps the Not linked chip when it cannot be sent, as while Habitica is not set up', () => {
		const html = renderToStaticMarkup(<CampaignTaskRow row={{ title: 'Login screen', completed: false, chip: { label: 'Not linked', tone: 'unsent' }, canSend: false }} sending={false} onSend={noop} />);
		expect(html).toContain('Not linked');
		expect(html).not.toContain('Send to Habitica');
	});

	it('does the same for a habit', () => {
		expect(renderToStaticMarkup(<HabitRow row={habit(true)} sending={false} onSend={noop} />)).not.toContain('Not linked');
		expect(renderToStaticMarkup(<HabitRow row={habit(false)} sending={false} onSend={noop} />)).toContain('Not linked');
	});
});
