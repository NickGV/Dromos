# Landscape art: the user's painting of the landscape above every screen

Objective: the landscape at the top of every screen shows the user's own painting, with the walker, the gate, the campfire and the signpost still drawn over it where they mean something, and it costs less to keep on screen than today's animated drawing.
Branch: `feat/landscape-art`. Delivery: merge into main, release on the user's go-ahead. Test runner: Vitest (`npm test`), plus `npm run lint` and `npm run build`.

## Specs

- **S1** The landscape shows the user's painting from `Dromos/Arte/`: `landscape-light.<ext>` in the light theme and `landscape-dark.<ext>` in the dark theme, with the own-art S4 naming rules. The painting replaces the drawn landscape in its theme, and a theme without its painting keeps the drawing. The paintings are read when the view opens and on each Sync.
- **S2** Over the painting, Dromos keeps drawing what carries meaning: the walker at its place on the road, the gate at the road's end with its level plaque, the campfire of a complete day, the signpost, the character's plaque and the level-up ribbon. The painting follows the drawing's 960 × 300 layout, sliced and framed as the drawing is, so the walker walks on the painted road and passes under the gate.
- **S3** Performance (user, letter-art L1: "tambien deberiamos tener en cuenta la cuestion del rendimiento"):
  - With a painting, the drawn landscape and its loops are not drawn.
  - A loop beside the painting, `landscape-<theme>.webm` (or `.mp4`), plays over it under scene-video S1-S4.
  - The painted Home is measured against today's, with the method of letter-art L3.
- **S4** Time of day (assumption, to confirm on the mockup with the user's paintings): the dark theme shows its night painting at every hour, as the drawing keeps its night. The light theme shows the day painting by day, the same painting warmed at dawn and dusk, and the night painting at night when there is one. An offline scene still fades.
- **S5** Without the landscape's paintings, every screen looks exactly as before: same pixels, in both themes, at every time of day.
- **S6** `docs/own-art.md` gives the two landscape prompts and says how to make them from the layout guides: the drawing itself without what Dromos draws over it, handed to the generator with the prompt, so the composition stays.

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S6 (guides, prompts to the user) | inline | done | L2 |
| T2 | S1-S4 (mockup with the user's paintings) | inline | waiting for the user's paintings | |
| T3 | S1-S5 (code) | inline | pending | |
| T4 | S6 (docs), S3 (loops, measurement) | inline | pending | |
| T5 | release | inline | pending, on the user's go-ahead | |

## Log

- **L1** (2026-11-25, user): "continuemos mejor con la carta de esdras y luego hay si el paisaje porfavor" and "tambien deberiamos tener en cuenta la cuestion del rendimiento". After 0.27.0 (2026-11-26) I proposed starting on the landscape ("¿Arranco con el paisaje?"), and the user answered "si dale porfavor, veamos como quedaria".
- **L2** (2026-11-26): Design notes, from the code:
  - **Geometry:**
    - The landscape is one SVG, view box 960 × 300, `xMidYMax slice`, framed left by `--dromos-scene-shift` below 870 px.
    - The scene is 300-380 px tall, and 220 px on phones.
    - A 2560 px pane keeps only the drawing's bottom from y 142, and a 360 px phone frames it from x 427.
    - So the painting's focal area is x 44-100 %, y 47-100 %.
  - **Layout guide:** a painting placed by text alone would not keep the road under the walker. The real `Landscape` was rendered alone at 3840 × 1200 (4×), in both themes, without the walker, the gate and the campfire (scratch harness `entry-guide.tsx`). The user hands that image to Gemini with the prompt, so the hills, the road and the village keep their places.
  - **Files for the user:** `~/Downloads/dromos-paisaje/landscape-guide-light.png` and `landscape-guide-dark.png`.
  - **Order:** the mockup with the user's paintings comes before the code. It shows whether the generator keeps the road under the walker, which decides S2.
  - **Route:** inline, because no writer trigger applies.
