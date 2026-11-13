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
| X1 | S1-S4 | Map the current flow: the `habits[]` schema, the send to Habitica, the status read and today's "Not found in Habitica" | delegated read-only explorer (mapping trigger: more than 5 lookups; context backstop) | in progress | |
| D1 | S1-S4 | The user's decisions and the ADR amending ADR-017 | inline | pending | |

## Log

- **L1** (2026-11-13, user): "si dale porfavor", to planning the campaign dailies next. Request relayed by Esdras on 2026-11-12 with the user's words above and three gaps from real use (repeat days, checklist, deletes); Esdras cleared 13 `habitica_id`s by hand after checking each was absent from Habitica's active dailies and To-Dos and had no ledger row, and kept "Terminar el Phone Lockdown" because the ledger shows it completed.
