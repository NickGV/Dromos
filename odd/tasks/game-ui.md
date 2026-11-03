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
  - Scene height: 300 px on the home screen, 220 px on narrow views (every screen, L15) and 170 px on the other screens on wider panes. Dark themes get a night variant.
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

- **S13 Collapsible briefing** (L10: "el brief estaria bien que se pueda collapsar, porque siempre es bastante largo")
  - **Collapsed** shows:
    - a top line: "Letter from Esdras · today", or "Last letter · 2 Nov" when it is from another day;
    - the mission title, cut at two lines;
    - "Closest skill · <name> · <progress>";
    - a two-line muted excerpt of Esdras's text;
    - a row with a disclosure button on the left ("Read the letter · N min") and "— Esdras" on the right.
  - **Expanded** adds the mission's why, what the skill asks, the full body and the footer, ending with a second "Fold the letter" button. That button sends focus back to the top toggle.
  - **State.**
    - It opens collapsed every time; the open state lives in memory only.
    - A letter not opened yet on this device carries an ochre wax seal and "New letter"; opening it marks it read.
    - The read mark (letter date plus a hash of the body) is kept per device through a new port. Its Obsidian adapter guards `app.loadLocalStorage` / `saveLocalStorage` at runtime, because they appeared after `minAppVersion`, and falls back to memory.
    - Never in a vault note or `data.json`.
  - **Accessibility:** the control is a `<button aria-expanded aria-controls>`, not `<details>`. The markdown stays mounted.
  - **Motion:** the letter unrolls (`grid-template-rows` 0fr → 1fr, about 280 ms); under reduced motion there is no transition.
  - When the letter is old or missing, "Copy briefing command" moves into the collapsed row.
- **S14 Polish** (from the UI/UX review, L11):
  - **Contrast.** Links, unresolved and external links, and inline code inside the briefing use the parchment palette at AA, because Obsidian resolves `--link-color` on `body`.
  - **Mission text.** Raw backticks in the mission's why are shown as code, not as backticks.
  - **Line length.** The briefing text and the mission are at most about 36em wide.
  - **Signpost.** It always shows its four planks in a fixed order; the current screen's plank is marked burnt in, with `aria-current="page"`.
  - **Wording.**
    - The campaign road is "The route" / "La ruta", so "Camino" is only home.
    - A quiet line under the quests says "Complete quests in Habitica · Dromos picks them up on sync".
    - Skill dates use the short date format of the campaigns.
  - **Offline.** While offline, the card's sync line shows only Sync.
  - **Phone layout.**
    - The character title does not break mid-phrase.
    - The briefing seal sits inline with its top line.
- **S15 Since your last visit** (L11)
  - On open, after the game sync, the XP bar fills from the value last seen on this device.
  - A line shows what changed since then, for example "+45 XP since yesterday · Reader +15 · 2 quests".
  - The last-seen values are kept per device through the S13 port.
  - The first visit on a device shows no line and no animation.
  - Under reduced motion the bar shows its final value at once.
- **S16 The walker advances** (L11)
  - The figure in the scene stands along the path at `xpIntoLevel / xpToNext`.
  - A gate marked "Level N+1" stands at the path's end.
  - When XP rises, the walker walks to the new place, except under reduced motion.
- **S17 The world reacts** (L11)
  - When every daily is done ("Day complete"), a campfire lights up in the scene.
  - The sky follows the time of day from the clock (dawn, day, dusk, night) within each theme's palette.
  - Contrast of everything drawn over the scene keeps holding at every hour.
- **S18 Chronicle of deeds** (L11)
  - On home, a strip lists the last five deeds of the ledger, as a journal. Each deed is one task transition, with its skills grouped, for example "Yesterday · Read 20 pages · Reader +10 XP".
  - A revert reads as undone.
  - The data comes from the ledger rows `SyncGame` already reads, without a new request.

## Tasks

