// CPU cost of each loop alone: Chrome plays one muted, looping video in a scene box (object-fit cover, anchored to
// the bottom, as Dromos lays the landscape), against a blank page. Every Chrome process is counted, over 10 s after
// a 3 s warm-up, in % of one core (the method behind the numbers in odd/tasks/landscape-art.md). Linux only.
//
//   node tools/art/perf/video.cjs VIDEO.webm... [--rounds 3] [--box 1160x363]
//
// Run it with nothing else busy, and compare loops measured in the same run.
'use strict';
const fs = require('fs');
const path = require('path');
const { fileUrl, launch, tempDir, parseArgs, cpu, printMedians } = require('../lib/node.cjs');

const args = parseArgs(process.argv.slice(2));
if (args._.length === 0) {
	console.error('Usage: node tools/art/perf/video.cjs VIDEO.webm... [--rounds 3] [--box 1160x363]');
	process.exit(2);
}
const rounds = Number(args.rounds || 1);
const [boxW, boxH] = (args.box || '1160x363').split('x').map(Number);
const page = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#1e1e1e}
.scene{width:${boxW}px;height:${boxH}px;position:relative;overflow:hidden;margin:20px}
.scene video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center bottom;display:block}
</style></head><body><div class="scene" id="scene"></div>
<script>
const src = new URLSearchParams(location.search).get('v');
window.presented = 0;
if (src) {
  const v = document.createElement('video'); v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.src = src;
  document.getElementById('scene').append(v); v.play();
  const tick = () => { window.presented++; v.requestVideoFrameCallback(tick); }; v.requestVideoFrameCallback(tick);
}
</script></body></html>`;
const cases = [['blank page (baseline)', null], ...args._.map((f) => [path.basename(f), fileUrl(f)])];
const pad = Math.max(...cases.map(([n]) => n.length)) + 2;

(async () => {
	const tmp = tempDir();
	fs.writeFileSync(path.join(tmp.dir, 'page.html'), page);
	const results = {};
	try {
		for (let r = 0; r < rounds; r++)
			for (const [name, video] of cases) {
				const browser = await launch(['--autoplay-policy=no-user-gesture-required']);
				try {
					const p = await browser.newPage({ viewport: { width: boxW + 40, height: boxH + 120 } });
					await p.goto(fileUrl(path.join(tmp.dir, 'page.html')) + (video ? `?v=${encodeURIComponent(video)}` : ''));
					await p.waitForTimeout(3000);
					const p0 = await p.evaluate(() => window.presented);
					const w0 = Date.now();
					const load = await cpu(p, { warmup: 0 });
					const shown = ((await p.evaluate(() => window.presented)) - p0) / ((Date.now() - w0) / 1000);
					const playing = await p.evaluate(() => [...document.querySelectorAll('video')].map((v) => `${v.paused ? 'paused' : 'playing'} ${v.videoWidth}x${v.videoHeight}`).join(',') || '-');
					(results[name] ||= []).push(load);
					console.log(`${name.padEnd(pad)} CPU ${load.toFixed(1).padStart(5)}% of one core   frames shown ${shown.toFixed(1)}/s   ${playing}`);
				} finally {
					await browser.close();
				}
			}
		if (rounds > 1) printMedians(results, rounds, pad);
	} finally {
		tmp.remove();
	}
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
