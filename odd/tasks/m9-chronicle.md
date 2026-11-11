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
| T1 | S1 | The weekly history from the ledger rows, in the game result and snapshot | delegated, writer F (context backstop: the parent session is long) | pending | |
| T2 | S2, S3 | The Chronicle screen, its charts and the way in from home | delegated, writer F (depends on T1) | pending | |
| T3 | S1-S3 | Seam check, live check in Obsidian, README, CHANGELOG, vault ticks | inline | pending | |
| R1 | S4 | Release with the user's go-ahead | inline | pending | |

## Log

- **L1** (2026-11-11, user): "hagamoslo porfavor", to Claude's recommendation: "Mi recomendación es arrancar con el historial de XP por semana."
- **L2** (2026-11-11, user): "1", the Chronicle screen opened from the home chronicle, among three options (a Chronicle screen, a section of the Skills screen, a sixth plank).
- **L3** (2026-11-11): M9 written into the vault's `02-Phases.md` (objective, tasks, done criteria; M8 and M9 rows added to the milestones table).
