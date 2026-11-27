# Night illustrations: the Library's and the Shop's paintings follow the night, the interface does not

Objective: in the light theme, from 21:00 to 05:00, the Library's scenes and the Shop show the user's night paintings and loops, as the landscape already does, while the interface (cards, plates, text, buttons) keeps the light theme. Obsidian does not change.
Branch `feat/night-illustrations` from `main` `76ff934` (0.29.0). Delivery: work-unit commits; merge and release only with the user's go-ahead. Runner: Vitest (`npm test`), then `npm run lint` and `npm run build`.

## Specs

The user's request (L1): "chat pregunta, en dromos la parte de arriba cambian dependiendo de la hora, es posible hacer esto, pero quizas mas global me refiero a que si se puede cambiar la apariencia a dark en la noche? Estaria muy genial todo eso", narrowed in L2 ("ok no tiene que ser obsidian quien cambie sino solo dromos") and changed in L5: "creo que no me termina de convencer, creo que lo correcto es que si solo cambien las ilustraciones, por ejemplo como esta ahora que cambia la tienda y el panel principal, tambien deberia cambiar la mesa y la imagen del shell de los libros, si pienso que mas bien cambien las ilustraciones que acompanan y no todo, esto hace que se sienta y se vea mejor a mi parecer".

- **S1 Only the illustrations change at night** (L5). In the light theme, at night, the scenes take their night look; the interface keeps the light theme: the plates and parchment under text, the cards, the panels, the text and the buttons. The dark theme is night at every hour already and does not change; the light theme by day does not change. Night is the existing `dayPeriod` night, 21:00 to 05:00.
- **S2 Which scenes** (L6: "los dos, y si dale con los cuatro puntos"): the Library's wall with its niches, the desk, the shelf, and the archive room. Assumption (L8): also the book and resource card, which opens over the desk, and the Shop's stall, as the user named the Shop among what already changes ("como esta ahora que cambia la tienda y el panel principal").
- **S3 With the user's paintings** (L8). At night in the light theme, each of those scenes shows its dark painting and its dark loop, as the landscape shows `landscape-dark`. A scene without a dark painting keeps its light painting, as the landscape keeps its day painting for a missing one. A scene without paintings keeps its drawing and the night touches it has today (the lamp, the candle, the window).
- **S4 Loops.** Reduced motion still hides every loop, and only the loop on screen plays (scene-video S3-S4).
- **S5 Readable.** Text never sits straight on a painting: it keeps its plate or parchment (painted-ui S6), with AA contrast over the night paintings.

## Tasks

| ID | Specs | Task | Route | Status | Commit |
|----|-------|------|-------|--------|--------|
| T0 | old S1-S6 | Mockups of the whole view dark at night | delegated; scratch only | done, superseded (L4, L5) | |
| T0b | old S1-S4 | Mockups of night colors for the drawn Library | delegated; scratch only | done, superseded by 0.24.0-0.29.0 (L8) | |
| T1 | S1-S5 | Night rules for the paintings and loops of the Library scenes and the Shop; the time of day passed to the book and resource cards; tests first; docs | inline | done (L9) | see L9 |
| V1 | S1-S5 | Independent verifier: Risk item 6 (a visual change no test would catch), with the user's real paintings | delegated verifier | done: S1-S5 PASS after one correction (L10, L11) | `8a6de5c` |
| M1 | S1-S5 | The user's look at night | the user | done (L12) | |
| R1 | S1-S5 | Merge and release 0.30.0 (minor: something new to see) | inline, with the user's go-ahead | released (L13); the check on the devices is not recorded | merge `acca5ef`, tag `0.30.0` on `ed95622`, release merge `507a258` |

## Log

