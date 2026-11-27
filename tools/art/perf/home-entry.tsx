// Harness of perf/screens.cjs, bundled for the browser with the repository's esbuild: the plugin's real HomeScreen
// with a found character and two dailies done (the campfire burns), at the hour the page sets, with the paintings
// and loops of the files the page lists, found by the plugin's own matchers (sceneArtFrom, walkerArtFrom).
import { createRoot } from 'react-dom/client';
import { sceneArtFrom, walkerArtFrom, type ArtFile } from '../../../src/domain';
import { HomeScreen } from '../../../src/ui/containers/HomeScreen';
import { homeDeps } from '../../../test/ui/components/homeDeps';
import { aBriefing } from '../../../test/fakes/InMemoryBriefingRepository';
import { aQuest } from '../../../test/fakes/quests';

const { hour, files } = (window as unknown as { DROMOS_PERF: { hour: number; files: ArtFile[] } }).DROMOS_PERF;
const at = new Date(2026, 10, 3, hour, 30);
const quests = { quests: [aQuest('d1', { completed: true }), aQuest('d2', { completed: true })], lastSyncedAt: at, status: { kind: 'synced' } } as const;
const deps = homeDeps({ quests });
const character = { name: 'Ariel', title: 'Scribe', level: 5, totalXp: 630, xpIntoLevel: 230, xpToNext: 400, stats: { fuerza: 3, vitalidad: 4, inteligencia: 6, sabiduria: 5, espiritu: 6, disciplina: 4 }, gameStart: '2026-10-01' };
const home = {
	character: { kind: 'found', character },
	briefing: { kind: 'found', briefing: aBriefing({ created: '2026-11-03', mission: { title: 'Finish the sign-in screen', why: 'It unblocks the beta.' }, body: 'Shalom.' }) },
	quests: deps.questSnapshot(),
};
const art = sceneArtFrom(files);
const clock = { today: () => '2026-11-03', now: () => at };
const root = document.getElementById('root');
if (root)
	createRoot(root).render(
		<HomeScreen
			deps={{ ...deps, clock, sceneArt: { execute: () => art }, walkerArt: { walker: (ids: readonly string[]) => walkerArtFrom(files, ids) }, loadHome: { execute: async () => home as never } }}
		/>,
	);
