import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CampaignSnapshot, GameSnapshot, QuestSnapshot } from '../../../src/application';
import { createTranslator, type Language } from '../../../src/i18n';
import { SyncButton } from '../../../src/ui/atoms/SyncButton';
import type { CampaignsDeps } from '../../../src/ui/containers/CampaignsPanel';
import { HomeScreen, type HomeScreenDeps } from '../../../src/ui/containers/HomeScreen';
import { CampaignTaskRow } from '../../../src/ui/molecules/CampaignTaskRow';
import { HabitRow } from '../../../src/ui/molecules/HabitRow';
import { StatusBanner } from '../../../src/ui/molecules/StatusBanner';
import { BriefingPanel } from '../../../src/ui/organisms/BriefingPanel';
import { SkillsPanel } from '../../../src/ui/organisms/SkillsPanel';
import type { BriefingView } from '../../../src/ui/presenters/briefingView';
import type { SkillCardView, SkillsPageView } from '../../../src/ui/presenters/skillsView';

const noop = (): void => undefined;
const renderNothing = (): (() => void) => noop;

/** The text of every element with `role="status"`, tags stripped. */
function liveRegionTexts(html: string): string[] {
	return [...html.matchAll(/<(\w+)[^>]*role="status"[^>]*>(.*?)<\/\1>/g)].map((match) => (match[2] ?? '').replace(/<[^>]+>/g, ''));
}

/** The opening tag of the first `<button>`. */
function buttonTag(html: string): string {
	return /<button[^>]*>/.exec(html)?.[0] ?? '';
}

describe('StatusBanner', () => {
	it('announces the status only, so the minute count is not read out on every re-render', () => {
		const html = renderToStaticMarkup(<StatusBanner tone="success" message="Synced 5 min ago" detail={null} announcement="Quests synced" />);
		expect(liveRegionTexts(html)).toEqual(['Quests synced']);
		expect(html).toContain('Synced 5 min ago');
	});

	it('keeps the detail visible and outside the live region', () => {
		const html = renderToStaticMarkup(<StatusBanner tone="warning" message="Offline" detail="Showing the last list fetched this session (12 min ago)." announcement="Offline" />);
		expect(liveRegionTexts(html)).toEqual(['Offline']);
		expect(html).toContain('Showing the last list fetched this session (12 min ago).');
	});
});

describe('busy buttons keep keyboard focus', () => {
	it('Sync is aria-disabled, not disabled, while it syncs', () => {
		const tag = buttonTag(renderToStaticMarkup(<SyncButton syncing onSync={noop} />));
		expect(tag).toContain('aria-disabled="true"');
		expect(tag).not.toMatch(/\sdisabled=/);
	});

	it('Sync is not marked disabled when idle', () => {
		const tag = buttonTag(renderToStaticMarkup(<SyncButton syncing={false} onSync={noop} />));
		expect(tag).not.toContain('aria-disabled="true"');
		expect(tag).not.toMatch(/\sdisabled=/);
	});

	it('Send to Habitica on a task is aria-disabled, not disabled, while it sends', () => {
		const tag = buttonTag(renderToStaticMarkup(<CampaignTaskRow row={{ title: 'Login screen', state: 'unsent', canSend: true }} sending onSend={noop} />));
		expect(tag).toContain('aria-disabled="true"');
		expect(tag).not.toMatch(/\sdisabled=/);
	});

	it('Send to Habitica on a habit is aria-disabled, not disabled, while it sends', () => {
		const row = { title: 'Code 30 minutes', state: 'unsent' as const, canSend: true, progress: { done: 0, total: 21, percent: 0 }, text: 'Target: 21 days' };
		const tag = buttonTag(renderToStaticMarkup(<HabitRow row={row} sending onSend={noop} />));
		expect(tag).toContain('aria-disabled="true"');
		expect(tag).not.toMatch(/\sdisabled=/);
	});
});

function skill(id: string, unlocked: boolean): SkillCardView {
	return {
		id,
		icon: '📖',
		name: `Skill ${id}`,
		statLabel: 'Intelligence',
		description: 'Reading.',
		unlocked,
		levelText: unlocked ? 'Level 1' : null,
		rankName: null,
		rankDescription: null,
		xp: null,
		requirements: [],
		progressPercent: unlocked ? 100 : 40,
		earnedText: null,
	};
}

describe('heading outline', () => {
	const skills: SkillsPageView = {
		title: 'Skills',
		emptyText: null,
		notice: null,
		earnedTitle: 'Earned (1)',
		lockedTitle: 'To unlock (1)',
		earned: [skill('lector', true)],
		locked: [skill('atleta', false)],
		problems: [],
	};

	it('puts skill names under their group heading', () => {
		const html = renderToStaticMarkup(<SkillsPanel view={skills} />);
		expect(html).toMatch(/<h4[^>]*>Skill lector<\/h4>/);
		expect(html).toMatch(/<h4[^>]*>Skill atleta<\/h4>/);
		expect(html).not.toMatch(/<h3[^>]*>Skill /);
	});

	it('gives the locked group a heading inside its toggle', () => {
		const html = renderToStaticMarkup(<SkillsPanel view={skills} />);
		expect(html).toMatch(/<summary[^>]*><h3[^>]*>To unlock \(1\)<\/h3><\/summary>/);
	});

	it('gives the panel of Esdras a heading', () => {
		const view: BriefingView = { ariaLabel: 'Briefing from Esdras', notice: null, requestLabel: 'Ask for a briefing', dimmed: false, mission: null, near: null, markdown: null, signature: '— Esdras' };
		const html = renderToStaticMarkup(<BriefingPanel view={view} renderMarkdown={renderNothing} onRequest={null} />);
		expect(html).toMatch(/<h2[^>]*>Briefing from Esdras<\/h2>/);
	});
});

describe('HomeScreen', () => {
	const today = '2026-11-03';
	const clock = { today: () => today, now: () => new Date('2026-11-03T14:00:00Z') };
	const quests: QuestSnapshot = { quests: null, lastSyncedAt: null, status: { kind: 'idle' } };
	const game: GameSnapshot = { status: { kind: 'idle' }, lastSyncedAt: null, character: null, skills: null, events: [], invalidSkills: [], unreadable: [], invalidRules: null };
	const campaignSnapshot: CampaignSnapshot = { campaigns: null, issues: [], lastSyncedAt: null, status: { kind: 'idle' } };
	const never = <T,>(): Promise<T> => new Promise<T>(noop);

	function deps(language: Language): HomeScreenDeps {
		const campaigns: CampaignsDeps = {
			syncCampaigns: { execute: never, reload: never },
			linkTask: { execute: never },
			linkHabit: { execute: never },
			campaignSnapshot: () => campaignSnapshot,
			staleAfterDays: () => 14,
			openNote: noop,
			clock,
		};
		return {
			loadHome: { execute: never },
			syncQuests: { execute: never },
			syncGame: { execute: never },
			gameSnapshot: () => game,
			dismissGameEvents: noop,
			takeGameAnnouncements: () => [],
			notify: noop,
			renderMarkdown: renderNothing,
			requestBriefing: null,
			questSnapshot: () => quests,
			clock,
			campaigns,
			translator: () => createTranslator(language),
			language: () => language,
			subscribeSettings: () => noop,
			subscribeGame: () => noop,
		};
	}

	it('marks its content with the interface language', () => {
		expect(renderToStaticMarkup(<HomeScreen deps={deps('es')} />)).toMatch(/<main[^>]*lang="es"/);
		expect(renderToStaticMarkup(<HomeScreen deps={deps('en')} />)).toMatch(/<main[^>]*lang="en"/);
	});
});
