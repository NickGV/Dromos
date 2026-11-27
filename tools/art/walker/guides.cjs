// The walker's pose guides and the objects guide, from the plugin's own drawing (guides-entry.tsx).
//
//   node tools/art/walker/guides.cjs WORK_DIR [--no-shots]
//
// Writes into WORK_DIR:
//   pages/guide-<stage>.html, pages/objects-guide.html  the guide pages (measure.cjs and overlay.cjs read them)
//   walker-set.json                                    the stage and object order and the shared frames (prep.py)
//   guides/guide-<stage>.png                           1000 x 1500 (2:3), the walker of each stage without objects
//   guides/objects-guide.png                           the fourteen objects in a 5 x 3 grid on mid grey
// The PNGs are what docs/own-art/walker/ holds; copy them there by hand when the drawing changed.
'use strict';
const fs = require('fs');
const path = require('path');
const { STYLES, fileUrl, launch, tempDir, bundle, parseArgs } = require('../lib/node.cjs');

const args = parseArgs(process.argv.slice(2), ['no-shots']);
if (args._.length !== 1) {
	console.error('Usage: node tools/art/walker/guides.cjs WORK_DIR [--no-shots]');
	process.exit(2);
}
const work = path.resolve(args._[0]);

(async () => {
	fs.mkdirSync(work, { recursive: true });
	const tmp = tempDir();
	let set;
	try {
		const file = await bundle(path.join(__dirname, 'guides-entry.tsx'), tmp.dir, 'node');
		set = require(file).writeGuidePages(work, fileUrl(STYLES));
	} finally {
		tmp.remove();
	}
	console.log('pages', set.stages.length, 'stages and', set.objects.length, 'objects in', path.join(work, 'pages'));
	if (args['no-shots']) return;
	fs.mkdirSync(path.join(work, 'guides'), { recursive: true });
	const browser = await launch();
	try {
		const page = await browser.newPage({ viewport: { width: 2200, height: 1600 } });
		const errors = [];
		page.on('console', (m) => {
			if (m.type() === 'error') errors.push(m.text());
		});
		page.on('pageerror', (e) => errors.push(String(e)));
		for (const stage of set.stages) {
			await page.goto(fileUrl(path.join(work, 'pages', `guide-${stage}.html`)));
			await page.waitForTimeout(200);
			await (await page.$('svg.fit')).screenshot({ path: path.join(work, 'guides', `guide-${stage}.png`) });
		}
		await page.goto(fileUrl(path.join(work, 'pages', 'objects-guide.html')));
		await page.waitForTimeout(200);
		await (await page.$('#sheet')).screenshot({ path: path.join(work, 'guides', 'objects-guide.png') });
		console.log('guides in', path.join(work, 'guides'), errors.length ? `page errors: ${errors.slice(0, 3).join(' | ')}` : 'no page errors');
		if (errors.length) process.exitCode = 1;
	} finally {
		await browser.close();
	}
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