- **L1** (2026-11-25, user): "chat pregunta, en dromos la parte de arriba cambian dependiendo de la hora, es posible hacer esto, pero quizas mas global me refiero a que si se puede cambiar la apariencia a dark en la noche? Estaria muy genial todo eso". The parent explained the Obsidian route ("Adapt to system" plus the OS schedule) and advised against a plugin changing Obsidian's theme.
- **L2** (2026-11-25, user): "ok no tiene que ser obsidian quien cambie sino solo dromos". The parent noted that this is a new feature and that the vault's Dromos README says the project is paused since 2026-11-22 (pruning P10) until the freeze ends on 2026-12-22.
- **L3** (2026-11-25, user): "arranquemos ya", choosing to start now, as an exception to the freeze. Map, read inline:
  - `dayPeriod` (`src/ui/presenters/dayPeriod.ts`): night is 21:00 to 05:00.
  - Every light-theme rule in `styles.css` starts with `.theme-light .dromos-root`, 26 times; dark is the default on `.dromos-root`.
  - `dromos-root` is set on `DromosView`'s `contentEl` (`DromosView.tsx:32`) and on each card modal (`BookCardModal.tsx:39`).
  - `styles.css` borrows Obsidian's variables 29 times (`--text-muted` 11, `--text-warning` 5, `--text-error` 3, `--background-primary` 3, `--background-modifier-border` 3, `--text-faint` 2, `--text-success` 1, `--text-normal` 1). With Obsidian light they would stay light inside a dark Dromos.
- **L4** (2026-11-25): T0 by a mockup worker, scratch only; repository and vault unchanged. It used Obsidian 1.13.7's `app.css`, taken from `obsidian.asar`, and Material Gruvbox.
  - Real order: Obsidian inserts a plugin's `styles.css` before the theme's style, so the theme's `.theme-dark` overrode Dromos's re-pointed variables on the same element.
  - Fixes found: a night copy of the re-pointed variables on `.dromos-root.dromos-night`; `--icon-color` and `--raised-background` for the card's close button, whose X was invisible on the phone at 1.09:1; and the phone's scrollbar color.
  - With those (board F), all text passed AA, except the theme's own `#libro` tag, which already fails in Obsidian dark. Day and Obsidian-dark renders were pixel-identical.
  - There are 24 `.theme-light .dromos-root` selectors, not 26; two hits are comments.
  - Boards: scratchpad `night-dark-mockups/boards/`.
- **L5** (2026-11-25, user), after seeing the boards: "creo que no me termina de convencer, creo que lo correcto es que si solo cambien las ilustraciones, por ejemplo como esta ahora que cambia la tienda y el panel principal, tambien deberia cambiar la mesa y la imagen del shell de los libros, si pienso que mas bien cambien las ilustraciones que acompanan y no todo, esto hace que se sienta y se vea mejor a mi parecer". The specs were rewritten (S1-S4) and the whole-view approach is superseded. What the Library already does at night in the light theme: it lights the desk lamp and its glow (`styles.css:3696-3698`), hides the wall's light shaft (`:3598`), and shows the archive's moon, stars and candle (`:431`, `:4203-4204`). The stone, wood and niche colors stay daylight.
- **L6** (2026-11-25, user): "los dos, y si dale con los cuatro puntos", confirming that the shelf drawing is both the wall's niches and the open shelf, and that all four illustrations change. S2 is settled. T0b was delegated.
- **L7** (2026-11-26): T0b by a mockup worker, scratch only; repository and vault unchanged. A first run was cut by a usage limit and resumed. A reboot had cleared `/tmp`, so the harness was rebuilt, now with Obsidian 1.15.1's `app.css` (`~/.config/obsidian/obsidian-1.15.1.asar`) and Material Gruvbox, in Obsidian's real order.
  - Proposed block, scoped to `.theme-light .dromos-root .dromos-library[data-period='night']`:
    - the dark theme's illustration values, as hex, on the wall scene and on every drawing layer (stone face and joint, a lamplit niche `#33281e`, wood and edge, papyrus, lamp flame, halo and warmth), plus panel, tint and rule on the drawing layers only;
    - `--dromos-focus: #e8c98a` on the wall, desk and archive scenes;
    - the desk's and the archive's box colors;
    - the shelf's stone frame, arch shade and plank borders, leaving the shelf's parchment field.
    - `--dromos-wood` and `--dromos-papyrus` are never set on whole scenes, because the desk cards, the shelf's books and the archive buttons read them.
  - Checks:
    - no text changed contrast (room 5.27:1, archive 5.28:1 at the lowest);
    - day and dark-theme renders are pixel-identical (3 screens × 2 widths, with and without focus);
    - focus rings rose from 2.0-2.9:1 to 7.0-10.1:1 on dark stone and wood;
    - no light seams, and every niche goes dark.
  - Not ours: the shelf's row titles show Material Gruvbox's `--h3-color` (`#6c782e`) at 3.99:1, by day too, because `.dromos-shelf-row-title` sets no color.
  - The shelf is the subtlest night: a dark frame, arch and planks around its parchment. A stronger option, a dark field with parchment plaques under the titles and states, was not taken: it adds panels to the interface and needs night hover and focus colors.
  - Boards: scratchpad `night-illustrations/boards/`; the block in `night-illustrations/blocks/final.css`.
