// Harness of landscape/guides.cjs, bundled with the repository's esbuild and run in Node: the plugin's own landscape
// drawing, alone, at 3840 x 1200 (its 960 x 300 view box at 4x), in both themes, without what Dromos keeps drawing
// over a painting (the walker, the gate and the campfire), as the layout guide handed to the generator with the
// landscape prompt, so the hills, the road and the village keep their places.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { Landscape } from '../../../src/ui/atoms/Landscape';

export const THEMES = ['light', 'dark'] as const;

/** Writes <outDir>/pages/guide-<theme>.html for each theme. */
export function writeGuidePages(outDir: string, cssHref: string): readonly string[] {
	const pages = join(outDir, 'pages');
	mkdirSync(pages, { recursive: true });
	const svg = renderToStaticMarkup(<Landscape />);
	for (const theme of THEMES) {
		const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${cssHref}">
<style>
html, body { margin: 0; }
*, *::before, *::after { animation: none !important; transition: none !important; }
.dromos-root .dromos-scene { width: 3840px; height: 1200px; --dromos-scene-h: 1200px; --dromos-scene-shift: 0px; --dromos-sky-x: 0px; margin: 0; border: 0; }
.dromos-root .dromos-scene-sky { transform: none !important; }
.dromos-root :is(.dromos-scene-gate, .dromos-walker, .dromos-campfire) { display: none !important; }
</style></head>
<body class="theme-${theme}"><div class="dromos-root"><div class="dromos-scene" data-period="day">${svg}</div></div></body></html>`;
		writeFileSync(join(pages, `guide-${theme}.html`), html);
	}
	return THEMES;
}
