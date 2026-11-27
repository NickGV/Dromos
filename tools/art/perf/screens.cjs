// CPU cost of a real screen with its paintings and loops: the plugin's HomeScreen or LibraryPanel (home-entry.tsx,
// library-entry.tsx, bundled from src/ with the repository's esbuild and styled by styles.css), drawn, painted
// without loops, and painted with loops. Every Chrome process is counted, over 10 s after a 3 s warm-up, in % of one
// core, and each case's median over the rounds is printed. Linux only.
//
//   node tools/art/perf/screens.cjs home|library --art ART_DIR [--theme dark] [--hour 23] [--width 1160]
//       [--rounds 3] [--views room,shelf,archive]
//
// ART_DIR holds the files as the vault's Dromos/Arte names them (landscape-dark.webp, landscape-dark.webm,
// walker-runner.webp, wall-dark.webp, ...); the plugin's own matcher picks them. Chrome only reads them. The hour
// picks the period: 05-08 dawn, 08-18 day, 18-21 dusk, 21-05 night. The library's views are the room (wall and
// desk), a shelf and the archive.
'use strict';
const fs = require('fs');
const path = require('path');
const { STYLES, fileUrl, launch, tempDir, bundle, parseArgs, cpu, printMedians } = require('../lib/node.cjs');

const args = parseArgs(process.argv.slice(2));
const screen = args._[0];
if (!['home', 'library'].includes(screen) || !args.art) {
	console.error('Usage: node tools/art/perf/screens.cjs home|library --art ART_DIR [--theme dark] [--hour 23] [--width 1160] [--rounds 3] [--views room,shelf,archive]');
	process.exit(2);
}
const theme = args.theme || 'dark';
const hour = Number(args.hour ?? (theme === 'dark' ? 23 : 13));
const width = Number(args.width || 1160);
const rounds = Number(args.rounds || 3);
const views = screen === 'home' ? ['home'] : (args.views || 'room,shelf,archive').split(',');
const open = { home: null, room: null, shelf: '.dromos-alcove', archive: '.dromos-archive-door' };
const ready = screen === 'home' ? '.dromos-scene' : '.dromos-library-scene';

const art = path.resolve(args.art);
const listed = fs.readdirSync(art).filter((n) => /\.(webp|png|jpe?g|webm|mp4)$/i.test(n));
const all = listed.map((name) => ({ name, url: fileUrl(path.join(art, name)) }));
const stills = all.filter((f) => !/\.(webm|mp4)$/i.test(f.name));
const sets = [
	['drawn (no paintings)', []],
	['paintings, no loops', stills],
	['paintings and loops', all],
];

const page = (bundleUrl, files) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="${fileUrl(STYLES)}">
<style>body { margin: 0; background: ${theme === 'dark' ? '#1e1e1e' : '#fbfaf7'}; --font-interface: system-ui, sans-serif; --font-text: Georgia, serif; --text-muted: #8a8178; --text-faint: #a89f94; --font-ui-small: 13px; --font-ui-smaller: 12px; --radius-s: 4px; }</style>
<script>window.DROMOS_PERF = ${JSON.stringify({ hour, files })};</script></head>
<body class="theme-${theme}"><div class="dromos-root" style="width:${width}px"><div id="root"></div></div><script src="${bundleUrl}"></script></body></html>`;

(async () => {
	const tmp = tempDir();
	const results = {};
	try {
		const file = await bundle(path.join(__dirname, `${screen}-entry.tsx`), tmp.dir, 'browser');
		const pages = sets.map(([label, files], i) => {
			const p = path.join(tmp.dir, `page-${i}.html`);
			fs.writeFileSync(p, page(fileUrl(file), files));
			return [label, p];
		});
		const cases = [['blank page', null, null], ...views.flatMap((view) => pages.map(([label, p]) => [`${view === 'home' ? '' : `${view}, `}${label}`, view, p]))];
		const pad = Math.max(...cases.map(([n]) => n.length)) + 2;
		console.log(`${screen}, ${theme} theme at ${hour}:30, ${width} px, ${listed.length} art files (${stills.length} paintings)`);
		for (let r = 0; r < rounds; r++)
			for (const [name, view, file] of cases) {
				const browser = await launch(['--autoplay-policy=no-user-gesture-required']);
				try {
					const p = await browser.newPage({ viewport: { width: width + 40, height: 900 } });
					const errors = [];
					p.on('pageerror', (e) => errors.push(String(e)));
					if (!file) await p.goto('about:blank');
					else {
						await p.goto(fileUrl(file));
						await p.waitForSelector(ready, { timeout: 15000 });
						if (open[view]) {
							await p.waitForSelector(open[view]);
							await p.click(open[view]);
						}
					}
					const load = await cpu(p);
					const info = file
						? await p.evaluate(() => {
								const videos = [...document.querySelectorAll('video')].filter((v) => getComputedStyle(v).display !== 'none').map((v) => `${(v.getAttribute('src') || '').replace(/.*\//, '')} ${v.paused ? 'paused' : 'playing'}`);
								const animations = document.getAnimations().filter((a) => a.playState === 'running').length;
								return `videos shown: ${videos.join(', ') || 'none'}; running CSS animations: ${animations}`;
							})
						: '';
					(results[name] ||= []).push(load);
					console.log(`${name.padEnd(pad)} CPU ${load.toFixed(1).padStart(5)}%   ${info}${errors.length ? `   page errors: ${errors.slice(0, 2).join(' | ')}` : ''}`);
					if (errors.length) process.exitCode = 1;
				} finally {
					await browser.close();
				}
			}
		printMedians(results, rounds, pad);
	} finally {
		tmp.remove();
	}
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
