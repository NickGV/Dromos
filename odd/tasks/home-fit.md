# The home screen in one view

Objective: on the user's desktop pane (about 1546 × 970 px of view) the Path screen shows everything without scrolling, by folding the campaigns and tightening the letter, the quests, the reading desk, the chronicle and the landscape.
Branch `feat/home-fit`. Delivery: work-unit commits, `--no-ff` merge into `main` and release only with the user's go-ahead. Runner: Vitest (`npm test`), then `npm run lint` and `npm run build`.

## Specs

The user's request: "chat sabes que podemos hacer para quizas lograr que se pueda ver en el path todo sin necesitdad de hacedr scroll, que las campains se puedan collapsar". Measured (L2): the home is 1884 px tall in a 970 px view; the landscape 380, the letter 289, the quests 604, the campaigns 864, the desk 237, the chronicle 263. Claude proposed four changes and the user approved all four: "si dale porfavor" (L3). S1-S4 are those four, in the proposal's words.

- **S1 Foldable campaigns.** "Campañas plegables: cerradas, cada una ocupa una sola fila, con nombre, sello o "3 de 7", una barra fina y el próximo paso. Al tocarla se abre el camino completo. Se recuerda en el dispositivo cuáles dejaste abiertas."
  - On the home screen only (the Campaigns screen keeps its cards as they are). Folded by default. A folded card: the name, the clay stalled seal or the task count, one thin overall progress bar, and "Next step · …", in about 64 px. The header row is the toggle (a button with `aria-expanded` and a chevron); open, the card shows its road as today and a way to open the campaign on the Campaigns screen (today the whole card does that). Which ones are open is remembered on this device, in the device store the view already uses.
- **S2 A compact desk and chronicle.** "Mesita y crónica más compactas: el libro en una línea, sin el dibujo grande del pergamino, y la crónica con las últimas 3 en vez de 5, con "Ver más"."
  - On the home screen the reading desk shows each book on one line (a small scroll mark, the title, the author, "Reading for N days"), still opening its card on selection; the Library's desk is unchanged. The chronicle shows its three newest deeds, and "View more" shows the rest it shows today (five).
- **S3 Four quests.** "Quests: 4 visibles en vez de 6, y el resto en "View more" como ahora."
  - Today's quests fold to four rows instead of six (this changes missions S3's six); "View more (N)" and the filters work as today.
- **S4 A slimmer letter and a lower landscape.** "Carta más finita y paisaje de 320 px en el inicio: la carta cerrada muestra solo la misión y el botón para leerla, y el paisaje deja de crecer hasta 380. La placa entra igual."
  - The folded letter shows its head line ("Letter from Esdras · today", the seal when new), the mission and its buttons; the closest skill and the first two lines of the text move into the unfolded letter. The landscape is about 320 px at the user's width instead of 380, never so low that the character plaque (279 px with its margins) or the walker, the gate and its plaque stop fitting, at any width from 320 to 2560 px.
- **Acceptance.** With the user's data (three to four campaigns, 13 quests, one letter, one book being read, five deeds), the home at 1546 × 970 needs little or no scroll: about 1000 px or less in all. Every element keeps its keyboard and screen-reader behavior.

## Tasks

| ID | Specs | Task | Route | Status | Commit |
|----|-------|------|-------|--------|--------|
| T1 | S1-S4 | The four changes, one commit per spec where they stand apart | delegated, writer E (context backstop: the parent session is long) | done (L4); acceptance short by about 135 px (L5) | `9dab41a`, `e765cf0`, `d369c89`, `23b6f07` |
| T2 | S1-S4 | Seam check, live measure in Obsidian, README and CHANGELOG, dev build | inline | done (L5) | docs (this commit) |
| R1 | | Release with the user's go-ahead | inline | pending | |

## Log

- **L1** (2026-11-10, user): "chat sabes que podemos hacer para quizas lograr que se pueda ver en el path todo sin necesitdad de hacedr scroll, que las campains se puedan collapsar".
- **L2** (2026-11-10): measured in Obsidian on 0.14.0: view 1546 × 970; home 1884 px tall; landscape 380, letter 289, quests 604, campaigns 864 (three cards of about 200-310), desk 237, chronicle 263. The right column (1364) and the left (893) both pass the 590 px left under the landscape.
- **L3** (2026-11-10, user): "si dale porfavor", to the four-point proposal (S1-S4), with Claude's recommendation to do all four.
- **L4** (2026-11-10): writer E finished T1: S1 `9dab41a` (home campaign cards folded to one row, toggle in the `h3` with `aria-expanded`, **Open campaign** inside, the open set per device under `home-campaigns-open`), S2 `e765cf0` (one-line home desk, chronicle of three with **View more (2)**), S3 `d369c89` (`QUEST_LIMIT` 4), S4 `23b6f07` (folded letter: head line, mission, buttons; the closest skill inside the letter; the excerpt and `excerptOf` removed; the scene 300 px up to 960 px wide, 320 px from 1024, back to 380 only between about 1862 and 2211 px; the sky group's shift re-tuned and the ridge hidden from 1783 px so the sun and clouds are not cut). Its checks: 138 files, 1813 tests; lint 0 errors and the 4 old warnings; build ok. Preview: 1625 to 1116 px.
- **L5** (2026-11-10): T2. Seam check on the branch: 138 files, 1813 tests; lint 0 errors, 4 old warnings. Dev build installed and measured live at 1546 × 970: 1884 to 1105 px (scene 320, letter 200, quests 472, campaigns 277, desk 87, chronicle 229; left column 701, right 649). About 135 px of scroll remain: the fourth quest's foot and the two **View more** buttons. Closing it needs a denser quest row or three rows (beyond the approved S3): the user's call. README and CHANGELOG `[Unreleased]` written. Risk: item 6 (geometry by screenshots).
