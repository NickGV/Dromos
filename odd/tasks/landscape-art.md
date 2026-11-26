# Landscape art: the user's painting of the landscape above every screen

Objective: the landscape at the top of every screen shows the user's own painting, with the walker, the gate, the campfire and the signpost still drawn over it where they mean something, and it costs less to keep on screen than today's animated drawing.
Branch: `feat/landscape-art`. Delivery: merge into main, release on the user's go-ahead. Test runner: Vitest (`npm test`), plus `npm run lint` and `npm run build`.

## Specs

- **S1** The landscape shows the user's painting from `Dromos/Arte/`: `landscape-light.<ext>` in the light theme and `landscape-dark.<ext>` in the dark theme, and `landscape-dawn.<ext>` and `landscape-dusk.<ext>` for the light theme's dawn and dusk (S4), with the own-art S4 naming rules. The painting replaces the drawn landscape in its theme, and a theme without its painting keeps the drawing. The paintings are read when the view opens and on each Sync.
- **S2** Over the painting, Dromos keeps drawing what carries meaning: the walker at its place on the road, the gate at the road's end with its level plaque, the campfire of a complete day, the signpost, the character's plaque and the level-up ribbon. The painting follows the drawing's 960 × 300 layout, sliced and framed as the drawing is, so the walker walks on the painted road and passes under the gate.
- **S3** Performance (user, letter-art L1: "tambien deberiamos tener en cuenta la cuestion del rendimiento"):
  - With a painting, the drawn landscape and its loops are not drawn.
  - A loop beside each painting, `landscape-<name>.webm` (or `.mp4`) for light, dark, dawn and dusk, plays over it under scene-video S1-S4 (L6).
  - The painted Home is measured against today's, with the method of letter-art L3.
- **S4** Time of day (user, L3-L4: "que en la noche el pastor ya este en la casa"): the landscape tells the shepherd's day in four paintings.
  - The paintings: dawn `landscape-dawn` (he sets out with the sheep), day `landscape-light`, dusk `landscape-dusk` (he heads home), night `landscape-dark` (he is at home, the sheep in their fold).
  - The light theme shows the painting of the current period.
  - The dark theme shows the night painting at every hour, as the drawing keeps its night.
  - Assumption: in the light theme, a missing dawn, dusk or night painting falls back to the day painting.
  - An offline scene still fades.
