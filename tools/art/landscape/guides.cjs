// The landscape's layout guides, from the plugin's own drawing (guides-entry.tsx).
//
//   node tools/art/landscape/guides.cjs OUT_DIR
//
// Writes OUT_DIR/pages/guide-<theme>.html and OUT_DIR/landscape-guide-<theme>.png (3840 x 1200) for the light and
// dark themes: the drawing without the walker, the gate and the campfire. They are what docs/own-art/ holds; copy
// them there by hand when the drawing changed.
'use strict';
const fs = require('fs');
const path = require('path');
const { STYLES, fileUrl, launch, tempDir, bundle } = require('../lib/node.cjs');

if (process.argv.length !== 3) {
	console.error('Usage: node tools/art/landscape/guides.cjs OUT_DIR');
	process.exit(2);
}
const out = path.resolve(process.argv[2]);

(async () => {
	fs.mkdirSync(out, { recursive: true });
	const tmp = tempDir();
	let themes;
	try {
		const file = await bundle(path.join(__dirname, 'guides-entry.tsx'), tmp.dir, 'node');
		themes = require(file).writeGuidePages(out, fileUrl(STYLES));
	} finally {
		tmp.remove();
	}
	const browser = await launch();
	try {
		const page = await browser.newPage({ viewport: { width: 3840, height: 1200 } });
		const errors = [];
		page.on('pageerror', (e) => errors.push(String(e)));
		for (const theme of themes) {
			await page.goto(fileUrl(path.join(out, 'pages', `guide-${theme}.html`)));
			await (await page.$('.dromos-scene')).screenshot({ path: path.join(out, `landscape-guide-${theme}.png`) });
		}
		console.log('guides', themes.map((t) => `landscape-guide-${t}.png`).join(', '), 'in', out, errors.length ? `page errors: ${errors.join(' | ')}` : 'no page errors');
		if (errors.length) process.exitCode = 1;
	} finally {
		await browser.close();
	}
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
