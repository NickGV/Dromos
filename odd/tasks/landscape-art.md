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
- **S8** The drawn figures fit the painting (user, L8: "mejoremos al caminante para que quede mas acorde a lo que tenemos de fondo, porque ya queda un poco raro como esta hecho"):
  - **Over a painting:** the walker reads as part of the painted world, and so do the gate and the campfire that share its style.
  - **Still working:** every stage, the skills' objects, the walk and the breathing work as before.
  - **Performance:** it adds no measurable cost; no filter repaints an animated figure every frame.
  - **Without a painting:** the drawn landscape's figures stay as they are (S5).
  - **Mockup first:** the user chooses between the variants.
- **S9** The walker can be the user's painting (user, L12 and L15: "imagenes png de solo el caminante con sus variantes y sus etapas", "si dale armame todo y lo voy sacando"):
  - **Paintings:** one painting per stage, 12 in all.
  - **Objects:** the skills' 14 objects are painted on one sheet and placed at their spots on the figure.
  - **Light:** the figure takes the light of the hour without filters.
  - **Fallback:** a stage without its painting keeps variant C (S8).
  - **Still working:** every stage, the objects, the walk and the breathing work as before.
  - **Open, decided in T8's code:** where the paintings live and who keys them out.
- **S6** `docs/own-art.md` gives the landscape prompts:
  - The day and night paintings come from the layout guides: the drawing itself without what Dromos draws over it, handed to the generator with the prompt, so the composition stays.
  - The dawn, dusk and new night paintings are edits of those two paintings that change only the light and the shepherd's day.

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S6 (guides, prompts to the user) | inline | done | L2 |
| T2 | S1-S4 (mockup with the user's paintings) | inline | done | L3 |
| T3 | S1-S6 (code, tests, docs) | delegated (context backstop, L5) | done | aee89ba (L7) |
| T4 | S3, S7 (loops with motion: a sample first, then the landscape's four and the Shop's two; measurement) | delegated (parallel units with T6, L11) | done | in the vault (L14) |
| T6 | S8 (walker, gate and campfire restyled over the painting: variant C, chosen in L11; the walker's malformed paths fixed) | delegated (parallel units with T4, L11) | done | f84db45, dd735af (L13) |
| T7 | S8 (pilot: one painted stage of the walker beside variant C, at real size) | inline | done: the painted walker wins (L13); the full set waits for the user's decision | |
| T8 | S9 (painted walker: kit, then cut-outs and code) | delegated (context backstop, L16) | paintings in (L16); code in progress; stages 03-06 to be redone with the satchel | |
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
- **L7** (2026-11-26): T3 is done (aee89ba). Its writer covered S1-S6 and the S3 change of L6.
  - **Design:**
    - **The painting:** an HTML layer `.dromos-landscape-art` sits in the drawing's own box, with `cover` and `center bottom`. It holds `SceneVideo`s, and the scene's `has-art-*` classes and `--dromos-art-*` properties come from `scenePaintingView`.
    - **Over the painting:** the gate, the walker and the campfire stay in the SVG.
    - **The drawing:** with both themes painted it is left out. With one theme painted it sits in `.dromos-landscape-drawing`, which the stylesheet hides in the painted theme.
    - **Choosing by period:** `landscapeArtView(art.landscape, period)` picks the light theme's painting and its own loop for the period.
    - **Why not an SVG `<image>`:** it cannot hold a `<video>`.
  - **Alignment:** the layer and the mockup's SVG `<image>` are pixel-identical at 1160, 840 and 360 px in both themes. At 2560 px the largest difference is 4 of 255, from rounding.
  - **RED:** 19 failing tests first, then 5 for the loop change.
  - **GREEN:** 2651 tests pass (re-run by the parent as its spot check), lint has 0 errors (the 4 old warnings), and the build passes.
  - **S5 differential:** against f09ae6b, 48 of 48 screenshots are byte-identical. The markup differs only in React's generated id for the sky gradient (R1 became R2).
  - **Painted check:** the real `HomeScreen` with the four vault files shows the right painting at each period, with no page errors.
  - **Review:** receipt-driven review is off (global). The assessment could not run with the untracked `.atl/`, and no high-risk item applies, so there is no independent verifier.
  - **Size:** about 590 changed lines in one unit of behaviour; most of the excess is the verbatim prompts and the tests.
- **L8** (2026-11-26, user): "chat es posible que mejoremos al caminante para que quede mas acorde a lo que tenemos de fondo, porque ya queda un poco raro como esta hecho jajaj".
  - **Why it looks pasted on:** the walker, the gate and the campfire are flat vector shapes with a hard dark outline (`--dromos-scene-marker-line`). They keep the same colours at dawn, dusk and night, so they ignore the painting's light.
  - **No painted sprite:** the walker has 12 stages (`STAGE_IDS`) plus the skills' objects, so a painted sprite per combination is not practical.
  - **Restyle instead:** the drawing is restyled. Each variant is tried as CSS or markup overrides in a scratch mockup.
  - **Cost limit:** the walker always breathes and its sash stirs, so a filter on it would repaint every frame. The light of the hour has to come from colour tokens per period instead.
- **L9** (2026-11-26): the T4 samples are done. They are the night and day loops with motion: 1600 × 500, 15 fps, 10 s, VP8 WebM, 375 and 391 KB. Copies are at `~/Downloads/dromos-paisaje/muestra-noche.webm` and `muestra-dia.webm`.
  - **Both:** the smoke rises and waves, the clouds sway and roll, the sails make a quarter turn per loop, and one gust of breeze crosses the meadow, the cypresses and the tree.
  - **Night:** the stars twinkle, the painted fireflies pulse and 7 more drift, the windows and the doorway flicker, and the moon's halo breathes.
  - **Day:** the sun's glow breathes, and two tiny birds circle out from behind a cloud.
  - **Still:** the "what moves" map shows nothing moving on the road, the gate, the campfire's spot, the walker's way or the figures (0 pixels before encoding). The parent checked the night sheet.
  - **Accuracy:**
    - **Frame 0 against the painting:** mean 0.54 and max 18 levels.
    - **Seam:** at the loop point the codec's noise resets, about 1 level in moving areas.
    - **Colour bias:** ffmpeg's default conversion darkened the video by 1.1 levels, fixed with `accurate_rnd`.
  - **Flaw:** in the middle of each quarter turn the sails cross-fade, because the four painted sails differ. At 2× this shows doubled edges; at screen size (a 45 px windmill) it is a slight softening. It can be switched off per preset.
  - **CPU:** median of 3 runs, the video alone in the 1160 × 363 box.

    | Video | CPU (% of one core) |
    |---|---|
    | 1280 × 400 @12 | 3.9 |
    | 1600 × 500 @15 | 5.1 |
    | night sample | 5.2 |
    | day sample | 5.0 |

    - **Against today:** today's landscape animations cost about 11.6 % (Home 11.8 % against 0.2 % under reduced motion, letter-art L3), so a painted Home with one loop should cost about half.
    - **Still to do:** measure the real painted Home with its loop once the loops are final.
  - **Tool:** scratch `landscape-art/motion/tools/motion.py`, with a preset per painting. Dawn and dusk copy the day preset. The Shop needs its own preset.
- **L10** (2026-11-26): the T6 mockup is done. Three variants were rendered on the real `HomeScreen` with the four paintings. All three apply only over a painting: they take the light of the hour, the lantern is lit at night, and the staff becomes wood.
  - **A, fine line:** CSS only. The outline becomes a 0.7 line in a darker shade of each part's colour, the fills stay flat, and the shadow is softer and falls to the right.
  - **B, painted light:** CSS plus gradients from a new `FigureShading`. There is no outline. The figures are lit on the left and shaded on the right, and at night the lantern warms them. It blends best, but at 360 px the walker blurs into the road.
  - **C, ink and wash:** B with a 0.55 line. The worker recommends it: it blends almost as well as B and still reads at 360 px.
  - **Checks:**
    - **Stages:** all 12 render with three objects each.
    - **Motion:** the animations keep running, and reduced motion stops them as today. No figure carries a filter.
    - **CPU:** current and C both average 2.9 % at dusk on the painted Home.
    - **Without a painting:** the computed styles are identical in 42 of 42 cases. Screenshots were unreliable because of animation timing.
  - **Weak points:**
    - The shading is subtle at real size; the colour of the hour does most of the work.
    - At night the walker contrasts less with the gate.
    - The walker is about twice the painted shepherd's size.
    - `color-mix` is new to `styles.css` and needs Chromium 111+.
  - **Pre-existing bug, found on the way and confirmed by the parent:** five hair and beard paths in `src/ui/atoms/avatar/WalkerFigure.tsx` end with an incomplete cubic (`temples` ends with 2 numbers instead of 6), so Chrome logs "Expected number" and drops the segment. They are the `temples`, `thinning` and `sage` hair and the `grey` and `white` beards. Proposed: fix them in T6's code.
  - **Files:**
    - The combined image for the user is `~/Downloads/dromos-paisaje/caminante-variantes.png`.
    - The mockup page, sheets and patches are in scratch `walker-style/`, with one `patch-<variant>.md` each.
- **L11** (2026-11-26, user): I asked "¿Avanzo con la variante C para el caminante y con el movimiento de las muestras para hacer el resto de los videos?" and the user answered "si dale".
  - **T6:** variant C goes into the code, with the five malformed paths fixed.
  - **T4:** the dawn, dusk and Shop loops are made with the same motion. The night and day samples are final. The Shop's new loops replace its light-only loops in the vault, after the parent checks them.
  - **Route:** two parallel units with disjoint surfaces, launched together. T6 is a repo writer; T4 is a scratch worker that writes nothing into the repo or the vault.
- **L12** (2026-11-26, user): "que tanta posibilidad o que dices si mejor no hacemos las variantes con codigo sino que lo hacemos imagens png de solo el caminante con sus variantes y sus etapas? O seria muy dificil?"
  - **My answer:**
    - A painted walker means 12 consistent stages and 14 objects at 10 spots, up to 3 at once. Gemini also gives no transparency, and an image cannot take the light of the hour without four versions or a filter.
    - At 45-70 px on screen, most of the gain is what variant C already fixes.
    - Proposal: let C finish, then a pilot with a single painted stage, set beside C at real size, before deciding on the full set.
  - **User:** "chat podriams mostrame los 14 objetos de la skill porfavor" and "si dame el prompt a ver que tal".
  - **The user's stage:** the runner, at level 3 with game_start 2026-11-01. The wayfarer asks for level 3 and 30 days.
  - **Images made** from the committed fded82c snapshot (scratch `objects/`):
    - `~/Downloads/dromos-paisaje/objetos-skills.png`: each object alone, on the plaque's bust and on the walker (pilgrim stage).
    - `~/Downloads/dromos-paisaje/caminante-guia.png`: the runner without objects, as the pose guide for the pilot.
  - **T7:** the painted walker pilot, waiting for the user's painting.
- **L13** (2026-11-26):
  - **T6 is done.**
    - **Commits:** f84db45 fixes the five cut paths, with a test that every path of every stage and object has whole argument groups. dd735af adds variant C: `FigureShading` plus about 180 lines of CSS inside `@supports (color: color-mix(...))`. A plain fallback line would never apply, since each `color-mix()` holds a `var()`.
    - **Checks:** 2658 tests pass (re-run by the parent), lint has 0 errors and the build passes.
    - **S5:** 48 of 48 screenshots are byte-identical, and 16 of 16 for the drawn theme of a one-theme painting.
    - **Painted shots:** they match the mockup's C within 3 levels.
  - **T7 pilot:** the user painted the runner in Gemini from `caminante-guia.png` and the day painting ("este fue el resultado", 1696 × 2528 on green).
    - **Prepared:** it was keyed out of the green with no halo (scratch `pilot/tools/key.py`). It was graded offline for dawn, dusk and night, with the lantern kept warm at night (`pilot/tools/tint.py`), so the page needs no filter.
    - **Compared:** it was set in the walker's own box on the real `HomeScreen` at fded82c with the four paintings, beside today's walker and variant C, at the four hours, at 1160 and 360 px, at 2×.
    - **Verdict:** at real size the painted walker belongs to the painting far more than C does. My earlier claim that the brushwork would not show at 45-70 px was wrong.
    - **Tuning:** it sits a little smaller than the drawn one, because it is fitted inside the drawn walker's box.
    - **File for the user:** `~/Downloads/dromos-paisaje/caminante-pintado-prueba.png`.
  - **For the full set:**
    - 12 stage paintings, from per-stage pose guides that I render.
    - One painted sheet of the 14 objects, cut and placed at the existing anchors.
    - The light of the hour graded without filters.
    - Variant C stays for any stage without a painting, and for the gate and the campfire.
- **L14** (2026-11-26): T4 is done. The four new loops were made with the same tool and settings as the approved samples.
  - **Dawn** (1600 × 500, 15 fps, 10 s, 393 KB): new drifting mist over the painted mist, four windows glowing, smoke, clouds, sails, breeze, and the sun's glow. Birds were dropped.
  - **Dusk** (410 KB): eight lights flickering, heavy smoke, clouds, sails, breeze, and the sun's glow. Fireflies were dropped.
  - **Shop by day** (1476 × 408, the painting's exact ratio, 371 KB): the awning's hem, the cloud, the palm and the cloth sway, and dust motes glint in the shade.
  - **Shop by night** (577 KB): the flames lick, the lamp halos breathe, motes drift, 12 stars twinkle, and the hem, palm and cloth sway.
  - **What stays still:** the merchant, the temple, the counter, the scale and the coins. Nothing moves under the wide-pane plaque; the phone's plaque area moves at 35 %.
  - **Checks:**
    - **Still areas:** 0 moving pixels before encoding, in all four loops.
    - **Frame 0 against the painting:** a mean of 0.66-0.90 levels.
    - **Seams:** within each loop's largest ordinary frame step.
    - **Windmill:** the sails now settle onto the painting in the first and last 6 % of the loop.
  - **Parent check:** the Shop-by-night sheet. The merchant and temple stay still; the lamps, hem and motes move.
  - **S3 measurement:** median of 3 runs, the real `HomeScreen` at 395cefc, dark theme at night.

    | Case | CPU (% of one core) |
    |---|---|
    | Home, drawn | 18.4 |
    | Home, painted, no loop | 4.2 |
    | Home, painted, with its loop | 7.7 |
    | Shop by day, old loop | 8.0 |
    | Shop by day, new loop | 4.6 |
    | Shop by night, old loop | 7.1 |
    | Shop by night, new loop | 4.8 |

    - **The harness:** a production bundle with 62 running CSS animations, so the drawn Home reads higher than letter-art L3's 11.8 %. Both arms of each comparison were measured the same way.
    - **Result:** the painted Home with its loop costs less than half of today's.
  - **Vault:** all six loops are in `Dromos/Arte/`. The Shop's new loops replace the old ones and show at once in 0.27.0. The old ones are kept in scratch `landscape-art/motion/old-shop/`. The landscape loops wait for this branch's release.
- **L15** (2026-11-26, user): to "¿vamos con el set completo pintado?" the user answered "si dale armame todo y lo voy sacando, dime el paso a paso para generarlas con gemini". The kit is in `~/Downloads/dromos-caminante/`:
  - **Guides:** `guias/01-corredor.png` … `12-sabio.png`, the walker of each stage without objects. They were rendered from a HEAD snapshot (68b7c68) at 1000 × 1500 (2:3) in a scratch harness (`walker-set/`).
  - **Objects guide:** `objetos-guia.png`, the 14 objects in a 5 × 3 grid on mid grey, so the cream scrolls show. The order is in scratch `walker-set/objects-order.json`.
  - **Reference:** `referencia-corredor.jpeg`, the painted runner, used as the identity and style reference for every stage.
  - **Prompts:** `prompts.md`, one prompt per stage from 02 to 12, and one for the object sheet.
    - **Stage prompts:** each repeats the runner's identity, the pose of its guide, the stage's age, hair, beard and clothes from `STAGE_LOOKS`, and a flat green background.
    - **Object sheet:** it gets a magenta background, because the olive wreath is green.
- **L16** (2026-11-26, user): sent 12 stage paintings and the object sheet. The user wrote "estan enumerados por  etapa, pero creo que me salte el 7 jaja, entonces desde el 8 hacia arriba hay que restarle 1".
  - **Mapping:** 1-6 are the runner through the traveller, and 8-13 are the student through the sage. The object sheet is `Gemini_Generated_Image_2dp5le2dp5le2dp5.jpeg`.
  - **Cut-outs:**
    - **Stages:** all 12 key out cleanly from the green (scratch `walker-set/cut/`).
    - **Objects:** the 14 were cut cell by cell in the guide's order, keyed from the magenta by min(r,b) - g with the spill capped (`walker-set/tools/objects.py`, output in `cut/objects/`).
    - **Lineup:** `~/Downloads/dromos-caminante/recortados.png`.
  - **Flaws:**
    - **No satchel:** stages 03-06 (pilgrim, apprentice, disciple, traveller) have no satchel and no strap, though their guides do. The `satchel` spot (lector) and the `strap` spot (escriba, labiolector) would float there, so these four are to be redone as edits adding the satchel.
    - **Elder:** he stands upright, although his guide stoops. This is accepted.
  - **Route:** T8's code and image preparation are delegated to one background writer, by the context backstop. The writer leaves the code uncommitted and its prepared files in scratch. The parent checks them, then copies them into the vault.

