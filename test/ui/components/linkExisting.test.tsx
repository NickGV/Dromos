import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CampaignSnapshot } from '../../../src/application';
import { createTranslator } from '../../../src/i18n';
import { LinkButton } from '../../../src/ui/atoms/LinkButton';
import { CampaignTaskRow } from '../../../src/ui/molecules/CampaignTaskRow';
import { CampaignScreen } from '../../../src/ui/organisms/CampaignScreen';
import { campaignScreenView, type CampaignTaskView } from '../../../src/ui/presenters/campaignScreenView';
import { campaignListView } from '../../../src/ui/presenters/campaignView';
import { campaign, phase, task } from '../../domain/campaign/campaignFixtures';
import { clickOf, componentsOf } from './elements';
import { noop } from './homeDeps';

const row = (overrides: Partial<CampaignTaskView> = {}): CampaignTaskView => ({ title: 'Mejoras', completed: false, chip: { label: 'Next', tone: 'next' }, canSend: true, canResend: false, canLink: true, ...overrides });
const markup = (props: Partial<Parameters<typeof CampaignTaskRow>[0]> = {}): string => renderToStaticMarkup(<CampaignTaskRow row={row()} sending={false} onSend={noop} onLink={noop} {...props} />);
const buttons = (html: string): string[] => [...html.matchAll(/<button type="button" class="(dromos-send-button|dromos-link-button)"[^>]*>(.*?)<\/button>/g)].map((match) => `${match[1]}: ${match[2]?.replace(/<[^>]+>/g, '')}`);

describe('CampaignTaskRow: "Link existing" (link-existing-todo S3)', () => {
	it('shows "Link existing" right after "Send to Habitica" when the row can link', () => {
		expect(buttons(markup())).toEqual(['dromos-send-button: Send to Habitica', 'dromos-link-button: Link existing']);
	});

	it('shows only "Send to Habitica" when the row cannot link', () => {
		expect(buttons(markup({ row: row({ canLink: false }) }))).toEqual(['dromos-send-button: Send to Habitica']);
		expect(buttons(markup({ row: row({ canLink: undefined }) }))).toEqual(['dromos-send-button: Send to Habitica']);
	});

	it('is busy while linking, and both buttons ignore clicks while either runs', () => {
		const linking = markup({ linking: true });
		expect(linking).toContain('<button type="button" class="dromos-link-button" aria-disabled="true" aria-busy="true">');
		expect(linking).toContain('Linking…');
		expect(linking).toContain('<button type="button" class="dromos-send-button" aria-disabled="true" aria-busy="false">');
		expect(markup({ sending: true })).toContain('<button type="button" class="dromos-link-button" aria-disabled="true" aria-busy="false">');
	});
});

describe('LinkButton (link-existing-todo S3)', () => {
	it('calls `onLink` on a click, and has no click while busy or disabled', () => {
		const linked: string[] = [];
		clickOf(LinkButton({ busy: false, disabled: false, onLink: () => linked.push('link'), label: 'Link existing', busyLabel: 'Linking…' }))();

		expect(linked).toEqual(['link']);
		expect(() => clickOf(LinkButton({ busy: true, disabled: true, onLink: noop, label: 'Link existing', busyLabel: 'Linking…' }))).toThrow('the button has no onClick');
		expect(() => clickOf(LinkButton({ busy: false, disabled: true, onLink: noop, label: 'Link existing', busyLabel: 'Linking…' }))).toThrow('the button has no onClick');
	});
});

describe('CampaignScreen: linking passes the task title (link-existing-todo S3)', () => {
	it('asks to link the task by its title, and marks only that row busy', () => {
		const en = createTranslator('en');
		const snapshot: CampaignSnapshot = {
			campaigns: [campaign({ path: 'P/Cheshbon/README.md', title: 'Cheshbon', phases: [phase('one', 'active')], tasks: [task('Mejoras', 'one'), task('Informe', 'one')] })],
			areas: [],
			issues: [],
			lastSyncedAt: new Date('2026-11-22T12:00:00Z'),
			status: { kind: 'synced' },
		};
		const view = campaignScreenView(campaignListView(snapshot, { today: '2026-11-22', defaultStaleAfterDays: 14, canLink: true, t: en }), null, en);
		const asked: string[] = [];

		const tree = CampaignScreen({ view, sending: { kind: 'link', title: 'Informe' }, message: null, onSelect: noop, onOpenNote: noop, onSend: noop, onSendHabit: noop, onLinkExisting: (title) => asked.push(title) });
		const rows = componentsOf(tree, CampaignTaskRow);
		for (const element of rows) (element.props.onLink as () => void)();

		expect(asked).toEqual(['Mejoras', 'Informe']);
		expect(rows.map((element) => [element.props.sending, element.props.linking])).toEqual([
			[false, false],
			[false, true],
		]);
	});
});