- **S5** Without the landscape's paintings, every screen looks exactly as before: same pixels, in both themes, at every time of day.
- **S7** Loops with motion (user, L6: "un video asi con movimiento suave pero bonito, para que tenga mas impacto y se vea mas cool", and the Shop's too "si se puede y no tiene mucho impacto en rendimiento"):
  - **What moves:** each landscape painting and the Shop's two paintings get a loop where parts of the painting move softly, such as smoke, clouds, sails, grass, fireflies, stars and lamplight, and not only the light.
  - **What stays still:** the road, the gate's foot, the campfire's spot and the walker's way.
  - **Seamless loop:** the loop is seamless, and its first frame is the painting.
  - **Shop files:** the Shop's new loops replace `shop-light.webm` and `shop-dark.webm`, so they need no code change.
  - **Cost:** a landscape loop must cost less than today's animated drawing (11.8 % of a core, letter-art L3), with a target of about 6 %, measured.
- **S6** `docs/own-art.md` gives the landscape prompts:
  - The day and night paintings come from the layout guides: the drawing itself without what Dromos draws over it, handed to the generator with the prompt, so the composition stays.
  - The dawn, dusk and new night paintings are edits of those two paintings that change only the light and the shepherd's day.

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S6 (guides, prompts to the user) | inline | done | L2 |
| T2 | S1-S4 (mockup with the user's paintings) | inline | done | L3 |
| T3 | S1-S6 (code, tests, docs) | delegated (context backstop, L5) | in progress | |
| T4 | S3, S7 (loops with motion: a sample first, then the landscape's four and the Shop's two; measurement) | delegated (context backstop, L6) | sample in progress | |
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
- **L3** (2026-11-26, user): sent the two Gemini paintings (3712 × 1152, 3.22:1) and said "aqui te los mando, no se, se ve genial, pero ahora que es una imagen quizas podamos hacerla aun mejor, agregarle otras cosas o por ejemplo que en la noche el pastor ya este en la casa y cosas asi que dices?"
  - **Alignment:** the game's road path and landmarks were drawn over each painting, stretched to 3840 × 1200 (0.7 % off in ratio). The painted road follows the drawn road's edges along its whole length, and the gate's foot, the campfire's spot, the windmill, the shepherd and the lion all sit where the drawing has them. S2 holds without registration.
  - **Mockup:** a scratch harness mounted the real `HomeScreen` (found character at level 5, the walker on the road, the gate's "Nivel 6", the campfire) and laid each painting into the scene's SVG in place of the drawn landscape. Shot at 1160, 2560 and 360 px, in both themes: the walker walks on the painted road and the gate stands at its end, with no page errors.
  - **Framing:** at 1160 px the painted sun is half cut at the top, since the drawn sky moves down on wide panes and a painting cannot. At 2560 px the gate's plaque is cut at the scene's top with the drawing too, so this is pre-existing, not caused by the painting.
  - **Files for the user:** `~/Downloads/dromos-paisaje/maqueta-escritorio.png`, `maqueta-telefono.png` and `camino-superpuesto.png`.
  - **Open decision (S4):** the user proposes paintings that change with the time of day, such as the shepherd at home at night. Waiting for the user's answer before T3.
- **L4** (2026-11-26, user): I proposed four paintings of the shepherd's day: dawn, day, dusk, and night with the shepherd at home. Changing the shown image costs nothing; animating is what costs. I asked "¿Vamos con las cuatro pinturas del día?". The user answered "si dale dame los prompts para yo tirarlo, para dejarlo todo lo mejor posible porfavor".
  - **Prompts:** three Gemini edits, each on the original painting in a new chat, with no hex codes or percentages so that no label is painted.
    - Dawn and dusk are edits of the day painting.
    - The new night is an edit of the dark painting.
  - **Unchanged:** the day painting stays as it is.
  - **Next:** check each painting with the road overlay and the Home mockup, then T3.
- **L5** (2026-11-26, user): sent the dawn, dusk and night paintings (3712 × 1152) and said "estas son las imagenes que salieron, que te parecen?".
  - **Alignment:** with the game's road drawn over each of the three, the painted road stays under it, and the gate's foot and the campfire's spot stay plain.
  - **Content:**
    - **Dawn:** mist, a pink sky and the shepherd setting out.
    - **Dusk:** the golden hour, birds, and the shepherd heading toward the village.
    - **Night:** the shepherd's door ajar with his crook beside it, the sheep in a stone fold, and the lion asleep against the lamb.
  - **Cleanup:** the night edit painted a small iron gate at the far path's start, at x 2024-2075, y 634-665 of 3712 × 1152. Next to Dromos's gate it would read as a second gate, so each of its rows was redrawn from the pixels on either side (scratch `tools/ungate.py`).
  - **Mockup:** the real `HomeScreen` was rendered with each painting at its period: light at dawn, day, dusk and night, and dark, at 1160 and 360 px. All fit, with no page errors. In the light theme at night the drawn gate turns light and reads well on the night painting.
  - **Files:**
    - **Export:** 3712 × 1160, exactly 3.2:1, with `cwebp -q 80`. Sizes: landscape-light 52 KB, landscape-dark 47 KB (the shepherd at home), landscape-dawn 62 KB, landscape-dusk 72 KB.
    - **Placement:** all four are in `Dromos/Arte/`. The released 0.27.0 ignores them.
    - **Superseded:** the first dark painting, with the shepherd on the hill.
  - **Prompts:** the five prompts are kept verbatim for the docs: two from the layout guides and three edits.
  - **T3 route:** delegated as one unit with its docs, by the long-session context backstop: this session carries many painting images.
- **L6** (2026-11-26, user): "te pregunto de estas tambien podrias crear un video asi con movimiento suave pero bonito, para que tenga mas impacto y se vea mas cool? Tambien creo que en el de tienda no lo hiciste y estaria bien tambien si se puede y no tiene mucho impacto en rendimiento".
  - **Checked:** the Shop's loops exist. `shop-dark.webm` (251 KB) and `shop-light.webm` (787 KB) have been in `Dromos/Arte/` since 2026-11-25 (shop-art L4). They only breathe the light: the flames at strength 0.18, and the sun dims by 8 % over 8 s. That is too subtle to notice.
  - **Plan:**
    - **Sample first:** a sample with motion of the night and the day, so the user can judge the motion.
    - **Measure:** its CPU cost, against today's 11.8 %.
    - **Then the rest:** the rest of the landscape's loops and the Shop's two.
    - **Code:** the dawn and dusk videos were added to S3, so the writer of T3 was told to extend the video to every painting.
  - **Route:** T4 is delegated to one background worker in scratch, by the context backstop.
