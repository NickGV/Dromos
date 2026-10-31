# M2 — Campañas

Objective: every active `index` (project) and `research` note shows up as a campaign with phases, progress and a next action, crossed with Habitica.
Branch: `feat/m2-campaigns` · Delivery: `ask-on-risk` → `feature-branch-chain` (work-unit commits on the branch, one merge to `main` at the end) · Runner: `npm test` (Vitest), plus `npm run lint` and `npm run build`.

## Specs

Source: `02 - Projects/Dromos/02-Phases.md` section "M2: Campañas" and `04-Game-Design.md` section "Campaign" (Logos vault), quoted verbatim, plus the decisions logged in L2. Contract fixed by Esdras (vault agent) in L3.

- **S1** — Campaign model: "una campaña es un `index` o una `research` activa; los proyectos llevan `tasks[]` y las investigaciones usan sus sesiones como tareas" and "Dominio: `Campaign` (proyecto o investigación), `Phase`, `CampaignTask`, cálculo de progreso por fase y total". Shared fields: `status`, `priority` (`high|medium|low`), `area`, `phases[{id,name,status}]` with the lifecycle statuses `planning|active|paused|completed|archived` (ADR-012). A project adds `skill`, optional `deadline`, optional `stale_after_days` and `tasks[{title, phase, habitica_id|null, skill?, resources?[]}]`.
- **S2** — Repository: "Adaptador `VaultCampaignRepository.listActive()`: notas `type: index` o `type: research` con `status: active`, ordenadas por `priority`; las tareas de una investigación son sus `study-session`". Child `project` notes, closed `research` notes and `Templates/research` never enter.
- **S3** — Progress and next action, verbatim rules:
  - "**Fase completada** = `phases[].status: completed` en el frontmatter. Nunca sale del checklist de Habitica."
  - "**Progreso de fase** en proyectos = tareas de esa fase con `habitica_id` completado / tareas de la fase; las tareas sin `habitica_id` cuentan como pendientes. En investigaciones, el progreso total = fases completadas / fases."
  - "**Siguiente acción** en proyectos = primera tarea pendiente de la primera fase no completada. En investigaciones = la primera fase no completada."
- **S4** — Habitica cross: "Cruce con Habitica: para cada `habitica_id`, estado `completed` desde `fetchToday` y `completedTodos`". "Una campaña con `habitica_id` inválido se marca con aviso, no rompe la lista". The 30 requests per minute limit still holds: no polling.
- **S5** — UI: "`CampaignCard` con `PhaseProgress`, si es proyecto o investigación, lista de tareas con estado y la "siguiente acción"" and "Clic en una campaña abre su nota en otra hoja". Only containers call `application/`; organisms render props.
- **S6** — `LinkTaskToCampaign` (projects only): "botón "Enviar a Habitica" que crea el todo con `POST /tasks/user` y escribe el `habitica_id` de vuelta con `processFrontMatter`". "El plugin escribe en las notas `index` **solo** `habitica_id`, cuando el usuario pulsa "Enviar a Habitica". En `research` y `study-session` no escribe nada." Idempotent: "repetir el clic no la duplica porque ya tiene `habitica_id`".
- **S7** — Stale campaigns: "**Estancada** = sin ninguna tarea (o sesión, en investigaciones) completada en `stale_after_days` (default 14, configurable en ajustes). Si nunca completó ninguna, los días se cuentan desde `created`." Decision D2 in L2: default 14 days, a plugin setting; the card is marked "detenida" (Visual-Design).
- **S8** — Done criteria, verbatim:
  - "Kairos, Cheshbon y Libros Apócrifos aparecen como campañas, ordenadas por `priority`, con su progreso real" (adjusted by D3 in L5: Cheshbon is `completed` and does not appear; Kairos is `active`; the criterion is met with the active campaigns that exist)
  - "Completar una tarea en Habitica y sincronizar mueve la barra en Obsidian"
  - "Una investigación muestra sus sesiones y su próxima fase; Dromos no escribe en `research` ni en `study-session`"
  - "\"Enviar a Habitica\" crea la tarea una sola vez; repetir el clic no la duplica porque ya tiene `habitica_id`"
  - "Una campaña con `habitica_id` inválido se marca con aviso, no rompe la lista"
  - "Las notas de proyecto siguen siendo legibles y editables a mano"
