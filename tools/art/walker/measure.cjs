// Measures the drawn walker of each stage and each skill object in their own units, in Chrome, from the guide
// pages that guides.cjs wrote (the real markup of WalkerFigure and SkillObject): the figure's box from the feet up
// to the lantern, staff included, without the lantern's glow circle; the staff's own box (its line, hook
// included); the lantern's centre; and each object's box around its own origin.
//
//   node tools/art/walker/measure.cjs WORK_DIR   ->  WORK_DIR/measure.json
//
// prep.py runs it when measure.json is missing or with --measure.
'use strict';
const fs = require('fs');
const path = require('path');
const { fileUrl, launch } = require('../lib/node.cjs');

if (process.argv.length !== 3) {
	console.error('Usage: node tools/art/walker/measure.cjs WORK_DIR');
	process.exit(2);
}
const D = path.resolve(process.argv[2]);
const setFile = path.join(D, 'walker-set.json');
if (!fs.existsSync(setFile)) {
	console.error(`${setFile} is missing: run walker/guides.cjs on this folder first.`);
	process.exit(1);
}
const { stages } = JSON.parse(fs.readFileSync(setFile, 'utf8'));
const box = (b) => ({ x: +b.x.toFixed(3), y: +b.y.toFixed(3), width: +b.width.toFixed(3), height: +b.height.toFixed(3) });

(async () => {
	const browser = await launch();
	try {
		const page = await browser.newPage();
		const out = { stages: {}, objects: {} };
		for (const stage of stages) {
			await page.goto(fileUrl(path.join(D, 'pages', `guide-${stage}.html`)));
			const m = await page.evaluate(() => {
				const figure = document.querySelector('.dromos-scene-figure');
				const glow = figure.querySelector('.dromos-scene-lamp-glow');
				if (glow) glow.style.display = 'none';
				const b = figure.getBBox();
				const lamp = figure.querySelector('.dromos-scene-lamp');
				const staff = figure.querySelector('.dromos-scene-staff').getBBox();
				return {
					box: { x: b.x, y: b.y, width: b.width, height: b.height },
					staff: { x: staff.x, y: staff.y, width: staff.width, height: staff.height },
					lamp: { x: +lamp.getAttribute('cx'), y: +lamp.getAttribute('cy') },
				};
			});
			out.stages[stage] = { ...m, box: box(m.box), staff: box(m.staff) };
		}
		await page.goto(fileUrl(path.join(D, 'pages', 'objects-guide.html')));
		const objects = await page.evaluate(() =>
			[...document.querySelectorAll('.dromos-avatar-thing')].map((thing) => {
				const b = thing.getBBox();
				return [thing.getAttribute('class').match(/is-([a-z]+)/)[1], { x: b.x, y: b.y, width: b.width, height: b.height }];
			}),
		);
		for (const [id, b] of objects) out.objects[id] = box(b);
		fs.writeFileSync(path.join(D, 'measure.json'), JSON.stringify(out, null, 1));
		console.log('measured', Object.keys(out.stages).length, 'stages and', Object.keys(out.objects).length, 'objects ->', path.join(D, 'measure.json'));
	} finally {
		await browser.close();
	}
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
