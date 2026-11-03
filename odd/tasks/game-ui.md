# Game UI: the home view after the user's design

Objective: make Dromos look and feel like the user's design (`~/Downloads/Dromos.html`), using only data Dromos already has, without new game rules.
Branch: `feat/game-ui`, from `feat/calm-ui` at `3d3a28f` (calm-ui is released as 0.7.0 but not merged into `main` yet). Delivery: `single-pr`, merged into `main` without squash like M3 to M5. Tests: Vitest (`npm test`). Forecast: about 3,000 authored lines plus the embedded font.

## Design source

- The original file is `~/Downloads/Dromos.html`, a 7.5 MB bundle of seven boards.
- The unpacked copies are scratch and not durable. They live under `/tmp/claude-1000/-home-ngomez-Documents-dromos/ed2a5667-185e-4270-ab14-e70faa66e472/scratchpad/`, referred to below as `<scratch>`:
  - `<scratch>/design-src/unpacked/9db94996-a896-40b1-9840-ae21fbd30a77/template.html` holds the whole interactive component. It runs from the CSS classes (from about line 452), the scene and signpost (512-559), the home screen (561-698), the campaign screen (700-761), the skills screen (763-807), to the data and logic (840-1056).
  - `<scratch>/design-shots/board-1.png` to `board-7.png` are the screenshots: 1 home desktop, 2 campaign, 3 skills, 4 level-up, 5 settings, 6 offline, 7 Android 390.
  - `<scratch>/design-src/fonts/` holds `EBGaramond-normal-500.woff2` (a variable font, every upright weight) and `EBGaramond-italic-500.woff2`. Both are the latin subset, under the SIL OFL 1.1.

## Specs

The user's words are in L1 and L2. The items below describe the design boards. Assumptions are marked as such.

- **S1 Scene and navigation**
  - The design's landscape draws:
    - the sky, with a sun and three clouds that drift (60 s and 85 s);
    - birds, cypresses, a tree and a village;
    - three hills and a path;
    - the walking figure, with a staff and an ochre belt.
  - Scene height: 300 px on the home screen, 220 px on narrow views and 170 px on the other screens. Dark themes get a night variant.
  - The clouds stop under `prefers-reduced-motion`.
  - A signpost of wooden planks inside the scene leads to the other screens: "Camino" (home), "Campañas", "Skills" and "Ajustes". "Ajustes" opens the plugin's settings tab; assumption: the plank is hidden where that tab cannot be opened.
  - The view has three screens: home, campaigns and skills. The screens that are not home open with a header card, for example "Campañas · Kairos", showing "Nicolás · <title> · nivel 3 · 240 / 520 XP".
  - Changing screen scrolls to the top and moves focus to the screen's heading.
- **S2 Identity** (this amends calm-ui S2, "surfaces stay Obsidian's")
  - EB Garamond is embedded in `styles.css`. Its license stays in a comment.
  - Panels are parchment with the design's paper texture, hairline umber borders and 8 px corners.
  - Buttons follow the design: ochre for the primary one, linen for the others.
  - Light values come from the design: background `#FAF5EA`, panel `#F3E9D2`, border `#8B5E3C`, ink `#3B2F2A`, secondary `#7A6657`, ochre `#C9962B`, olive `#6E8B4E`, clay `#B5593C`, lock `#B8AFA3`.
  - A value is deepened only where text falls below 4.5:1 or a graphic that carries meaning falls below 3:1.
  - Dark themes get a night parchment with the same hues.
- **S3 Character card**
  - The card overlaps the scene. It shows:
    - a level medallion: a 72 px circle with the level number;
    - the name, in 34 px serif;
    - "<title> · nivel N" in small caps;
    - the hatched XP bar, with "X / Y XP".
  - Where the design says "Siguiente: <title>", the card says "Nivel N+1 en Z XP", because Dromos has no next title.
  - The six stats are drawn as six pips. Assumption: a value above 6 shows its number instead of the pips.
  - The sync line stays.
- **S4 Level-up ceremony**, from a character level event:
  1. The XP bar fills.
  2. The medallion turns ochre.
  3. A ribbon unfurls over the scene: "Nuevo nivel" above "Nivel N".
  4. A panel opens: "Has alcanzado el nivel N". It lists that sync's skill events (level and rank, unlocks) as small medallion rows.
  - A button closes the panel through `dismissGameEvents`.
  - There is no stat choice: L2 keeps the rules.
  - With reduced motion, the final state shows at once.
  - Skill events alone show the panel without the ribbon.