- **S9** — Tests, verbatim:
  - "`listActive`: entran los `index` y `research` activos; no entran las notas hijas `project`, las `research` cerradas ni `Templates/research`; orden por `priority`"
  - "Progreso: fases vacías, tareas sin fase, tareas sin `habitica_id`, investigación con fases mixtas"
  - "Siguiente acción: todas completas → ninguna; primera fase completa → primera pendiente de la segunda"
  - "`LinkTaskToCampaign` idempotente con `InMemoryCampaignRepository`"
  - "Estancamiento: umbral exacto (13/14 días), sin tareas completadas nunca → cuenta desde `created`"

Out of scope for M2: writing anything into `research` or `study-session` (Q020), the vault side (`Templates/index`, `vault-context.md`, README migration: Esdras), Q004 (task deleted in Habitica) and Q017 (missing `Dromos/` folder), skills and XP (M3).

## Tasks

Forecast: about 1,400 authored lines; above 400, chain strategy chosen in L7.

| ID | Specs | Scope | Route | Status | Commit |
|---|---|---|---|---|---|
| T1 | S1, S3, S7 | Domain `Campaign`, `Phase`, `CampaignTask`, progress, next action, staleness (pure), with tests | inline | done: 27 tests RED→GREEN; test 175/175, lint 0 errors, build ok; Risk: none | `4fb418e` |
| T2 | S2, S9 | Campaign frontmatter mapper, `CampaignRepository` port, `VaultCampaignRepository.listActive`, `InMemoryCampaignRepository`, tests | inline | pending | |
| T3 | S4 | `TaskSource` gains completed to-dos; completion state per `habitica_id`; invalid ids flagged | inline | pending | |
| T4 | S6 | `LinkTaskToCampaign`, `POST /tasks/user`, write-back of `habitica_id` only (`processFrontMatter`) | inline | pending | |
| T5 | S5, S7 | `CampaignCard`, `PhaseProgress`, container, open note on click, `stale_after_days` setting, styles, README and CHANGELOG | inline | pending | |
| T6 | S8 | Done criteria checked in Obsidian with the real vault notes | inline | pending | |

Risk notes: T4 writes into the user's vault notes (Risk item 1) and calls Habitica with the token (item 2); it gets its own commit and an independent verifier.

## Log

