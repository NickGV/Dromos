# Missions and "View more"

Objective: a Habitica task with several subtasks reads as a mission, and long task lists stop needing a long scroll.
Branch: `feat/missions`, stacked on `fix/open-on-startup-reload` · Delivery: `ask-on-risk` (local work units; nothing is pushed until the user allows it) · Runner: `npm test` (Vitest), plus `npm run lint` and `npm run build`.

## Specs

- **S1** — Missions: "Las tareas que tienen mas de cierta cantidad de subtareas deberia convertirse en una mision" … "porque hay tareas con subtareas, estas las podriamos llamar misiones, y las tareas sueltas solo tareas, o quizas hacer que si tiene por ejemplo 3 subtareas sean misiones". A Habitica daily or to-do with 3 or more checklist items is a mission: it carries a chip with its subtask progress, "Mission · 2/5" (es "Misión · 2/5"). With fewer than 3 it stays a task, as today.
- **S2** — Where and how far (the proposal the user accepted, "vamos con tu propuesta"): missions show in today's quests and in campaign tasks linked by `habitica_id`. Display only: XP and campaign progress do not change, because a phase "nunca sale del checklist de Habitica" (`04-Game-Design.md`) and checklist items are not campaign tasks (Q005).
- **S3** — "tambien las task cuando son muchas me toca hacer mucho scroll, estaria bien tener un limite de mostrar solo 5 o 6 y que se le pueda dar a view more". A list longer than 6 rows shows the first 6 and a "View more (N)" button that shows the rest; "View less" folds it back. It applies to today's quests and to each phase panel of the campaigns screen, and fetches nothing.
- **S4** — Naming and copy: "Mission" sits beside Esdras's existing "Mission of the day" (`briefing.mission`), which keeps its name (assumption A1). Copy in English and Spanish, Obsidian strings in sentence case.

Assumptions (mine, from "vamos con tu propuesta"; to be confirmed):
- **A1** — Both names coexist: Esdras's mission of the day is the task or mission he picks for today, so it is not renamed.
- **A2** — The threshold is 3, the user's own example; the limit is 6, the upper end of "5 o 6".
- **A3** — A malformed checklist from Habitica reads as no checklist instead of rejecting the task list: it is display only.

## Tasks

| ID | Specs | Scope | Route | Status | Commit |
|---|---|---|---|---|---|
| U1 | S1, S2, S4 | Missions in today's quests: `checklist` read from Habitica, `Quest.checklist`, `isMission` in the domain, the chip in `questListView` and `QuestItem`, copy, styles | inline (shares presenters with U3; no writer reason) | done: 8 tests RED→GREEN (domain rule, mapper, the recorded account: 11 to-dos with subtasks, 7 missions, presenter, component); `npm test` 1296/1296, lint 0 errors, tsc ok | see L3 |
| U2 | S1, S2, S4 | Missions on campaign tasks: `TaskStatus` carries the checklist, `mergeTaskStatuses` puts it on `CampaignTask`, the chip in `campaignScreenView` and `CampaignTaskRow` | inline | pending | |
| U3 | S3, S4 | "View more" in today's quests and in each phase panel: a presenter helper, state in `HomeScreen` and `CampaignsPanel`, copy, styles, README | inline | pending | |

## Log

- **L1** (2026-11-05, user): "chat me gustaria que hicieramos esto Las tareas que tienen mas de cierta cantidad de subtareas deberia convertirse en una mision, las campañas tienen varias faces (misiones) porque hay tareas con subtareas, estas las podriamos llamar misiones, y las tareas sueltas solo tareas, o quizas hacer que si tiene por ejemplo 3 subtareas sean misiones, tmabien las task cuando son muchas me toca hacer mucho scroll, estaria bien tener un limite de mostrar solo 5 o 6 y que se le pueda dar a view more". Then, on the proposal and the naming question: "vamos con tu propuesta".
- **L2** (2026-11-05): Exploration. Dromos read no checklist (no `checklist` in `src`). The recorded fixtures carry it as `{ completed, text, id }`; 11 of the 17 recorded to-dos have one (sizes 6, 13, 6, 2, 3, 1, 3, 2, 8, 5, 1), so 7 would be missions at 3. Organisms hold no state; containers do (`HomeScreen`, `CampaignsPanel`), and tests render static markup in a node environment, so the toggle is tested through its presenter.
- **L3** (2026-11-05): U1. `Quest.checklist` (`{ done, total }`) is set by `checklistOf` only when Habitica sent at least one subtask, and `QuestRowView.mission` only for a mission, so rows and quests without one keep the exact shape existing tests pin. Every object in the checklist counts as a subtask, done only when `completed` is `true`; anything else is skipped (A3). The chip sits right after the kind: "Mission · 2/5" / "Misión · 2/5".
