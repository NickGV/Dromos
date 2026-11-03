import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createTranslator } from '../../../src/i18n';
import { CampaignTaskRow } from '../../../src/ui/molecules/CampaignTaskRow';
import { HabitRow } from '../../../src/ui/molecules/HabitRow';
import { CampaignCard } from '../../../src/ui/organisms/CampaignCard';
import { campaignCardView } from '../../../src/ui/presenters/campaignView';
import { campaign, phase, task } from '../../domain/campaign/campaignFixtures';
import { noop } from './homeDeps';

const habit = (canSend: boolean) => ({ title: 'Code 30 minutes', state: 'unsent' as const, canSend, progress: { done: 0, total: 21, percent: 0 }, text: 'Target: 21 days' });

describe('an unsent task or habit says so once', () => {
	it('shows only the send button when the task can be sent', () => {
		const html = renderToStaticMarkup(<CampaignTaskRow row={{ title: 'Login screen', state: 'unsent', canSend: true }} sending={false} onSend={noop} />);
		expect(html).toContain('Send to Habitica');
		expect(html).not.toContain('Not linked');
	});

	it('keeps the Not linked chip when it cannot be sent, as while Habitica is not set up', () => {
		const html = renderToStaticMarkup(<CampaignTaskRow row={{ title: 'Login screen', state: 'unsent', canSend: false }} sending={false} onSend={noop} />);
		expect(html).toContain('Not linked');
		expect(html).not.toContain('Send to Habitica');
	});

	it('does the same for a habit', () => {
		expect(renderToStaticMarkup(<HabitRow row={habit(true)} sending={false} onSend={noop} />)).not.toContain('Not linked');
		expect(renderToStaticMarkup(<HabitRow row={habit(false)} sending={false} onSend={noop} />)).toContain('Not linked');
	});
});

describe('CampaignCard draws its phases as a road', () => {
	const t = createTranslator('en');
	const kairos = campaign({
		path: 'P/Kairos/README.md',
		title: 'Kairos',
		created: '2026-08-01',
		phases: [phase('design', 'completed'), phase('mvp', 'active'), phase('ship', 'planning')],
		tasks: [task('Design', 'design', { habiticaId: 'h0', completed: true, completedOn: '2026-10-22' }), task('Timer', 'mvp', { habiticaId: 'h1', completed: true, completedOn: '2026-10-22' }), task('Time screen', 'mvp', { habiticaId: 'h2' }), task('Release', 'ship', { habiticaId: 'h3' })],
	});
	const view = campaignCardView(kairos, { today: '2026-10-31', defaultStaleAfterDays: 14, issues: [], canSend: true, habiticaKnown: true, t });
	const html = renderToStaticMarkup(<CampaignCard view={view} sending={null} message={null} onOpen={noop} onSend={noop} onSendHabit={noop} />);

	it('renders one segment per phase, marking the done and the open ones', () => {
		expect([...html.matchAll(/class="dromos-road-segment( is-\w+)?"/g)].map((match) => match[1]?.trim() ?? '')).toEqual(['is-done', 'is-open', 'is-ahead']);
	});

	it('keeps one progress bar for screen readers, valued by the open phase', () => {
		expect(html.match(/role="progressbar"/g)).toHaveLength(1);
		expect(html).toMatch(/role="progressbar"[^>]*aria-label="Progress of Kairos"[^>]*aria-valuenow="50"[^>]*aria-valuetext="Phase mvp 1\/2"/);
	});
});
