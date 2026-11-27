# Art tools

These scripts turn generated paintings into the files Dromos reads from `Dromos/Arte/` ([docs/own-art.md](../../docs/own-art.md)). They key out flat green and magenta backgrounds, fit the painted walker and his objects into the walker's shared frames, check a landscape's road against the game's road, render seamless loops with soft motion, and measure what a loop costs in CPU.

None of them is part of the plugin: the plugin bundle builds from `src/main.ts` only, so nothing here ships.

**Rules that hold for every tool**

- Every path is an argument or an environment variable. A tool writes only into the folder you give it.
- Work in a folder outside the vault (`tools/art/work/` is ignored by git if you want it in the repository). Copy a finished file into `<vault>/Dromos/Arte/` by hand, after its checks.
- The vault may be read: `--art <vault>/Dromos/Arte` only reads the paintings.
- Commands below run from the repository root. `python` is the venv's Python (see [Setup](#setup)), run with `-I` so nothing from the current folder is imported.

## Contents

| Folder | Tool | What it does | Needs |
|---|---|---|---|
| `keying/` | `key_green.py` | Cuts a figure out of flat green (#00FF00) | Pillow |
| | `key_magenta.py` | Cuts a sheet of objects on flat magenta (#FF00FF) into one PNG per grid cell | Pillow |
| `walker/` | `guides.cjs` | Renders the walker's pose guides and the objects guide from the plugin's code | Node, Chrome |
| | `prep.py` | Keys, measures and fits the stage and object paintings into the walker's frames | Pillow, Node, Chrome, cwebp |
| | `measure.cjs` | Measures the drawn walker and objects (`prep.py` runs it) | Node, Chrome |
| | `overlay.cjs` | Lays each prepared stage over its drawn figure, to check the fit | Node, Chrome |
| | `satchel.py` | Lends the runner's satchel and strap to another stage painting | Pillow |
| `landscape/` | `guides.cjs` | Renders the landscape's layout guides from the plugin's code | Node, Chrome |
| | `road.py` | Draws the game's road and landmarks over a landscape painting | Pillow |
| `motion/` | `motion.py` + `presets/` | Renders a seamless loop with soft motion from a painting | numpy, OpenCV, Pillow, ffmpeg |
| | `sheet.py` | Contact sheet and numbers for a rendered loop | numpy, OpenCV, Pillow, ffmpeg |
| | `frame0.cjs` | The loop as Chrome decodes it, against the painting | Node, Chrome |
| | `peek.py`, `masks.py` | Preview crops and masks while writing a preset | numpy, OpenCV, Pillow |
| | `calm.py` | Motion under the calm areas (the Library's text panels) | numpy, OpenCV, Pillow |
| `perf/` | `video.cjs` | CPU of each loop alone | Node, Chrome, Linux |
| | `screens.cjs` | CPU of the real Home or Library, drawn, painted, and painted with loops | Node, Chrome, Linux |
| `lib/` | `binaries.py`, `node.cjs` | Shared: finding ffmpeg, cwebp, Chrome and playwright-core; esbuild bundles; the CPU counter | |

The `.tsx` files next to `guides.cjs` and `screens.cjs` are harnesses. They import the plugin's own components from `src/` (and test fakes from `test/`) by relative path, and the `.cjs` script bundles them with the repository's esbuild each run, so the guides and measurements always follow the current code.

## Setup

| Dependency | Used by | How to get it |
|---|---|---|
| Node and the repository's packages | every `.cjs` tool (esbuild, React) | `npm install` in the repository, as for the plugin |
| Python 3 with Pillow | keying, walker, road | the venv below |
| numpy and OpenCV (`opencv-python-headless`) | `motion/*.py` | the venv below |
| ffmpeg with libvpx (VP8) | `motion.py`, `sheet.py` | your system's ffmpeg package; or a Playwright ffmpeg build that has VP8 (some recent ones only have VP9, and the tools skip those) |
| Chrome or Chromium | every `.cjs` tool | an installed Chrome, or `npx playwright install chromium` |
| `playwright-core` | every `.cjs` tool | `npm install -g playwright-core`, or point `PLAYWRIGHT_CORE` at an existing copy |
| `cwebp` (libwebp's tools) | `prep.py`, exporting paintings | your system's `webp` package |

The Python venv, once:

```bash
python3 -m venv tools/art/.venv
tools/art/.venv/bin/pip install -r tools/art/requirements.txt
source tools/art/.venv/bin/activate      # then `python` below is the venv's
```

Each program is found without a fixed path. Set a variable only to override the search:

| Variable | Default search |
|---|---|
| `FFMPEG` | `ffmpeg` on PATH, then Playwright's `ms-playwright/ffmpeg-*` builds (in `PLAYWRIGHT_BROWSERS_PATH` or the user cache); the first that encodes and decodes VP8 wins |
| `CWEBP` | `cwebp` on PATH |
| `CHROME` | `google-chrome`, `google-chrome-stable`, `chromium` or `chromium-browser` on PATH, else Playwright's own Chromium |
| `PLAYWRIGHT_CORE` | the repository's `node_modules`, then the global npm folder (`playwright-core`, or the copy inside `playwright`, `@playwright/test` or `@playwright/cli`) |
| `DROMOS_ART` | none: the folder `--art` points to, for the motion tools |

## A landscape painting

The landscape has four paintings: `landscape-light` (day), `landscape-dark` (night), `landscape-dawn` and `landscape-dusk`. The prompts and the order they are made in are in [docs/own-art.md, landscape](../../docs/own-art.md#landscape-the-countryside-above-every-screen).

1. **Guides.** Use `docs/own-art/landscape-guide-<theme>.png`, or render fresh ones when the drawing changed ([Regenerating the layout guides](#regenerating-the-layout-guides)).
2. **Paint.** In Gemini, attach the guide and paste the style block and the prompt. Dawn, dusk and the final night are edits of a painting, with their prompt alone.
3. **Export** at exactly 3.2:1 as WebP, quality 80 (about 50-70 KB):

   ```bash
   cwebp -q 80 -resize 3712 1160 painting.png -o <work>/landscape-light.webp
   ```

4. **Check the road:**

   ```bash
   python -I tools/art/landscape/road.py <work>/landscape-light.webp <work>/road-light.png \
     --guide docs/own-art/landscape-guide-light.png
   ```

   It writes `road-light.png` (the painting with the game's road outlined in red and the gate, campfire, windmill, shepherd and lion circled in magenta) and `road-light-blend.png` (the same over the guide at half opacity). The road and the gate and campfire spots are read from the plugin's source.

   - [ ] The painted road stays under the red outline along its whole length.
   - [ ] The gate's foot and the campfire's spot are plain grass.
   - [ ] No gate, arch or posts near any path, and no lettering anywhere. Paint a stray one out by hand in an image editor.

5. **Place it:** copy `landscape-<period>.webp` into `<vault>/Dromos/Arte/`, then make its loop ([Loops with motion](#loops-with-motion)).

## The walker's twelve stages and the object sheet

The prompts, the order and the frames are in [docs/own-art.md, walker](../../docs/own-art.md#walker-the-painted-walker-on-the-road). Use one work folder for the whole set; `prep.py` only redoes what changed, so a stage repainted later needs only its new raw image and another run.

1. **Guides and the work folder:**

   ```bash
   node tools/art/walker/guides.cjs <work>/walker
   ```

   It writes `pages/` (the guide pages), `walker-set.json` (the stage and object order and the shared frames, from the code) and `guides/guide-<stage>.png` and `guides/objects-guide.png`, the same images as `docs/own-art/walker/`.

2. **Paint** each stage from its guide and the runner's painting, and the object sheet from the objects guide (magenta background).
3. **Drop the raw images** into `<work>/walker/in/`, named by stage id: `runner`, `wayfarer`, `pilgrim`, `apprentice`, `disciple`, `traveller`, `student`, `scholar`, `mentor`, `counsellor`, `elder`, `sage` (`.jpeg`, `.jpg` or `.png`), and `objects.jpeg` for the sheet.
4. **Prepare:**

   ```bash
   python -I tools/art/walker/prep.py <work>/walker            # add --measure after the drawing changed
   ```

   It keys each changed raw image into `cut/` (`keying/key_green.py`, and `keying/key_magenta.py` for the sheet, cell by cell in the 5 × 3 guide order), measures the drawn walker in Chrome into `measure.json`, and writes `out/walker-<stage>.webp` (320 × 480) and `out/object-<skill>.webp` (160 × 160) with `cwebp -q 85 -alpha_q 90`. It prints each mapping's residuals and keeps them in `report.json`.

5. **Check the fit:**

   ```bash
   node tools/art/walker/overlay.cjs <work>/walker               # -> probe/overlay-<stage>.png
   ```

   - [ ] Each overlay: painted feet on the drawn feet, painted staff on the drawn staff, hook top at the drawn staff's top.
   - [ ] `report.json` residuals stay small (in walker units, the set so far: left -0.2 to 2.5, staff tip -0.4 to -2.2; objects within about 1.4). `prep.py` stops when a painting leaves its frame: widen the frame in the code, run `guides.cjs` again, then `prep.py` for every file.
   - [ ] `cut/<stage>.png` shows no green halo and nothing touching the frame; the runner to the traveller carry the satchel ([The satchel](#the-satchel-composite)).

6. **Place them:** copy `out/*.webp` into `<vault>/Dromos/Arte/`.

The keyers also work on their own:

```bash
python -I tools/art/keying/key_green.py raw.jpeg cut.png
python -I tools/art/keying/key_magenta.py sheet.jpeg <work>/walker/walker-set.json <out-dir> [--grid 5x3]
```

## The satchel composite

From the runner to the traveller, the walker carries a satchel on a strap, and the belt objects hang from it. When a stage painting comes back without it, lend it the runner's own:

1. **Composite** the runner's satchel and strap onto the stage painting. Both must share one canvas and pose, as every stage painting so far does (1696 × 2528):

   ```bash
   python -I tools/art/walker/satchel.py <work>/walker/in/runner.jpeg pilgrim-raw.jpeg <work>/walker/in/pilgrim.jpeg
   ```

2. **Check** `pilgrim.jpeg` and its mask `pilgrim.jpeg.mask.png`:
   - [ ] The mask covers only the strap and the satchel: no patch of the cream tunic and no dark fold of the cloak.
   - [ ] The stage keeps what its own painting had, such as the apprentice's sash.

   A different pose or canvas needs the bands in `satchel.py` refitted.

3. **Prepare again:** run `prep.py`, which re-keys only the changed stage, then `overlay.cjs`.

## Loops with motion

A loop is a short, seamless WebM that plays over its painting: `<scene>-<theme>.webm` beside `<scene>-<theme>.webp` ([docs/own-art.md, Videos](../../docs/own-art.md#videos)). `motion.py` renders one from the painting and a preset. Frame 0 is the painting and the last frame flows into the first, and nothing moves over what Dromos draws on top.

### The presets

Each preset in `motion/presets/` is named after its file in `Dromos/Arte/`: `src` is the painting's file name inside the `--art` folder and `out` the video's file name. All of them render 15 fps, 10 s, VP8 at 1000k.

| Presets | Width | Motion |
|---|---|---|
| `landscape-light`, `-dark`, `-dawn`, `-dusk` | 1600 | clouds, cypresses and the tree in a passing breeze, chimney smoke, the windmill's sails, the sun's or moon's glow; birds by day; lit windows at dawn, dusk and night; mist at dawn; stars and fireflies at night |
| `shop-light`, `shop-dark` | 1476 | the awning's hem, the palm, the cloth and dust motes; the cloud by day; the lamp flames, their halos and the stars at night |
| `wall-*`, `desk-*`, `archive-*`, `shelf-*` | 1456, 1568, 1568, 1280 | the light breathing and motes drifting; the archive's cypress, and its clouds by day; the desk's lamp and the archive's candle and stars at night |

### Make a loop

```bash
export DROMOS_ART=<vault>/Dromos/Arte        # or pass --art; only read
python -I tools/art/motion/motion.py tools/art/motion/presets/landscape-dark.json \
  --out-dir <work>/loops --moves <work>/loops/landscape-dark.npy
```

Add `--seconds 2` (or a smaller `--width`) for a quick preview first. `--frames 0,0.25,0.5` saves stills instead of a video.

Then check it:

```bash
python -I tools/art/motion/sheet.py tools/art/motion/presets/landscape-dark.json \
  <work>/loops/landscape-dark.webm <work>/loops/landscape-dark-sheet.png --moves <work>/loops/landscape-dark.npy
node tools/art/motion/frame0.cjs <work>/loops/landscape-dark.webm "$DROMOS_ART/landscape-dark.webp"
python -I tools/art/motion/calm.py tools/art/motion/presets/wall-*.json     # Library presets
```

- [ ] `sheet.py`: frame 0 against the painting averages about 1 level or less, the seam is no bigger than an ordinary frame step, and the rendered motion inside the still shapes is 0 pixels.
- [ ] The sheet's "what moves" map shows nothing on the road, the gate, the campfire's spot, the walker's way, the figures or under the Shop's plaque.
- [ ] `frame0.cjs`: Chrome's frame 0 is within about 1 level of the painting on average.
- [ ] `calm.py`: no motion under the Library's text panels (the light may breathe a little).
- [ ] The file is under about 2 MB (the loops so far are 0.2-0.8 MB).

Copy `<scene>-<theme>.webm` into `<vault>/Dromos/Arte/` beside its painting.

### Make a new preset

1. Copy the closest preset to `motion/presets/<scene>-<theme>.json` and set `src` and `out` to the painting's and the video's file names.
2. Coordinates are drawing units: 960 across the painting, and its height in proportion (300 for the landscape). Read them off the painting with `peek.py ... --at 0`, which crops the painting itself:

   ```bash
   python -I tools/art/motion/peek.py <preset> <work>/peek.png --box 380 150 460 200 --zoom 2 --at 0
   ```

3. Mark what must stay still in `keepout` (`path`, `poly`, `rect`, `circle` or `ellipse` shapes): everything Dromos draws over the painting. A group with a `strength` below 1 is calm rather than still, as under the Library's text panels and the Shop's plaque.
4. Add effects. Each type's docstring in `motion.py` says what it does: `clouds`, `breeze`, `sway`, `smoke`, `sails`, `glint`, `flicker`, `glow`, `fireflies`, `birds`, `mist`, `wave`. `"off": true` switches one off.
5. Look before rendering: `masks.py <preset> <work>/masks.png` shows the keep-outs and each effect's region, and `peek.py <preset> <out> --box ... --at 0,0.25,0.5,0.75 --only sway` shows one effect over the loop.
6. Render a short loop, then the full one, and run the checks above.

### Measure the cost

Measure on Linux with nothing else busy, and compare cases measured in the same run. Both tools count every Chrome process over 10 s after a 3 s warm-up, in % of one core, and print the median of the rounds.

```bash
node tools/art/perf/video.cjs <work>/loops/*.webm --rounds 3          # each loop alone in a 1160 x 363 box
node tools/art/perf/screens.cjs home --art <dir> --theme dark --hour 23 --rounds 3
node tools/art/perf/screens.cjs library --art <dir> --theme light --hour 13 --rounds 3 --views room,shelf,archive
```

`screens.cjs` mounts the real `HomeScreen` or `LibraryPanel` at 1160 px and compares the drawn screen, the paintings without loops, and the paintings with loops. `<dir>` holds files named as in `Dromos/Arte/`, and the plugin's own matcher picks them.

For reference ([odd/tasks/landscape-art.md](../../odd/tasks/landscape-art.md), L9, L14 and L21): a landscape loop at 1600 × 500, 15 fps costs about 5 % alone. The painted Home with its loop cost 7.7 % against 18.4 % drawn. The Library room cost 7.5-7.8 % with the 15 fps loops.

## Regenerating the layout guides

Render the guides again when the drawing they come from changes: `Landscape.tsx`, `WalkerFigure.tsx`, `SkillObject.tsx`, the stage looks, or the scene's styles in `styles.css`.

```bash
node tools/art/landscape/guides.cjs <work>/guides     # -> landscape-guide-light.png, landscape-guide-dark.png (3840 x 1200)
node tools/art/walker/guides.cjs <work>/walker        # -> guides/guide-<stage>.png (1000 x 1500), guides/objects-guide.png
```

- [ ] The run reports no page errors.
- [ ] The landscape guide has no walker, gate or campfire; the walker guides carry no objects.

To update the published guides, copy the PNGs over `docs/own-art/landscape-guide-*.png` and `docs/own-art/walker/`. A painting made from an older guide stays valid as long as the road and the walker's pose did not move.
