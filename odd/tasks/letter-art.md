# Letter art: Esdras's letter as papyrus, with his painted portrait

Objective: Esdras's letter on Home reads as the same papyrus as "Leyendo ahora", and his portrait can be the user's own painting, with nothing new that moves or plays on Home. The landscape comes after this, and it needs measured performance numbers.
Branch: `feat/letter-art`. Delivery: merge into main, release on the user's go-ahead. Test runner: Vitest (`npm test`), plus `npm run lint` and `npm run build`.

## Specs

- **S1** Esdras's letter is a papyrus scroll like the desk's: the same papyrus, rolled at its top and its bottom on rods with knobs, and with deckled sides. Folded and unrolled, the letter keeps every word, button, state and behaviour it has today. Text never sits on an image.
- **S2** Esdras's portrait can be the user's painting: `Dromos/Arte/esdras-light.<ext>` in the light theme and `esdras-dark.<ext>` in the dark theme, with the own-art S4 naming rules. The painting fills the niche under its arch; the frame, the molding and the new letter's wax seal stay. A theme without its painting keeps the drawn scribe. The paintings are read when Home opens and on each Sync.
- **S3** Performance (user: "tambien deberiamos tener en cuenta la cuestion del rendimiento"):
  - The letter adds nothing that moves or plays on Home. There is no video: an `esdras-*.webm` is ignored. There is no animation: the papyrus is static CSS.
  - The portrait files are small.
  - What already moves (the scene videos and the landscape's animations) is measured, so the landscape's plan starts from numbers.
- **S4** `docs/own-art.md` gives the prompts for the two portraits. When the user sends them, they are exported to WebP and placed in the vault.

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S1 | inline | done | 6833334 |
| T2 | S2, S3 (no video) | inline | done | 4a2c77c |
| T3 | S3 (measurements) | inline | done | L3 |
| T4 | S4 (prompts, docs) | inline | done | docs commit (L3) |
| T5 | S4 (portraits in) | inline | done | in the vault (L4) |
| T6 | release | inline | done | 0.27.0 (L5) |

## Log

- **L1** (2026-11-25, user): "continuemos mejor con la carta de esdras y luego hay si el paisaje porfavor" and "tambien deberiamos tener en cuenta la cuestion del rendimiento". My earlier proposal for the letter, which the user chose: "Ya es un pergamino, así que puede tomar el papiro que hicimos para 'Leyendo ahora'. Además, el retrato de Esdras como escriba podría ser una pintura tuya en vez del dibujo."
- **L2** (2026-11-25): Mockup and decisions:
  - **Mockup:** a scratch harness rendered the real `BriefingPanel` with an extra stylesheet, folded and open, light and dark, at 600 and 360 px. The letter loses its card border: the papyrus `::before` is the desk's, with a vertical deckle (seed 11), and the two `.dromos-scroll-edge` become rolls on a rod with knobs. The portrait grows from 46×57 to 64×79 on wide panes, so a painting reads; phones keep a small one inline.
  - **No portrait video:** Home is always on screen, and a loop the size of a thumbnail is not worth a decoder running all the time (S3).
  - **Route:** inline, because no writer trigger applies.
- **L3** (2026-11-25): T1-T4 are done.
  - **T1 (6833334):** the papyrus letter is CSS only. The real `BriefingPanel` was rendered with the real stylesheet, folded and open, at 600 and 360 px, in both themes.
  - **T2 (4a2c77c):**
    - **RED:** 8 tests failed first. **GREEN:** 2630 tests pass, lint has 0 errors (4 old warnings), build OK.
    - **Markup:** the painting is an `<image>` per theme laid over the drawn figure inside the arch's clip, so the markup without a portrait is unchanged.
    - **Wiring:** the Home wiring has no DOM test. A scratch harness mounted the real `HomeScreen` in Chrome with the test deps and a stand-in portrait: the letter shows the dark painting in the dark theme and the light one in the light theme, with no `<video>` and no page errors.
  - **T3, measurements:** headless Chrome without a GPU on a 24-core machine, 10 s after 3 s of warm-up, CPU of every Chrome process. Obsidian composites on the GPU, so its absolute numbers are likely lower; the ratios are what count.

    | Scenario | CPU (% of one core) |
    |---|---|
    | Blank page | 0.1 |
    | Home, landscape animations running, with the new letter | 11.8 |
    | Home with reduced motion: the letter alone is static | 0.2 |
    | Library, painted, no video | 0.1 |
    | Library, wall and desk loops at 1800 px and 24 fps | 15.4 |
    | The same loops at 960 px and 12 fps | 5.5 |
    | Two CSS-only breathing glows (opacity animation) | 11.6 (software compositing; untested on a GPU) |

    - **The letter** adds no measurable cost.
    - **The landscape plan:** today's animated landscape already costs about as much as one full-size loop. A painted landscape with one light loop at about 960 px and 12 fps should cost less than today, and a still painting costs nothing.
  - **T4:** the `esdras` prompts (dark, light), with a 4:5 box under the arch, export at 400×496 WebP, and no video. README and CHANGELOG `[Unreleased]` are updated.
  - **Next:** T5 waits for the user's two portraits.
- **L4** (2026-11-26, user): sent the two Gemini portraits (1856×2304, 4:5) and said "mira las imagenes".
  - **Labels:** neither image has painted labels or lettering, so no cleanup was needed. The dark one paints the oil lamp at its lower left corner, against the prompt; at the niche's size it reads as warm light, so it stays.
  - **Crop:** three crops of the same images were rendered in the real `BriefingPanel` at 600 and 360 px, in both themes: the whole image, 78% of its width, and 60%. The whole image makes the face too small at 64×79 px, and 60% loses the reed pen. The 78% crop (x 167, y 184, 1448×1796 px) keeps the face readable and the pen in his hand.
  - **Files:** the crop was exported with `cwebp -q 80` at 400×496: esdras-dark is 15 KB and esdras-light 16 KB. Both are in `Dromos/Arte/`.
  - **Check:** a scratch harness mounted the real `HomeScreen` in Chrome with the two files. The dark theme shows only the dark portrait and the light theme only the light one, with no `<video>` and no page errors.
  - **Next:** T6, the 0.27.0 release, waits for the user's go-ahead.
- **L5** (2026-11-26, user): "si dale porfavor y dime con cual continuamos", the go-ahead for 0.27.0.
  - **Merge and release:** feat/letter-art was merged into main (500d0c0). release/0.27.0 holds the changelog (8a1149d) and `npm version minor` (cfc2dc0, tag 0.27.0), and was merged back (55db67c).
  - **Checks:** 2630 tests pass, lint 0 errors (4 old warnings), build OK.
  - **Release:** main and the tag were pushed as NickGV. release.yml run 45826356150 finished with success, and release 0.27.0 has main.js, manifest.json and styles.css.
  - **Next:** the landscape, as the user asked in L1.