- **L8** (2026-11-26, user): "chat se me olvido decirte que cambiamos todo el tema y ya tenemos ilustraciones en casi todos lo lugares, si quieres puedes ver el repositorio". `main` was fast-forwarded to `76ff934`: 83 commits, 0.24.0 to 0.29.0.
  - What shipped there: own art for the wall, desk, shelf and archive, with plates on a painted shelf (0.24.0); scene loops (0.25.0); Shop art (0.26.0); Esdras's portrait and letter (0.27.0); the landscape in four paintings by time of day, and the painted walker (0.28.0); the painted card language, ground and signpost (0.29.0).
  - The vault's `Dromos/Arte/` has light and dark paintings and loops for `wall`, `desk`, `shelf`, `archive` and `shop`.
  - The Library and Shop paintings follow the theme, not the hour (`shop-art.md` L: "as in the Library, the painting follows the theme, not the hour"). The landscape follows the hour.
  - Paintings and loops are chosen in CSS only: `has-art-light`/`has-art-dark` with `--dromos-art-light`/`--dromos-art-dark` (`styles.css` ~4191-4196); videos by `.dromos-scene-video.is-light`/`.is-dark` (~4224-4240, with a reduced-motion block).
  - `SceneLayers` sets `data-period` only when given a `period`, which only the Shop passes. The Library scenes sit inside `.dromos-library[data-period]`, but the cards open in a modal with no period (`useLibraryCards.tsx`).
  - The drawn-color block of L7 and the boards of L4 and L7 are obsolete: every one of these scenes is painted. The specs were rewritten (S1-S5) and the feature renamed from `night-dark` to `night-illustrations`.
