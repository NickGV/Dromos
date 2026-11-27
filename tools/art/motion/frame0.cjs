// A loop as Chrome decodes it, the way Dromos plays it: frame 0 against the painting scaled to the video's size, and
// the last frame against frame 0 (the seam). sheet.py gives the same numbers from ffmpeg's decoding; this one also
// catches a colour shift in the browser's own conversion.
//
//   node tools/art/motion/frame0.cjs VIDEO.webm PAINTING.webp [VIDEO PAINTING ...]
//
// Levels are 0-255 per channel. The painting is scaled by Chrome's high-quality smoothing, so a mean around 1 level
// is the painting; a mean of several levels is a colour shift or the wrong painting.
'use strict';
const path = require('path');
const fs = require('fs');
const { fileUrl, launch, tempDir } = require('../lib/node.cjs');

const pairs = process.argv.slice(2);
if (pairs.length === 0 || pairs.length % 2) {
	console.error('Usage: node tools/art/motion/frame0.cjs VIDEO.webm PAINTING.webp [VIDEO PAINTING ...]');
	process.exit(2);
}

(async () => {
	const tmp = tempDir();
	fs.writeFileSync(path.join(tmp.dir, 'blank.html'), '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>');
	const browser = await launch();
	try {
		const page = await browser.newPage();
		await page.goto(fileUrl(path.join(tmp.dir, 'blank.html')));
		for (let i = 0; i < pairs.length; i += 2) {
			const [video, painting] = [pairs[i], pairs[i + 1]];
			const r = await page.evaluate(
				async ([videoUrl, paintingUrl]) => {
					const v = document.createElement('video');
					v.muted = true;
					v.preload = 'auto';
					v.src = videoUrl;
					await new Promise((ok, fail) => {
						v.addEventListener('loadeddata', ok, { once: true });
						v.addEventListener('error', () => fail(new Error(`cannot play ${videoUrl}`)), { once: true });
					});
					const W = v.videoWidth;
					const H = v.videoHeight;
					const px = (src) => {
						const c = document.createElement('canvas');
						c.width = W;
						c.height = H;
						const g = c.getContext('2d', { willReadFrequently: true });
						g.imageSmoothingQuality = 'high';
						g.drawImage(src, 0, 0, W, H);
						return g.getImageData(0, 0, W, H).data;
					};
					const seek = (t) =>
						new Promise((ok) => {
							v.addEventListener('seeked', ok, { once: true });
							v.currentTime = t;
						});
					await seek(0);
					const first = px(v);
					await seek(Math.max(0, v.duration - 0.001));
					const last = px(v);
					const im = new Image();
					im.src = paintingUrl;
					await im.decode();
					const paint = px(im);
					const cmp = (a, b) => {
						let s = 0;
						let m = 0;
						let k = 0;
						for (let q = 0; q < a.length; q += 4)
							for (let c = 0; c < 3; c++) {
								const d = Math.abs(a[q + c] - b[q + c]);
								s += d;
								if (d > m) m = d;
								k++;
							}
						return [s / k, m];
					};
					return { size: `${W}x${H}`, seconds: v.duration.toFixed(2), f0: cmp(first, paint), seam: cmp(last, first) };
				},
				[fileUrl(video), fileUrl(painting)],
			);
			console.log(`${path.basename(video)}: ${r.size} ${r.seconds} s  Chrome frame 0 vs painting: mean ${r.f0[0].toFixed(2)} max ${r.f0[1]}   last frame vs frame 0: mean ${r.seam[0].toFixed(3)} max ${r.seam[1]}`);
		}
	} finally {
		await browser.close();
		tmp.remove();
	}
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