- **S5 Briefing as a scroll**
  - Rolled edges at the top and bottom.
  - A scroll icon in a circle.
  - The text in 21 px serif.
  - "— Esdras" in italics on the right.
  - The copy-command button as a secondary button.
  - The stale and notice states stay.
- **S6 Today's quests**
  - One panel, with a header line: "N de M diarias cumplidas", and "+X XP por ganar" or "Jornada completa".
  - Each row has:
    - the hand-drawn circle, with a check and a struck title when done;
    - chips for the kind ("Diaria" or "Tarea"), the skill, "+X XP", and the due label.
  - XP and skill come from the pricing the ledger uses, so the chip shows exactly what the ledger would write.
  - Rows are not buttons, since L2 rules out completing quests in Dromos.
- **S7 Campaign cards on the home screen**
  - A tinted header: the serif name, then the clay "detenida" seal or "N de M tareas".
  - The road: one segment per task, grouped by phase, with a gate dot between phases. The dot is ochre when the phase before it is complete.
  - Each phase's name and count sit under it.
  - "Siguiente paso · *x*", and "Sin avance hace N días" when the campaign is stale.
  - The card opens the campaigns screen on that campaign.
- **S8 Campaigns screen**
  - Pill tabs, one per campaign.
  - The header panel shows:
    - the kind, in small caps;
    - the name, in 46 px serif;
    - "Entrega <fecha> · faltan N días", or "Sin fecha de entrega";
    - the seal and the stale text.
  - The overall hatched bar, with "N de M tareas" and the next step.
  - "El camino": each phase with a flag, its segments and "N/M tareas".
  - "Tareas por fase": one panel per phase, with a row per task:
    - the circle and the title;
    - a state chip: Hecha, Siguiente, Pendiente, Sin enlazar or No encontrada;
    - "Enviar a Habitica" when the task can be sent.
  - The habits.
  - "Abrir nota" opens the campaign note.
- **S9 Skills**
  - On the home screen:
    - Ring medallions (88 px): the ring is the progress, with a level badge or a lock, the serif name and the caption.
    - A medallion opens the skills screen on that skill.
  - On the skills screen, the grid and a detail panel:
    - a big medallion, the name in 36 px, and the level or rank in small caps;
    - "Alimenta · <stat>";
    - the next-level bar ("X / Y XP"), or the requirements with their progress;
    - "Qué cuenta", the skill's description;
    - "Entradas recientes": the skill's last 5 ledger rows (task · ±XP · date), or "Aún sin entradas".
  - Assumption: an icon written as a lowercase icon name (for example `book-open`) is drawn with Obsidian's icons; an emoji stays an emoji.
- **S10 Offline**
  - While quests are offline, a band above the scene shows a lamp and "Último estado conocido · hace N", and the scene loses color.
  - The other failures keep the prominent banner.
- **S11 Narrow views**
  - Narrow views have one column, the 220 px scene, the signpost 14 px from the right, and 44 px targets.
  - Two columns from 760 px, as before.
- **S12 Accessibility kept**
  - Everything in calm-ui S1 keeps holding: contrast AA in light and dark, keyboard focus, `lang`, headings, and the sync live region.
  - Every new piece of copy exists in English and Spanish.

## Tasks

