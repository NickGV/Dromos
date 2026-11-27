// Checks prep.py's mapping by eye: each stage's prepared painting (out/walker-<stage>.webp) laid half transparent
// over its drawn figure (the guide page) in the shared frame, outlined in red.
//
//   node tools/art/walker/overlay.cjs WORK_DIR   ->  WORK_DIR/probe/overlay-<stage>.png
//
// The painted feet should stand on the drawn feet, the painted staff on the drawn staff, and the hook's top at the
// drawn staff's top.
'use strict';
const fs = require('fs');
const path = require('path');
const { fileUrl, launch } = require('../lib/node.cjs');

if (process.argv.length !== 3) {
	console.error('Usage: node tools/art/walker/overlay.cjs WORK_DIR');
	process.exit(2);
}
const D = path.resolve(process.argv[2]);
const report = JSON.parse(fs.readFileSync(path.join(D, 'report.json'), 'utf8'));
const stages = Object.keys(report.stages);

(async () => {
	const browser = await launch();
	try {
		const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
		fs.mkdirSync(path.join(D, 'probe'), { recursive: true });
		for (const stage of stages) {
			await page.goto(fileUrl(path.join(D, 'pages', `guide-${stage}.html`)));
			await page.evaluate(
				([href, f]) => {
					const svg = document.querySelector('svg.fit');
					const [x, y, w, h] = f;
					svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
					svg.setAttribute('width', 520);
					svg.setAttribute('height', 780);
					const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
					img.setAttribute('href', href);
					for (const [k, v] of [['x', x], ['y', y], ['width', w], ['height', h], ['opacity', 0.55]]) img.setAttribute(k, v);
					svg.querySelector('.fit-g').appendChild(img);
					const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
					for (const [k, v] of [['x', x], ['y', y], ['width', w], ['height', h], ['fill', 'none'], ['stroke', 'red'], ['stroke-width', 0.3]]) r.setAttribute(k, v);
					svg.appendChild(r);
				},
				[fileUrl(path.join(D, 'out', `walker-${stage}.webp`)), report.walker_frame],
			);
			await page.waitForTimeout(150);
			await (await page.$('svg.fit')).screenshot({ path: path.join(D, 'probe', `overlay-${stage}.png`) });
		}
		console.log('overlays', stages.length, 'in', path.join(D, 'probe'));
	} finally {
		await browser.close();
	}
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