- **L9** (2026-11-26): T1 inline.
  - RED: `test/ui/components/nightIllustrations.test.tsx` had 6 of 7 failing (the four night rules, and the book and resource cards carrying `data-period`). The pin "leaves a scene with only a light painting, and every rule of the day, as they were" passed.
  - The test's own `mediaBlock` first read only the first `prefers-reduced-motion: no-preference` block; it now joins every block with that condition.
  - GREEN, four rules after the loops' rules in `styles.css`. They are scoped to `.theme-light .dromos-root :is(.dromos-library[data-period='night'] .dromos-library-scene, .dromos-library-scene[data-period='night']).has-art-dark`:
    - the background takes `--dromos-art-dark`;
    - the drawing hides, except on a card (`:not(.is-card)`), which keeps its rods;
    - the light loop hides;
    - the dark loop shows, but only inside `@media (prefers-reduced-motion: no-preference)`, so reduced motion still hides it.
  - Plumbing: `useLibraryCards` takes `period` from `LibraryPanel` and passes it to `BookCard` and `ResourceCard`, which hand it to `SceneLayers`. Without `period` a card's markup is unchanged.
  - Docs: `docs/own-art.md` (the rule, and the Shop's line about the hour), CHANGELOG Unreleased "Changed".
  - Checks: `npm test` 195 files, 2700 passed; lint 0 errors (4 old warnings); build passed.
  - Risk: item 6 (a visual change no unit test fully sees), so V1 runs in a real browser with the user's paintings.
- **L10** (2026-11-26): V1, in headless Chromium with the user's 20 paintings and loops, on `d8948a5` against `76ff934`. The repository and the vault were not modified.
  - Pixel diff: of 480 page pairs, 432 are identical. The 48 that differ are exactly the planned ones: light theme, night, scenes with a dark painting.
  - Text contrast is unchanged (every pairing within 0.05).
  - Live video run: at night in the light theme the dark loop plays and the light one pauses, and under reduced motion nothing plays.
  - The cascade's specificity was checked.
  - **B1, blocker, S2:** a book card opened from Home's reading desk (`ReadingDeskPanel.tsx:26`) called `useLibraryCards` without `period`, so it kept `desk-light` at night. **A1, strong advisory:** focus rings drawn outside their buttons fell on the dark paintings, for example the desk scroll from 3.05 to 2.18:1 and the archive door on a phone from 3.74 to 1.88:1. Minor advisories: Material Gruvbox's `--h3-color` under AA on parchment, already at the baseline, by day too; and `ruleOf` depending on the exact selector text.
  - One correction batch:
    - B1: `ReadingDeskPanel` takes `period`, and `HomeScreen` passes the one it computes (`HomeScreen.tsx:518`). This is hook plumbing with no runnable unit test (no DOM in Vitest), so it is left to the recheck.
    - A1: the five buttons whose ring lies outside them (alcove, desk scroll, shelf scroll, archive door, pigeonhole) take `outline-color: #e8c98a`, the dark theme's focus, at night on a dark painting. Rings on parchment keep theirs.
  - RED: 1 new test failed for A1. GREEN: 8 passed; `npm test` 195 files, 2701 passed; lint 0 errors; build passed. Next: a recheck limited to B1 and A1.
- **L11** (2026-11-26): The recheck, limited to B1 and A1 on `8a6de5c`, passed both.
  - B1: the real `ReadingDeskPanel` was mounted with the user's desk paintings and a card opened as on Home. At night in the light theme it shows `desk-dark.webp`, plays the dark loop and keeps its rods. By day, without `period` and in the dark theme it is as at the baseline.
  - A1: the focus rings over night paintings, median and 10th percentile:
    - alcove 3.16/2.44 → 11.04/8.52 (1546);
    - desk scroll 2.04/1.41 → 6.75/4.21 (390);
    - archive door 1.88/1.44 → 6.56/4.93 (390);
    - no ring pixel under 3:1.
  - 260 other focus clips (rings on parchment and plates, every other period, theme and painting set) are pixel-identical to `d8948a5`, and to `76ff934` outside the night case.
  - `npx vitest run` 2701 passed, tsc and eslint clean.
  - The branch build was installed into the vault for M1 with `DROMOS_VAULT=/home/nickgv/Documents/logos`.
- **L12** (2026-11-26, user): "bien me parece bien me gusta", after seeing it installed at night, answering "Cuando lo veas, contame si te convence. Si te gusta, lo publico como 0.30.0". M1 is done and R1 has the go-ahead.
- **L13** (2026-11-26): R1. A fetch first found nothing new on `origin/main`. `feat/night-illustrations` was merged into `main` with `--no-ff` (`acca5ef`). On `release/0.30.0`, the CHANGELOG's Unreleased became "0.30.0 - 2026-11-26" (`2ab51ff`), and `npm version minor` tagged `0.30.0` (`ed95622`); it was merged into `main` (`507a258`). On `main` before pushing: 2701 tests passed, lint 0 errors (4 old warnings), build passed. GitHub: the "Release Obsidian plugin" run for `0.30.0` and the "Node.js build" run on `main` both succeeded; release 0.30.0 is published and Latest, with `main.js`, `manifest.json` and `styles.css`. Not recorded: BRAT updating the devices.
- **L14** (2026-11-27, user): "si dale, arregla lo del contraste de los títulos", then "si" to publishing. V1's advisory A2 is fixed. `.dromos-shelf-row-title` and `.dromos-book-section-heading` had no color and took the theme's `--h3-color` (Material Gruvbox `#6c782e`, 3.75-4.43:1 on parchment); they now set `color: var(--dromos-ink)`, as `.dromos-card-title` does, at 10.7-11.9:1 in the light theme and 12.7-14.0:1 in the dark one. Tests in `test/ui/components/headingInk.test.tsx`: 2 RED, then GREEN. The full suite (2704), lint and build passed. Released as 0.30.1 (patch): fix `2d227e0`, merge `e700160`, tag `0.30.1` on `fef2ebd`, release merge `b09a671`. The release run and the `main` build both succeeded, and 0.30.1 is Latest.