| ID | Specs | Scope | Route | Status | Commit |
|---|---|---|---|---|---|
| T1 | S6, S8, S9 (data) | Quest price and skill from the ledger pricing; the last ledger rows per skill; campaign deadline and task phase in the view models. Raw values only, no new copy | delegated W1 (parallel with T2, disjoint surfaces) | done: 18 tests RED then GREEN, 936/936, lint 0 errors and 4 warnings (the earlier ones), build ok; parent spot check (L4). Risk: none (`taskPrice` is a pure extraction; the rows the ledger writes are unchanged and pinned) | `392a5f2` |
| T2 | S1, S2, S10, S11 | Screens and signpost, design landscape, header card, embedded serif, parchment tokens light and dark, offline band | delegated W2 (parallel with T1) | done: 21 tests RED then GREEN, 958/958, lint 0 errors and 4 warnings, build ok, preview at 390 and 960 px light and dark (L5). Risk: item 6 | `a19de33` |
| T3 | S3, S4, S5, S6, S7, S9 (home) | Character card and ceremony, briefing scroll, quest panel, campaign cards, ring medallions | delegated W3, after T1 and T2 | done: 90 tests RED then GREEN, 1048/1048, lint 0 errors and 4 warnings, build ok, preview light and dark at 390 and 960 px, Spanish at 320 px (L6). Risk: item 6 | `6545418` |
| T4 | S8, S9 (screen) | Campaigns screen and skills screen | delegated W4, after T3 (sequential: it reuses T3's ring medallion and phase road, and both edit `styles.css`, `HomeScreen.tsx`, the i18n files and two presenters) | done: 74 tests (70 RED then GREEN, 4 pins of unchanged behavior), 1112/1112, lint 0 errors and 4 warnings, build ok, preview and a live click-through with counting fakes (L7). Risk: item 6 | `79d1698` |
| T5 | S1-S12 | Independent verifier over the preview harness and Obsidian's real `app.css` (Risk item 6: CSS no test catches) | delegated verifier | done: PASS on S3-S11 and the rest of S12; two blockers, B1 fixed and rechecked PASS, B2 recorded as a departure (L8) | this commit |

Route evidence: the parent context was about 120k tokens before T1, so the long-session backstop applies. T1 and T2 share no file. T3 and T4 share `styles.css`, `HomeScreen.tsx`, the i18n files and their components, so they run one after the other (L5).

## Log

- **L1** (2026-11-03): User: "chat la verdad es que como me lo hizo en este diseño se ve muy genial /home/ngomez/Downloads/Dromos.html estaria bien que nos copiemos, claramente mejorando la UX/UI sino que yo si quiero que lo habra y sienta que lo que estoy construyendo, lo que quiero aprender lo que se y demas si se ssienta como un videojuego de verdad".
- **L2** (2026-11-03): The design has three mechanics Dromos does not have, two of them against the vault rules:
  - choosing a stat at level-up, which goes against ADR-014 (stats are a projection of the ledger);
  - a +120 XP bonus for accepting Esdras's mission;
  - completing quests inside Dromos, which would be a new write to Habitica.

  Asked "¿Hasta dónde copiamos?". User: "Solo lo visual (Recomendado)", described as copying everything visible with real data, without changing the game rules.
- **L3** (2026-11-03): Data map (explorer). Already in the views: name, title, level, XP, six stats (no upper bound), campaign segments, tasks, stale days, next step, send, and skill level, rank, requirements and description.

  Missing, and wired in T1:
  - The XP and skill of a quest. `Quest` has no priority, `skillTags` holds raw tag ids, and pricing happens only inside `SyncGame`.
  - The ledger rows per skill, which `SyncGame` reads and then drops.
  - `Campaign.deadline` and each task's `phase`, both missing from `CampaignCardView`.

  Not available, so left out:
  - a next character title;
  - a link from the mission to a campaign;
  - completed to-dos in today's list, so the header counts dailies only.
- **L4** (2026-11-03): T1 by W1. `taskPrice` in `nextRows.ts` is now the one place the price of a completion comes from, and the rows the ledger writes are built from it. `SyncGame` prices every task it already fetched into `questPrices`, without a new request, and keeps each skill's last five rows in `recent`. The campaign card gains `deadline`, `daysLeft` (never NaN) and the `phase` of each task row; each segment gains its phase `id`, so T4 can group the tasks. Left out on purpose: the streak bonus is not in a quest's XP, because predicting it would mean guessing the streak.
- **L5** (2026-11-03): T2 by W2.
  - The view has three screens under one scene, with a signpost of planks. "Settings" uses a runtime-guarded `app.setting`; the dep is `null` and the plank hidden where that is missing.
  - The landscape is the design's, path for path, with token colors and a night variant. The clouds drift and stop with reduced motion.
  - The offline band: offline now keeps the sync line quiet, because the band says it.
  - EB Garamond is embedded with its OFL text; `styles.css` is about 137 KB.
  - Obsidian's variables are pointed at the parchment tokens inside `.dromos-root`, so the existing sections follow.
  - Values deepened from the design for contrast:
    - muted text #6F5B4C;
    - meaningful ochre fill #9A6E15;
    - olive #5F7A42;
    - clay text #A33F25.
  - Lowest measured values, light / dark: text 4.59 / 5.37, graphics 3.26 / 5.65.
  - The campaigns panel stays mounted on every screen, so switching screens spends no request.
  - Not checked in real Obsidian yet. T4 runs after T3, not in parallel: the two share components and files.
- **L6** (2026-11-03): T3 by W3. On the home screen:
  - the character card has a level medallion, pips (a number above 6) and "Level N+1 in Z XP";
  - the ceremony runs fill, then medal, then ribbon and panel, with its timing in `useCeremonyPhase`, the final state at once under reduced motion, and focus back to the name on dismiss. `LevelUpBanner` is deleted; the unlock toasts stay;
  - the briefing is a scroll;
  - the quest panel has chips, and its header counts dailies only. "+X XP to earn" is the sum of the pending dailies and stays blank while nothing is priced;
  - compact campaign cards open the campaigns screen (`selectedCampaign` in `HomeScreen`). The card is an `<article>` whose heading button is stretched over it, so the road stays readable to screen readers;
  - ring medallions open the skills screen.

  For T4: `RingMedallion`, `SkillRingButton` and `CampaignRoad` (`wide`).

  Deepened for contrast: the lock arc and the segments ahead go to #857b70 in light (3.43); the seal uses the clay ink #a33f25 (5.86). Lowest measured, light / dark: text 4.81 / 5.96, graphics 3.39 / 3.74.

  Not checked: real Obsidian and its icons inside the rings.
- **L7** (2026-11-03): T4 by W4.
  - **Campaigns screen.** Pill tabs (`aria-pressed`), then a header panel: kind, name, deadline in both languages, seal, stale text and "Open note". Below it come the hatched bar, "The path" on the wide road, "Tasks by phase" with state chips and sending, a "Without a phase" group, and the habits. `CampaignsPanel` draws the screen's header card, because only it knows the campaign's name.
  - **Skills screen.** A medallion grid (`aria-pressed`) and the detail panel in a polite live region: level or Locked, Feeds, the bar or the requirements, What counts, and Recent entries ("today", "yesterday", "N days ago", a revert as −XP).
  - **Requests.** Measured live with counting fakes: changing tab, screen or medallion spends no request, and send makes one `linkTask` and one reload.
  - **Deleted, unused now:** `CampaignList`, `CampaignCard`, `PhaseRoad`, `SkillsPanel`, `SkillCard`, `SkillMedallion` and their copy and CSS.
  - **Departures for contrast.** In light, the selected tab is the deep ochre #7a5a12 with paper text, because the design's ochre is 2.45:1 on the paper. The selected medallion tint is 0.12.
  - **Lowest contrast, light / dark.** Text 4.81 / 5.24; graphics 3.26 / 4.26.
  - **Next.** T5, the independent verifier.
- **L8** (2026-11-03): T5. The independent verifier checked `79d1698` against `3d3a28f` with the preview over Obsidian's real `app.css`:
  - 168 layout renders (7 scenarios × 6 widths × 2 themes × 2 languages);
  - a live click-through with counting fakes;
  - a differential `SyncGame` run.

  Results:
  - PASS on S3 to S11, and S12 apart from contrast.
  - 1112/1112, lint clean, build ok.
  - Opening the view makes the same calls as the baseline, and switching screens, tabs or medallions makes none.
  - The rows and notes the ledger writes are byte-identical to the baseline.

  **Two blockers.**
  - **B1:** light muted text on tinted surfaces measured 4.44 to 4.48:1 where both paper-grain layers cross. Fixed in one batch: the light `--dromos-ink-muted` goes from #6f5b4c to #665243. The recheck, limited to B1, gives at least 5.10:1 on desktop and phone, with dark unchanged. PASS.
  - **B2:** the home scene grows past 300 px on panes wider than the 960 px drawing, up to 380 px from about 1216 px. It is kept and recorded as a deliberate departure from S1: at a fixed 300 px the slice crops the sky away on wide panes (at 1600 px about 30 px of sky remain and the sun does not fit). The user can choose a fixed 300 px instead.

  **Advisories left.**
  - The ribbon's "New level" touches the band edge, which is the design's own geometry.
  - "detenida" crosses the seal's inner ring in Spanish, as in the design.
  - Screens use h2 headings with no h1, as at the baseline.
  - The skill detail is a new polite live region.
  - The chips reuse the strings "Sin vincular" and "No encontrada en Habitica".
  - The 44 px targets apply only on mobile.

  The contrast and layout probes need a browser, so they are not committed as unit tests; their scripts stay in the verifier's scratch (`/tmp/tmp.m5PuWcwZkz`).

  Not done: a look in real Obsidian, desktop and Android, including Obsidian's icons inside the rings and the settings plank.
- **L9** (2026-11-03): User, on installing into this PC's Obsidian: "si dale porfavor". The installed 0.7.0 files were first backed up to scratch (`backup-0.7.0/`). Then `npm run install:local` ran with `DROMOS_VAULT=~/Documents/Logos`, from `98d8b82`. `main.js` and `styles.css` in the vault are byte-identical to the build, and `data.json` is untouched. The manifest still says 0.7.0. Next: the user's look in Obsidian after a reload.
