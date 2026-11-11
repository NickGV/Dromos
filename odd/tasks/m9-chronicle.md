# M9 · La crónica: the XP history by week

Objective: a Chronicle screen, opened from the home chronicle, with the XP of each week, the days of a week and where its XP went, computed from the ledger Dromos already keeps. Vault plan: `02 - Projects/Dromos/02-Phases.md`, M9.
Branch `feat/m9-chronicle`. Delivery: work-unit commits, `--no-ff` merge into `main` and release only with the user's go-ahead. Runner: Vitest (`npm test`), then `npm run lint` and `npm run build`.

## Specs

The user chose the module: "hagamoslo porfavor" (L1), to Claude's recommendation of the weekly XP history. Claude proposed what it shows: "Barras de XP por semana, de las últimas 12, con la semana actual resaltada y comparada con la anterior ("+40 XP más que la semana pasada")", "La semana actual por día, de lunes a domingo, para ver qué días rendiste", "En qué se fue la XP, por atributo o habilidad, para que se conecte con tu radar". The user picked where it lives: "1" (L2), the option "Una pantalla de la Crónica: la abrís desde la crónica del inicio con "Ver historial". Tiene el gráfico, la semana por día y la lista completa de logros. El cartel sigue con 5 tablas y la crónica pasa a ser la puerta a tu historia."

- **S1 The history from the ledger.** Every ledger row is read already by the game sync; the history comes from them, with no new request to Habitica and no write anywhere.
  - Weeks run Monday to Sunday on the ledger's local dates (assumption: Monday, as the user's locale counts weeks).
  - A week's XP is the character's XP as the game counts it: once per deed (one transition of a Habitica task, however many skill rows it wrote), a revert negative, a streak bonus counted, a streak bonus taken back negative.
  - Up to the last 12 weeks, ending with the current one, starting no earlier than the week of the first ledger row; weeks without deeds are 0.
  - For a week: the XP of each of its seven days; the XP of its skill rows grouped by the stat each skill feeds (the six stats, in the card's order), plus the XP of deeds with no skill; and its deeds, newest first, as the chronicle words them.
  - The sum of the weeks shown equals the character's XP over those weeks.
- **S2 The Chronicle screen.** "Una pantalla de la Crónica" with "el gráfico, la semana por día y la lista completa de logros".
  - The bars of the weeks, oldest on the left, the current week marked and selected when the screen opens, each bar a button named by its week and XP in words ("Week of 3 Nov: 120 XP"); a line comparing the selected week with the one before ("+40 XP vs the week before", or less, or the same; none for the first week).
  - For the selected week: its seven days as small bars with their XP (Monday first, today marked in the current week), its XP by stat, and its deeds (the whole week, newest first).
  - Every number in words for screen readers; light and dark themes; readable at 360 px. An empty ledger says so in a sentence instead of empty charts.
- **S3 The way in and out.** "la abrís desde la crónica del inicio con "Ver historial"" and "El cartel sigue con 5 tablas".
  - The home chronicle gets **View history** (Spanish **Ver historial**), also while the ledger has fewer than three deeds. The screen opens with its header card ("Chronicle") and **← Path** to go back, as a Library shelf leads back to the Library; the signpost keeps its five planks, with Path burnt in while the Chronicle is shown. All copy in English and Spanish.
- **S4 Release.** Publish the version and check it on desktop and Android, with the user's go-ahead.

## Tasks

| ID | Specs | Task | Route | Status | Commit |
|----|-------|------|-------|--------|--------|
| T1 | S1 | The weekly history from the ledger rows, in the game result and snapshot | delegated, writer F (context backstop: the parent session is long) | done (L4); user review pending | `ce57080` |
| T2 | S2, S3 | The Chronicle screen, its charts and the way in from home | delegated, writer F (depends on T1) | done (L4); user review pending | `3c027e5`, `67e9d92` |
| T3 | S1-S3 | Seam check, live check in Obsidian, README, CHANGELOG, vault ticks | inline | partial (L5): live check and vault ticks pending | docs (this commit) |
| R1 | S4 | Release with the user's go-ahead | inline | pending | |

## Log

- **L1** (2026-11-11, user): "hagamoslo porfavor", to Claude's recommendation: "Mi recomendación es arrancar con el historial de XP por semana."
- **L2** (2026-11-11, user): "1", the Chronicle screen opened from the home chronicle, among three options (a Chronicle screen, a section of the Skills screen, a sixth plank).
- **L3** (2026-11-11): M9 written into the vault's `02-Phases.md` (objective, tasks, done criteria; M8 and M9 rows added to the milestones table).
- **L4** (2026-11-11): writer F finished T1 and T2 (its first run stopped with the session; resumed on "continua"). `ce57080`: `weeklyHistory` (domain) into `GameResult.history` / `GameSnapshot.history`. `3c027e5`: the Chronicle screen (week bars as `aria-pressed` buttons named in words, the headline with the comparison in a live region, the days with today marked, XP by stat plus "No skill", the deeds; an empty-ledger sentence; a lighter `--dromos-bar-rest` token for unselected bars). `67e9d92`: **View history** under the home chronicle, the screen's header card with **← Path**, Path burnt in on the signpost. Its checks: 142 files, 1867 tests; lint 0 errors (4 old warnings); build ok. Decisions it flagged: XP by stat counts every skill row of a known skill, even before the skill unlocks, while the plaque's radar counts only XP after an unlock and adds no-skill dailies to Discipline; rows of a skill with no note count in the week but under no stat; a week can go below zero (a revert counts where it is written); unselected bars are below 3:1 contrast on purpose, their values in their names.
- **L5** (2026-11-11): T3 in part. Seam check: 142 files, 1867 tests; lint 0 errors and the 4 old warnings. Dev build installed into the vault, but Obsidian was not running (`obsidian plugin:reload`: "unable to find Obsidian"), so no live check yet. README (the Chronicle) and CHANGELOG `[Unreleased]` written. Pending: the live check, the user's review and the open question on XP by stat versus the radar.
- **L6** (2026-11-11, user): "se ve bien, dejemoslo como esta", to the open question of L4-L5. XP by stat stays as built (every skill row of a known skill, even before it unlocks, plus "No skill"), and the section keeps its title "By stat" (Claude's suggested rename not taken). Next: R1 (0.16.0, minor) when the user gives the go-ahead.
