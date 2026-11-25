# Shop art: the user's paintings and light loops on the Shop's stall

Objective: the Shop's stall shows the user's own paintings from the vault and the loops made from them, as the Library's scenes do (own-art, scene-video).
Branch: `feat/shop-art`. Delivery: merge into main, release on the user's go-ahead. Test runner: Vitest (`npm test`), plus `npm run lint` and `npm run build`.

## Specs

- **S1** The Shop's stall shows the user's painting from `Dromos/Arte/`: `shop-light.<ext>` in the light theme and `shop-dark.<ext>` in the dark theme, with the same extensions and file-naming rules as own-art S4. The painting replaces the stall's drawing in its theme. A theme without its painting keeps the drawing. The paintings are read when the Shop opens and on each Sync.
- **S2** A painting's video, `shop-<theme>.webm` (or `.mp4`), plays over it under scene-video S1-S4: muted, looping, only while seen, never under reduced motion, and the painting is its still frame.
- **S3** The gold plaque, the tabs, the wares and the purchases work and read as before. The only text on the stall is on the plaque's parchment, never straight on the painting. An offline stall still looks faded.
- **S4** Without the Shop's paintings, the Shop looks exactly as before: same pixels, in both themes and at every time of day.
- **S5** `docs/own-art.md` gives the prompts for the two Shop paintings. When the user sends them, their light loops are made from them the way the eight Library loops were (light breathing only) and placed beside them in the vault.

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S1-S4 | inline | done | 790d85d (L3) |
| T2 | S5 (prompts, docs) | inline | done | 790d85d (L3) |
| T3 | S5 (paintings in, loops out) | inline | waiting for the user's paintings | |
| T4 | release | inline | waiting for the user's go-ahead | |

## Log

- **L1** (2026-11-25, user): "perfecto, la verdad este tema de las own art me encanto y quisiera que lo sigamos utilizando tambien conectandolo con los videos que haces, que otras partes podriamos agregarle todo esto?" I proposed the Shop first ("¿Arrancamos por la Tienda?"). The user answered: "si dale porfavor".
- **L2** (2026-11-25): Design notes, from the code:
  - **Structure:** the stall (`ShopScreen`, `StallArt`, viewBox 1000×272, `xMidYMax slice`, height `clamp(170px, 27.2cqi, 290px)`) moves into `SceneLayers`, so the own-art and scene-video rules apply to it as they do in the Library.
  - **Fit:** the painting is cropped the way the drawing is, `center bottom`: the counter stays, and narrow panes lose the sides.
  - **Time of day:** as in the Library, the painting follows the theme, not the hour. `data-period` keeps repainting the drawing only.
  - **Files:** `shop` is the file name the user sees in `Arte/` ("Tienda"); `stall` stays the drawing's name in the code.
  - **Route:** inline, because no writer trigger applies (one behaviour).
- **L3** (2026-11-25): T1 and T2 are done.
  - **RED:** 8 new or changed tests failed before the change, for the absent `shop` scene and the stall's old markup.
  - **GREEN:** `npm test` passes, 2623 tests. `npm run lint` has 0 errors (the same 4 old warnings). `npm run build` passes.
  - **S4 differential:** the real `ShopScreen` was rendered with the real stylesheet before and after the change, without paintings, in 48 cases: 2 themes × 4 periods × 3 widths × online and offline. All 48 are pixel-identical (scratch harness, not committed).
  - **S1-S3:** a stand-in painting (the archive's) was rendered as `shop-*`. It replaces the drawing, crops `center bottom`, keeps the plaque at its place over it, and fades offline.
  - **Tests:** two existing tests checked that another screen's markup did not contain the substring `dromos-library`. The stall's layers carry `dromos-library-scene`, so both now match the whole class name.
  - **Prompts:** the Shop prompts paint the merchant, as the drawing has him. This is the one exception to the style block's "No people".
  - **Measurements:** the box is 1128×291 on desktop, 808×229 at 840 and 358×171 on a phone. The plaque sits at image x 87-99%, y 25-45% on wide panes, and over x 64-77% on a phone.
  - **Next:** T3 waits for the user's two paintings.
