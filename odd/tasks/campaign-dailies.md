# Campaign dailies: repeat days, a checklist, and resending what Habitica lost

Objective: the `habits[]` of a campaign (and of an area, ADR-017) become proper Habitica dailies: they repeat on the days asked, carry a checklist, and one deleted by hand in Habitica can be sent again. Requested by the user through Esdras (2026-11-12).
Branch `feat/campaign-dailies`. Delivery: decisions and an ADR amending ADR-017, mockups if the screen changes, work-unit commits, `--no-ff` merge into `main`, a release only with the user's go-ahead. Runner: Vitest (`npm test`), then `npm run lint` and `npm run build`.

## Specs

The user's words, relayed by Esdras: "debemos decirselo a dromos, que hay apartado de habitos, pero deberiamos tener un apartado de dailies para las campains"; on the bug: "cuando elimino manualmente en habitica, en dromos aun aparece como si estuviera creada, osea que no puedo volverla a enviar". Claude asked "¿Querés que planee las dailies de campaña como lo próximo?" and the user answered (L1): "si dale porfavor".

- **S1 Repeat days.** Today every daily is created with all seven days; the user needed "Bloque de deep work 45 min" without Sunday, "🚶 Caminar 20-30 min" Monday to Friday and "💪 Fuerza para la espalda" Monday, Wednesday and Friday, and fixed each by hand. A habit can say which days it repeats; without it, every day (assumption, Esdras's suggestion).
- **S2 Checklist.** Today dailies are created with an empty checklist; Esdras added the items of "🌅 Rutina de mañana" and "🌙 Rutina de noche" by hand. A habit can list checklist items, sent when it is created (Esdras's suggestion).
- **S3 Deleted in Habitica.** "cuando elimino manualmente en habitica, en dromos aun aparece como si estuviera creada, osea que no puedo volverla a enviar". A task or daily whose `habitica_id` Habitica no longer has shows that it was deleted there and can be sent again. A completed task is never taken for deleted (Esdras: "active To-Dos exclude completed ones, so a 404 or absence alone doesn't prove a delete").
- **S4 One section, called "Dailies".** Esdras's suggestion, which the user liked: one section, not "habits" and "dailies"; `days` stays as an optional streak target (with it, a habit being formed; without it, a routine daily). Renaming the YAML key `habits` would break `Archeion - Bibliotheke` and 7 campaign READMEs, so the key's fate is an ADR call (ADR-017 is today's contract).
- **S6 The contract, ADR-021** (accepted L4: "si me parece bien"), as written in the vault's `03-Tech-Decisions.md`, amending ADR-017:
  - The key stays `habits`, in `index` and `archeion` notes; no note changes. On screen the section is "Diarias" ("Dailies").
  - Optional per entry: `repeat`, the weekdays in short English (`[mon, tue, wed, thu, fri, sat, sun]`; without it, every day); `checklist`, a list of item texts. `days` becomes truly optional: with a number, a habit being formed with its streak target; without one, a routine with no target (before, a missing `days` meant 21; every note today writes it).
  - Sending a daily creates it with its days and its checklist. The checklist is sent only on creation; editing it later in the note does not change Habitica.
  - On screen each daily shows its days ("lun · mié · vie") and how many checklist items it has.
  - Deleted in Habitica: a daily whose id is not in Habitica's list of dailies (one request) shows "Borrada en Habitica"; a task is still looked up by id, as today, and a task the ledger shows completed is never taken for deleted. Both offer "Enviar de nuevo": it creates it again and replaces its `habitica_id` in the note, only when Habitica confirmed it no longer exists.
  - The same for area habits (ADR-017).
- **S5 Release** with the user's go-ahead, checked on desktop and Android.
- Constraint: Habitica allows 30 requests a minute, shared by the sync, the sends and Esdras's MCP calls (a send already failed with "Too many requests to Habitica").

## Tasks

| ID | Specs | Task | Route | Status | Commit |
|----|-------|------|-------|--------|--------|
| X1 | S1-S4 | Map the current flow: the `habits[]` schema, the send to Habitica, the status read and today's "Not found in Habitica" | delegated read-only explorer (mapping trigger: more than 5 lookups; context backstop) | done (L2) | read-only |
| D1 | S1-S4, S6 | The user's decisions and the ADR amending ADR-017 | inline | done (L4) | vault (not under git) |
| E1 | S6 | Esdras's part: dictionary rows for `repeat` and `checklist`, and the READMEs' days and items | Esdras, with the user's OK in his session | requested (L4) | |
| T1 | S1-S4, S6 | Build: schema, the send with `repeat` and checklist, deleted detection and "Enviar de nuevo", the "Diarias" section with days and item count | delegated writer (context backstop); then an independent verifier (Risk item 1: Dromos replaces a `habitica_id` already written in a note) | in progress | |
| R1 | S5 | Release with the user's go-ahead | inline | pending | |

## Log

- **L1** (2026-11-13, user): "si dale porfavor", to planning the campaign dailies next. Request relayed by Esdras on 2026-11-12 with the user's words above and three gaps from real use (repeat days, checklist, deletes); Esdras cleared 13 `habitica_id`s by hand after checking each was absent from Habitica's active dailies and To-Dos and had no ledger row, and kept "Terminar el Phone Lockdown" because the ledger shows it completed.
- **L2** (2026-11-13): X1 map. `habitsFrom` (`campaignMapper.ts:124-140`) reads only `title`, `days` (default 21), `skill`, `habitica_id`; projects and `archeion` areas share it (`areaMapper.ts:19`); the key `habits` is also literal in `campaignLink.ts` and `VaultCampaignRepository.ts`. Notes with `habits:` today: `Rutinas`, `00-RECUPERAR-CEREBRO`, `02-METACOGNICION`, `04-PALACIO-MENTAL` READMEs and `Archeion - Bibliotheke` (4 READMEs found, not 7). Send: `sendHabit` → `HabiticaTaskCreator.create` posts `{text, type: 'daily', notes, tags}` with no `repeat`/`frequency`/`everyX` and no checklist, though the creator already supports `checklist` (used by the M7 reading To-Do). Write-back `linkEntry` never overwrites an id. Status: `HabiticaTaskStatusSource` makes two To-Do list requests plus up to 10 `GET /tasks/:id` lookups (every daily costs one), 404 → `missing`; `mergeHabits` and `mergeTaskStatuses` raise `habitica-task-missing`; the UI shows "Not found in Habitica" and `canSend` is false for `missing` (three layers block a resend: presenter, `sendHabit`'s `already-linked`, `linkEntry`). The sync already reads `GET /tasks/user?type=dailys` elsewhere (`HabiticaTaskSource.ts:23`), so a daily's absence from that list can mark it deleted without lookups (inference). A completed To-Do older than Habitica's purge may answer 404 (inference), so the ledger must decide "completed" before "deleted".
- **L3** (2026-11-13): the ADR proposal sent to the user, pending.
- **L4** (2026-11-13, user): "si me parece bien". ADR-021 written in the vault, accepted: `03-Tech-Decisions.md` (ADR-021, ADR-017's status amended, the footer), `04-Game-Design.md` (the campaign habits rule), `02-Phases.md` (the backlog line). Copies of the three notes before the edit are in the session scratchpad. No mockups: the screen changes only inside the existing habit rows (a days line, an item count, a new state and its button), checked visually after the build and shown to the user before the release (assumption). E1 sent to the `esdras` session; T1 launched.