| ID | Specs | Scope | Route | Status | Commit |
|---|---|---|---|---|---|
| T1 | S6, S8, S9 (data) | Quest price and skill from the ledger pricing; the last ledger rows per skill; campaign deadline and task phase in the view models. Raw values only, no new copy | delegated W1 (parallel with T2, disjoint surfaces) | done: 18 tests RED then GREEN, 936/936, lint 0 errors and 4 warnings (the earlier ones), build ok; parent spot check (L4). Risk: none (`taskPrice` is a pure extraction; the rows the ledger writes are unchanged and pinned) | `392a5f2` |
| T2 | S1, S2, S10, S11 | Screens and signpost, design landscape, header card, embedded serif, parchment tokens light and dark, offline band | delegated W2 (parallel with T1) | done: 21 tests RED then GREEN, 958/958, lint 0 errors and 4 warnings, build ok, preview at 390 and 960 px light and dark (L5). Risk: item 6 | `a19de33` |
| T3 | S3, S4, S5, S6, S7, S9 (home) | Character card and ceremony, briefing scroll, quest panel, campaign cards, ring medallions | delegated W3, after T1 and T2 | done: 90 tests RED then GREEN, 1048/1048, lint 0 errors and 4 warnings, build ok, preview light and dark at 390 and 960 px, Spanish at 320 px (L6). Risk: item 6 | `6545418` |
| T4 | S8, S9 (screen) | Campaigns screen and skills screen | delegated W4, after T3 (sequential: it reuses T3's ring medallion and phase road, and both edit `styles.css`, `HomeScreen.tsx`, the i18n files and two presenters) | done: 74 tests (70 RED then GREEN, 4 pins of unchanged behavior), 1112/1112, lint 0 errors and 4 warnings, build ok, preview and a live click-through with counting fakes (L7). Risk: item 6 | `79d1698` |
| T5 | S1-S12 | Independent verifier over the preview harness and Obsidian's real `app.css` (Risk item 6: CSS no test catches) | delegated verifier | done: PASS on S3-S11 and the rest of S12; two blockers, B1 fixed and rechecked PASS, B2 recorded as a departure (L8) | `98d8b82` |
| T6 | S13, S14 (briefing parts: links and code, why, measure, phone seal) | Collapsible scroll, device-store port and its guarded adapter, link and code colors | delegated W6 (context backstop) | done: 9 rules RED then GREEN, 1157/1157, lint 0 errors and 4 warnings, build ok, preview with the real briefing and a live check (L12). Risk: item 6 | `7fdd81d` |
| T7 | S15, S16 | Since the last visit and the walker on the path; uses T6's port | delegated W7, after T6 | done: RED then GREEN per rule, 1214/1214, lint 0 errors and 4 warnings, build ok, 102 geometry cases and a live run (L13). Risk: item 6 | `c1ee881` |
| T8 | S17, S18, the rest of S14 | Campfire and time of day, chronicle strip and its data, fixed signpost planks, "The route", quest note, offline line, title wrap, short dates | delegated W8, after T7 | done: RED then GREEN per rule, 1256/1256, lint 0 errors and 4 warnings, build ok, 153 geometry cases, contrast at the four periods, a live check (L14). Risk: item 6 | `8b6e6fc` |
| T9 | S13-S18 and no regression of S1-S12 | Independent verifier (Risk item 6) | delegated verifier | done: PASS on S13-S18 and no regression of S1-S12; B1 and B2 fixed and rechecked PASS (L15, L16) | `d8856b0`, `98dc2e5` |

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
- **L10** (2026-11-03): User, after looking at the install: "si se ve bien, pero podriamos realizar algunas mejoras, por ejemplo el brief estaria bien que se pueda collapsar, porque siempre es bastante largo. instala la skill de https://impeccable.style/ porfavor y utiliza esta y las skills que tenemos para revisar el ui/UX para ver si lo dejamos asi o si lo hacemos mucho mejor". Impeccable was already installed globally at 4.7.0 and was updated to 4.8.0 with `npx skills update impeccable -g -y`. A read-only reviewer is running with Impeccable's critique and audit methods, `ux-heuristics` and `design-everyday-things`, against the rendered UI and the real briefing in the vault. Next: present its findings and the collapsible-briefing proposal, then implement what the user picks.
- **L11** (2026-11-03): UI/UX review (read-only) with Impeccable 4.8.0 critique and audit, `ux-heuristics` and `design-everyday-things`.
  - **Verdict:** polish plus a few bigger moves, no redesign. Nielsen score 26/40.
  - **Real briefing size:** 278 words, which renders 2,185 px tall on a 390 px phone; the quests start 3.2 screens down.
  - **New P1s:**
    - briefing links #8a5cf5 at 3.53:1;
    - the old-letter copy;
    - no reward on return.

  Asked which bigger ideas to add on top of the collapsible briefing and the polish. User: "El caminante avanza, El mundo reacciona, Crónica de hazañas, Desde tu última visita". That became S13 to S18 and T6 to T9.

  **Defaults taken from the review:**
  - the briefing opens collapsed every time, with a "New letter" seal;
  - "The route" for the campaign road.

  **Left for the vault:** the briefing's language. Esdras writes Spanish while the interface may be English, so the letter would need a `lang` field. That is a vault contract, to be agreed with Esdras and the user.
- **L12** (2026-11-03): T6 by W6. The real briefing folds from 2,185 px to 318 px on a 390 px phone.
  - **Storage.** `DeviceStore` port; `LocalDeviceStore` guards `loadLocalStorage` and falls back to memory, so on Obsidian before 1.8.7 the seal comes back after a restart. The mark is `dromos:briefing-read`: the letter's date plus a hash of its body.
  - **Live check.** Opening the letter writes the mark and removes the seal. The note renders once. "Fold the letter" sends focus back to the toggle. The open state survives a screen change, and a reload starts folded.
  - **Contrast, lowest light / dark.** Links 4.91 / 7.42, code 8.84 / 9.34, excerpt 5.67 / 6.23, seal fill 3.51 / 6.56.
  - **Departures:**
    - a "Why this mission" label over the why;
    - the closest skill is clipped while folded and shown in full when open;
    - the signature sits in one place per state;
    - the toggle ids come from a per-view counter, because two Dromos tabs could repeat `useId`.
  - **Reuse.** The short-date helper moved to `presenters/dates.ts`. Deadlines compared identical in 14 cases in both languages.
- **L13** (2026-11-03): T7 by W7.
  - **S15.**
    - Data: `GameSnapshot.completedQuests` counts the completions that still stand. The ledger's rows and notes are unchanged and pinned.
    - Record: `dromos:last-seen` in `DeviceStore`.
    - On open, the bar and the walker hold at the recorded value until the character is read again, then catch up in 1.2 s, and the line appears. Example: "+45 XP since yesterday · Reader +15 · … · 2 quests", with at most three skills, then "and N more", and reverts as "−10 XP".
    - It is announced once through a live region in the frame.
  - **S16.**
    - The walker moves along the road by arc length, its scale going from 1 to 0.7, towards a gate marked "Level N+1". It walks with requestAnimationFrame, with a two-step bob, and jumps when XP falls or under reduced motion.
    - At a level-up it reaches the gate first.
  - **Measurements.**
    - 102 geometry cases, from 320 to 1600 px: nothing collides with the signpost, with at least 5.9 px of clearance.
    - Contrast, lowest light / dark: line 4.91 / 7.42, plaque 10.7 / 12.65, gate 4.32 / 5.35.
  - **Departures.**
    - The walk starts 6 units up the road, so the feet clear the card.
    - The drawing is framed further left below 687 px, and below about 400 px on narrow panes, which shifts the L5 framing slightly.
    - On wide 170 px scenes the plaque is clamped inside the top.
    - In light, the walker and the gate get an ink outline, because umber on the hill is 2.08:1.
    - The record is rewritten on every open.
- **L14** (2026-11-03): T8 by W8.
  - **S17.**
    - A campfire is lit on "Day complete". It flickers, stays still under reduced motion, and shows on every screen.
    - The time of day comes from the clock, with no new timer: dawn from 05, day from 08, dusk from 18, night from 21. Each period changes the scene tokens, registered with `@property`, over 2 s.
    - Night in the light theme: a deep-blue sky, a moon, darker hills and a moonlit gate. The dark gate measured 1.3:1 on the blue sky.
  - **S18.** `recentDeeds` in `recentRows.ts` shares the ordering and `uniqueRows`. Each deed is one transition, with all its skills. The chronicle goes after the skills and shows nothing when there are no deeds. The rows and notes the ledger writes are pinned unchanged.
  - **Rest of S14.**
    - The signpost keeps four fixed planks; the current one is burnt in and carries `aria-current="page"`.
    - Labels and notes: "The route", the quest note, Sync only while offline, short skill dates.
    - The title holds one line from 390 px. At 320-360 px the level drops under it.
  - **Departures.**
    - A new darker `--dromos-plank-edge`: the design's umber was 2.08:1 on the hill, already before T8.
    - The focus ring has paper bands, keeping 5.13:1 on any background.
    - On the 170 px screens the planks are 28 px with 34 px targets, because four 44 px targets do not fit in 134 px; WCAG AA asks for 24 px.
  - **Measurements.**
    - 153 geometry cases with no collision.
    - Lowest contrast: plaque edge 3.35 (light dusk), campfire 3.22 (light night offline), text 4.85.
  - **Commit.** About 1,250 authored lines in one commit. The data, the scene and the polish all meet in `HomeScreen.tsx`, `styles.css` and the i18n files.
- **L15** (2026-11-03): T9. The independent verifier checked `8b6e6fc` against `98d8b82`.
  - **PASS:** S13, S15, S16, S17 and S18.
  - **Unchanged from the baseline:**
    - Requests: the same calls, and none on switching screens.
    - Ledger: rows and notes byte-identical in the differential `SyncGame` run.
    - Headings and `lang`.
    - The ceremony timeline.
    - Layout: 326 cases.
  - **B1:** going offline was no longer announced. The offline sync line had dropped the banner, and with it its live region.
    - First correction (`d8856b0`) rendered a standalone live region while offline. The recheck failed: a region inserted already holding its text is unreliably announced.
    - Second correction: `StatusBanner` stays mounted with `quiet`. That hides its text and keeps its live region in the same slot. A markup test pins the same element shape across syncing and offline.
  - **B2:** the plank targets were 33 px on the 170 px screens, under the 44 px of S11. Asked "¿Cómo lo resolvemos?" and the user answered "Paisaje de 220 px (Recomendado)". On narrow views every screen now gets the 220 px scene, so its four planks keep 44 px targets. Wider panes keep 170 px. S1 is updated.
  - **Advisories, left as they are:**
    - On wide 170 px screens (about 1150 px and up) the slice crops the lintel and the walker's head. The baseline figure was cropped from about 1350 px.
    - On a first visit the walker may still walk after the sync.
    - The ribbon kicker and the Spanish "detenida" seal are as at the baseline.
    - The walker's shadow sits 1.8 px under the card at walk 0.
    - A ledger skill with no note shows its id.
    - The current plank differs from the others only by tone, 1.4:1; `aria-current` carries the meaning.
- **L16** (2026-11-03): The recheck limited to B1 and B2 at `98dc2e5` passed.
  - **B1:** one `role="status"` element lasts through syncing, offline, syncing and offline again; only its text changes. While offline the visible line is Sync only. The synced, syncing and error markup is byte-identical to `8b6e6fc`.
  - **B2:** on narrow panes the campaigns and skills screens have the 220 px scene and 44 px plank targets, with no collision in 108 cases. The 170 px scene is unchanged at 760 and 960 px.

  User: "dale, instalalo cuando pase y sube la version para verlo en android tambien". Release 0.8.0 (minor: new things the user can use) from `feat/game-ui`, as 0.7.0 was from `feat/calm-ui`; then a local install.