- **L1** (2026-10-30, user): "Continuamos el desarrollo de Dromos ... Si necesitas un contrato del vault (ADR-013, Q020), dímelo en vez de adivinar." and "ten en cuenta porfavor que vamos a estar conversando mucho con el claude llamado "esdras" ya que el quien esta ahora mismo en logos que es mi segundo cerebro y con el vamos a tomar decisiones y a continuar con todo lo que hemos venido realizando"
- **L2** (2026-10-30, user): decisions with Esdras: Q022 accepted two new Espíritu skills (study, teach), revisable later (Esdras proposed the ids `exegeta` and `maestro`); "2 si dale vamos con 14 dias" (D2); "3 si estaria bien esto que me dices por issue" (one `habitica_id` per issue in `tasks[]` of the Dromos README); "4 si aprovemos que el pueda corregir" (ADR-013 `project` row, done by Esdras).
- **L3** (2026-10-30, Esdras via cross-session message): contract fixed in `04-Game-Design.md` "Campaign". Vault side done: `Templates/index` has `priority`, `phases`, `tasks: []`; Dromos README is `status: active`, `priority: high`, `skill: desarrollador`, 7 phases (M0, M0.5, M1 completed; M2 active; M3–M5 planning), `tasks: []` (no invented `habitica_id`). Two deviations: the pilot is the Dromos README, not Kairos; Kairos and Cheshbon READMEs were not touched (still `status: planning`, stale) because the apps are finished. Pending on the vault side: `.opencode/vault-context.md` has no `index`, `archeion` or Dromos. Not verified by me: the claims about the vault state come from his message; I read the specs above from the notes directly.
- **L4** (2026-10-30): Exploration. S8's first done criterion names Kairos, Cheshbon and Libros Apócrifos as campaigns, but Kairos and Cheshbon are finished (L3), so it cannot be met as written. To resolve with the user. Whether `GET /tasks/user?type=completedTodos` is what Habitica exposes for completed to-dos is unverified; T3 checks it against the API docs before relying on it.
- **L5** (2026-10-30, user): "ponlo cheshbon en done y kairos si lo podriamos poner en que se esta realizando, ya que debo realizar algunos cambios en el" (D3): Cheshbon README to `status: completed`, Kairos README to `status: active`. The vault edits belong to Esdras (sole vault writer); the request and the need for Kairos `priority`, `phases` and `tasks` was sent to him. Kairos has no real data to validate `listActive` until he migrates it; Dromos is the pilot meanwhile.
- **L6** (2026-10-30, Esdras): Cheshbon README is `status: completed` and Kairos README `status: active`; the M2 done criterion in `02-Phases.md` now lists Dromos, Kairos and Libros Apócrifos and says Cheshbon does not appear. Kairos still lacks `priority`, `skill`, `phases` and `tasks` (Esdras is asking the user). Assumption A1 (mine, from the project rule "missing frontmatter fields fall back to defaults, never `NaN`"): an active campaign with missing `priority`, `phases` or `tasks` must still list, with defaults (lowest priority, no phases, no tasks) and never crash; T2 covers it with a test. Not yet confirmed by the user.
- **L7** (2026-10-30, user): "a tu pregunta si, usemos feature branch chain" — `feature-branch-chain`: work-unit commits on `feat/m2-campaigns`, one merge to `main` when M2 closes. Also: "te lo paso sobre el design que esta en stitch Dromos RPG Design System para que lo tengas en cuenta tambien, igual esta sugetos a cambios por si lo podemos mejorar" — the Stitch design system "Dromos RPG Design System" informs T5 (UI) and may change.
- **L8** (2026-10-30, user): "sí, usemos las variables de Obsidian como base" (D4): T5 styles keep using Obsidian theme variables only, as in M1 (the user runs the dark theme). From the Stitch project "Dromos RPG Design System" (light mode, parchment palette `#fef9ee`/`#6f4627`, EB Garamond headings, Inter body) only typography, spacing and component shape are taken, and only after the screens are reviewed before T5. Fixed Stitch colors are not used. The design is subject to change.
- **L9** (2026-10-30): T1 done. Contract: `Campaign { kind, path, title, status, priority, area, skill, deadline, staleAfterDays, created, phases, tasks }`; `CampaignTask { title, phase, habiticaId, skill, resources, completed, completedOn }`, where `completed` and `completedOn` are resolved outside the domain (Habitica for projects in T3, the session note for research in T2). Functions: `phaseProgress`, `campaignProgress`, `comparePriority`, `nextAction` (returns `{kind:'task'}` or `{kind:'phase'}`), `isStale`, `lastActivity`, `daysSince`, `DEFAULT_STALE_AFTER_DAYS = 14`. Assumptions, not in the notes (A2): a project's total progress is completed tasks over all tasks, tasks without a phase included; an empty phase has ratio 1 only when its status is `completed`; `nextAction` is `null` when the first non-completed phase has no pending task (literal reading of the rule); only `active` campaigns can be stale; a completed task without a date is ignored for staleness. RED was `Cannot find module` in 3 files. Parent check: `npm test` 18 files, 175 tests passed; lint 0 errors, 4 warnings (same as before); build exit 0.
