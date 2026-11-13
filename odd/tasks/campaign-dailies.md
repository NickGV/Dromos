# Campaign dailies: repeat days, a checklist, and resending what Habitica lost

Objective: the `habits[]` of a campaign (and of an area, ADR-017) become proper Habitica dailies: they repeat on the days asked, carry a checklist, and one deleted by hand in Habitica can be sent again. Requested by the user through Esdras (2026-11-12).
Branch `feat/campaign-dailies`. Delivery: decisions and an ADR amending ADR-017, mockups if the screen changes, work-unit commits, `--no-ff` merge into `main`, a release only with the user's go-ahead. Runner: Vitest (`npm test`), then `npm run lint` and `npm run build`.

## Specs

The user's words, relayed by Esdras: "debemos decirselo a dromos, que hay apartado de habitos, pero deberiamos tener un apartado de dailies para las campains"; on the bug: "cuando elimino manualmente en habitica, en dromos aun aparece como si estuviera creada, osea que no puedo volverla a enviar". Claude asked "¿Querés que planee las dailies de campaña como lo próximo?" and the user answered (L1): "si dale porfavor".

- **S1 Repeat days.** Today every daily is created with all seven days; the user needed "Bloque de deep work 45 min" without Sunday, "🚶 Caminar 20-30 min" Monday to Friday and "💪 Fuerza para la espalda" Monday, Wednesday and Friday, and fixed each by hand. A habit can say which days it repeats; without it, every day (assumption, Esdras's suggestion).
- **S2 Checklist.** Today dailies are created with an empty checklist; Esdras added the items of "🌅 Rutina de mañana" and "🌙 Rutina de noche" by hand. A habit can list checklist items, sent when it is created (Esdras's suggestion).
- **S3 Deleted in Habitica.** "cuando elimino manualmente en habitica, en dromos aun aparece como si estuviera creada, osea que no puedo volverla a enviar". A task or daily whose `habitica_id` Habitica no longer has shows that it was deleted there and can be sent again. A completed task is never taken for deleted (Esdras: "active To-Dos exclude completed ones, so a 404 or absence alone doesn't prove a delete").
- **S4 One section, called "Dailies".** Esdras's suggestion, which the user liked: one section, not "habits" and "dailies"; `days` stays as an optional streak target (with it, a habit being formed; without it, a routine daily). Renaming the YAML key `habits` would break `Archeion - Bibliotheke` and 7 campaign READMEs, so the key's fate is an ADR call (ADR-017 is today's contract).
- **S5 Release** with the user's go-ahead, checked on desktop and Android.
- Constraint: Habitica allows 30 requests a minute, shared by the sync, the sends and Esdras's MCP calls (a send already failed with "Too many requests to Habitica").

## Tasks

| ID | Specs | Task | Route | Status | Commit |
|----|-------|------|-------|--------|--------|
| X1 | S1-S4 | Map the current flow: the `habits[]` schema, the send to Habitica, the status read and today's "Not found in Habitica" | delegated read-only explorer (mapping trigger: more than 5 lookups; context backstop) | done (L2) | read-only |
| D1 | S1-S4 | The user's decisions and the ADR amending ADR-017 | inline | in progress (L3) | |

## Log

- **L1** (2026-11-13, user): "si dale porfavor", to planning the campaign dailies next. Request relayed by Esdras on 2026-11-12 with the user's words above and three gaps from real use (repeat days, checklist, deletes); Esdras cleared 13 `habitica_id`s by hand after checking each was absent from Habitica's active dailies and To-Dos and had no ledger row, and kept "Terminar el Phone Lockdown" because the ledger shows it completed.
- **L2** (2026-11-13): X1 map. `habitsFrom` (`campaignMapper.ts:124-140`) reads only `title`, `days` (default 21), `skill`, `habitica_id`; projects and `archeion` areas share it (`areaMapper.ts:19`); the key `habits` is also literal in `campaignLink.ts` and `VaultCampaignRepository.ts`. Notes with `habits:` today: `Rutinas`, `00-RECUPERAR-CEREBRO`, `02-METACOGNICION`, `04-PALACIO-MENTAL` READMEs and `Archeion - Bibliotheke` (4 READMEs found, not 7). Send: `sendHabit` → `HabiticaTaskCreator.create` posts `{text, type: 'daily', notes, tags}` with no `repeat`/`frequency`/`everyX` and no checklist, though the creator already supports `checklist` (used by the M7 reading To-Do). Write-back `linkEntry` never overwrites an id. Status: `HabiticaTaskStatusSource` makes two To-Do list requests plus up to 10 `GET /tasks/:id` lookups (every daily costs one), 404 → `missing`; `mergeHabits` and `mergeTaskStatuses` raise `habitica-task-missing`; the UI shows "Not found in Habitica" and `canSend` is false for `missing` (three layers block a resend: presenter, `sendHabit`'s `already-linked`, `linkEntry`). The sync already reads `GET /tasks/user?type=dailys` elsewhere (`HabiticaTaskSource.ts:23`), so a daily's absence from that list can mark it deleted without lookups (inference). A completed To-Do older than Habitica's purge may answer 404 (inference), so the ledger must decide "completed" before "deleted".
- **L3** (2026-11-13): the ADR proposal sent to the user, pending.
