// Harness of walker/guides.cjs, bundled with the repository's esbuild and run in Node: the plugin's own walker of
// each of the twelve stages, alone and without objects, as the pose guides for the stage paintings, and the
// fourteen skill objects in a grid as the guide for one painted sheet. It also writes walker-set.json: the stage
// and object order and the shared frames, read by prep.py and measure.cjs, so they always follow the code.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { STAGE_IDS } from '../../../src/domain/character/Stage';
import { OBJECT_FRAME, SkillObject } from '../../../src/ui/atoms/avatar/SkillObject';
import { WALKER_FRAME, WalkerFigure } from '../../../src/ui/atoms/avatar/WalkerFigure';
import { SKILL_OBJECT_SPOTS } from '../../../src/ui/presenters/avatar';

/** The objects guide's grid: five columns, three rows (fourteen objects and one empty cell). */
export const OBJECT_GRID = [5, 3] as const;

const frame = (f: { x: number; y: number; width: number; height: number }): number[] => [f.x, f.y, f.width, f.height];

/** Writes <outDir>/pages/guide-<stage>.html, <outDir>/pages/objects-guide.html and <outDir>/walker-set.json. */
export function writeGuidePages(outDir: string, cssHref: string): { stages: readonly string[]; objects: readonly string[] } {
	const pages = join(outDir, 'pages');
	mkdirSync(pages, { recursive: true });
	const head = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${cssHref}"><style>html,body{margin:0}*{animation:none!important;transition:none!important}</style></head>`;
	// Fits each svg.fit's view box to its content's box, padded by data-pad of its larger side.
	const fitScript = `<script>for (const s of document.querySelectorAll('svg.fit')) { const b = s.querySelector('.fit-g').getBBox(); const p = Math.max(b.width, b.height) * (+s.dataset.pad); s.setAttribute('viewBox', [b.x - p, b.y - p, b.width + 2 * p, b.height + 2 * p].join(' ')); }</script>`;
	for (const stage of STAGE_IDS) {
		const figure = renderToStaticMarkup(
			<g className={`dromos-walker is-${stage}`}>
				<g className="dromos-walker-body">
					<WalkerFigure avatar={{ stage, objects: [] }} />
				</g>
			</g>,
		);
		// A 2:3 frame like the paintings: the figure's box centred, the feet near the bottom.
		writeFileSync(
			join(pages, `guide-${stage}.html`),
			`${head}<body class="theme-light" style="background:#fff"><div class="dromos-root"><svg class="fit" data-pad="0.05" width="1000" height="1500" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg"><g class="fit-g">${figure}</g></svg></div>${fitScript}</body></html>`,
		);
	}
	const objects = Object.keys(SKILL_OBJECT_SPOTS);
	const cells = objects.map((id) => `<svg class="fit" data-pad="0.12" width="340" height="340" xmlns="http://www.w3.org/2000/svg"><g class="fit-g">${renderToStaticMarkup(<SkillObject id={id} />)}</g></svg>`);
	// Mid grey, so the cream scrolls show.
	writeFileSync(
		join(pages, 'objects-guide.html'),
		`${head}<body class="theme-light" style="background:#d9d6d0"><div class="dromos-root"><div id="sheet" style="background:#8f8a82;display:grid;grid-template-columns:repeat(${OBJECT_GRID[0]},340px);gap:60px;padding:60px;width:max-content">${cells.join('')}</div></div>${fitScript}</body></html>`,
	);
	const set = { stages: STAGE_IDS, objects, object_grid: OBJECT_GRID, walker_frame: frame(WALKER_FRAME), object_frame: frame(OBJECT_FRAME) };
	writeFileSync(join(outDir, 'walker-set.json'), `${JSON.stringify(set, null, 1)}\n`);
	return { stages: STAGE_IDS, objects };
}
