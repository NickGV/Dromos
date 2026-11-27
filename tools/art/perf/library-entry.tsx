// Harness of perf/screens.cjs, bundled for the browser with the repository's esbuild: the plugin's real LibraryPanel
// with a loaded library (books on two shelves, one being read, resources in the archive), at the hour the page sets,
// with the paintings and loops of the files the page lists, found by the plugin's own matcher (sceneArtFrom).
import { createRoot } from 'react-dom/client';
import { sceneArtFrom, type ArtFile, type Book } from '../../../src/domain';
import { createTranslator } from '../../../src/i18n';
import { LibraryPanel } from '../../../src/ui/containers/LibraryPanel';
import { I18nProvider } from '../../../src/ui/i18n';
import { dayPeriod } from '../../../src/ui/presenters/dayPeriod';
import { homeDeps } from '../../../test/ui/components/homeDeps';
import { aBook, aReflection } from '../../../test/fakes/books';
import { aResource } from '../../../test/fakes/resources';

const { hour, files } = (window as unknown as { DROMOS_PERF: { hour: number; files: ArtFile[] } }).DROMOS_PERF;
const book = (title: string, o: Partial<Book> = {}): Book => aBook({ path: `Library/${title}.md`, title, author: null, ...o });
const books: Book[] = [
	book('The Odyssey', { author: 'Homer', shelf: 'Classics', status: 'active', started: '2026-10-28' }),
	book('Meditations', { author: 'Marcus Aurelius', shelf: 'Classics' }),
	book('The Republic', { author: 'Plato', shelf: 'Classics', status: 'completed', reflection: aReflection(['about', 'kept', 'changes', 'connects']) }),
	book('The Histories', { shelf: 'Classics', status: 'paused' }),
	book('Structure and Interpretation of Computer Programs', { shelf: 'Programming', status: 'active', started: '2026-11-01' }),
	book('The Art of Computer Programming', { author: 'Donald Knuth', shelf: 'Programming' }),
	book('A Philosophy of Software Design', { author: 'John Ousterhout', shelf: 'Programming', status: 'completed' }),
];
const resources = [
	aResource(),
	aResource({ path: 'Resources/Videos/A talk.md', title: 'A talk on design', kind: 'video' }),
	aResource({ path: 'Resources/Posts/Another.md', title: 'Another article', finished: '2026-11-08' }),
];
const art = sceneArtFrom(files);
const at = new Date(2026, 10, 9, hour, 30);
const clock = { today: () => '2026-11-09', now: () => at };
const base = homeDeps();
const deps = { ...base.library, clock, sceneArt: { execute: () => art }, loadLibrary: { execute: async () => ({ kind: 'loaded' as const, books, resources }) } };
const root = document.getElementById('root');
if (root)
	createRoot(root).render(
		<I18nProvider t={createTranslator('en')}>
			<LibraryPanel deps={deps} language="en" period={dayPeriod(at)} syncKey={0} />
		</I18nProvider>,
	);
