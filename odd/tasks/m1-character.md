# M1 — El personaje

Objective: open Dromos and see the character from `Dromos/Character.md` and today's Habitica quests, safely offline.
Branch: `feat/m1-character` · Delivery: `ask-on-risk` → `feature-branch-chain` (work-unit commits on the branch, one merge to `main` at the end) · Runner: `npm test` (Vitest), plus `npm run lint` and `npm run build`.

## Specs

Source: `02 - Projects/Dromos/02-Phases.md`, section M1 (Logos vault), quoted verbatim, plus the decisions logged in L2.

- **S1** — Character port and adapter: "Puerto `GameStateRepository.loadCharacter()` (versión mínima, sin ledger aún)" and "Adaptador `VaultGameStateRepository` leyendo frontmatter con `metadataCache`". The note is `<vaultFolder>/Character.md`.
- **S2** — Character mapping: "Mapper de frontmatter de `Character.md`: campos faltantes caen a defaults, nunca a `NaN`". Decision D2: `level`, `xpIntoLevel` and `xpToNext` are derived from `total_xp` with `LevelCurve` (`CHARACTER_CURVE`); `name`, `title` and `stats` are read as stored. Decision D4: when the note is missing, the view shows an empty state that names the missing note; no invented data.
- **S3** — Settings: "Settings tab: `habiticaUserId`, `habiticaApiToken`, `vaultFolder` (default `Dromos`)". The token lives only in the plugin's `data.json` (ADR-007) and the token input is masked.
- **S4** — Habitica client: "`HabiticaClient` sobre `requestUrl` con headers `x-api-user`, `x-api-key`, `x-client: <userId>-dromos`". Base URL `https://habitica.com/api/v3`. The HTTP function is injected so tests never import `obsidian`; the real one wraps `requestUrl` with `throw: false`.
- **S5** — Errors: "Errores tipados: `Unauthorized`, `RateLimited`, `Offline`, `Unknown`". 401 → `Unauthorized`; 429 → `RateLimited` (keeps the retry delay when Habitica sends one); network failure → `Offline`; anything else → `Unknown`.
- **S6** — Today's quests: "`HabiticaTaskSource.fetchToday()`: dailies con `isDue` y todos pendientes", narrowed by the rule the user accepted in L2:
  - Dailies: those due today (`isDue: true`); completed ones are included and shown struck through.
  - To-dos: only not completed; overdue and due today first, then those without a date; future-dated ones are hidden.
  - Endpoints `GET /tasks/user?type=dailys` and `GET /tasks/user?type=todos`. "Today" for to-do dates is `Clock.today()` (America/Bogota); dailies trust Habitica's `isDue` (D5).
- **S7** — Use cases: "Caso de uso `LoadHome` componiendo personaje + quests". Decision D1: `LoadHome` reads only the vault plus the quests last fetched in this session (in memory); `SyncQuests` calls `TaskSource.fetchToday()` and records the result and the sync time. The view runs `LoadHome` and one `SyncQuests` when it opens, and `SyncQuests` again on the manual button. No polling (Habitica allows 30 requests per minute). Decision D3: offline, the view keeps the in-memory list; nothing is persisted to disk.
- **S8** — UI: "UI: `CharacterCard` (nombre, nivel, `XpBar`, cuatro `StatBadge`) y `QuestList`", "Banner de estado: "Sincronizado hace N min", "Sin conexión", "Token inválido"" and "Botón "Sincronizar" manual". The title shows under the name. Only the container calls `application/`; organisms render props. Styles use Obsidian theme variables.
- **S9** — Done criteria, verbatim:
  - "La vista muestra nivel, XP y stats leídos de `Character.md`; editar la nota a mano y reabrir refleja el cambio"
  - "Las dailies de hoy coinciden con las de la app de Habitica"
  - "Con el wifi apagado la vista abre igual, muestra el personaje y un banner de sin conexión"
  - "Un token inválido muestra un mensaje claro y no rompe la vista"
  - "Nada del token aparece en la consola ni en ninguna nota"
- **S10** — Tests, verbatim:
  - "`LevelCurve`: tabla de XP → nivel, bordes exactos" (already exists)
  - "`HabiticaTaskSource` con `FakeHttp` y fixtures reales: dailies vencidas hoy, todos sin fecha, respuesta 401, respuesta 429"
  - "Mapper de frontmatter de `Character.md`: campos faltantes caen a defaults, nunca a `NaN`"
  - Fixtures are anonymized and live in `test/fixtures/habitica/` (Q016).

Out of scope for M1: the `Dromos: Initialize vault folder` command (Q017), the "Probar conexión" button, persisting quests to disk, Habitica's own stats (Q002), and writing `last_sync` to `Character.md` (M3).

## Tasks

Forecast: about 1,500 authored lines; above 400, so the chain strategy is asked before the first commit.

| ID | Specs | Scope | Route | Status | Commit |
|---|---|---|---|---|---|
| T1 | S1, S2, S6, S7 | Domain `Quest` and today's-quest selection (pure), ports `GameStateRepository.loadCharacter`, `TaskSource`, `Clock`, `SettingsStore`, character frontmatter mapper (pure), with tests | delegated (context backstop) | done: 32 tests RED→GREEN; test 45/45, lint and build pass | uncommitted (chain strategy pending) |
| T2 | S4, S5, S6, S10 | `HabiticaClient` (injected HTTP), typed errors, `HabiticaTaskSource.fetchToday`, anonymized fixtures, `FakeHttp` tests | delegated (parallel with T3, T4) | in progress | |
| T3 | S1, S3 | `VaultGameStateRepository` (`metadataCache` plus the T1 mapper), `PluginSettingsStore`, `SystemClock`, settings tab | delegated (parallel with T2, T4) | done: 19 tests RED→GREEN; repository and settings tab under ADR-010 manual checks (6, listed for T6) | uncommitted |
| T4 | S7 | `LoadHome` and `SyncQuests` with fakes and tests | delegated (parallel with T2, T3) | done: 24 tests RED→GREEN; own files lint clean | uncommitted |
| T5 | S8, S9 | `CharacterCard`, `XpBar`, `StatBadge`, `QuestList`, status banner, sync button, `HomeScreen` container, wiring in `main.ts`, theme styles, README and CHANGELOG | delegated (context backstop) | pending | |
| T6 | S9 | Done criteria checked in Obsidian: parent through the CLI, user for the Habitica app and the wifi-off case | inline | pending | |

## Log

- **L1** (2026-10-30, user): "1 si dromos se instala perfectamente en todos mis dispositivos, ya podriamos arrancar entonces con M1"
- **L2** (2026-10-30, user): "SI" — accepting the quest rule in S6 and the technical decisions D1 (`LoadHome` local, `SyncQuests` on the network), D2 (level from `total_xp`), D3 (offline keeps the in-memory list), D4 (empty state when `Character.md` is missing) and D5 (dailies trust `isDue`).
- **L3** (2026-10-30): Exploration at `186a2b3`. `Character`, `StatId` and `LevelCurve` exist with 13 tests; ports, adapters, application and UI are placeholders; `npm test`, `npm run lint` and `npm run build` pass. Docs disagree on `LoadHome` touching the network, on which to-dos show and on completed dailies; resolved by D1 and S6. `RequestUrlParam.throw` exists in the installed `obsidian` typings, so the adapter can read 401 and 429 without exceptions.
- **L4** (2026-10-30): Branch `feat/m1-character` created from `main`. Next: T1.
- **L5** (2026-10-30): T1 done. Contract: `Quest { id, title, type, completed, skillTags, dueToday, dueDate }` and `selectTodaysQuests(quests, today)` in the domain; ports `GameStateRepository.loadCharacter(): CharacterLoadResult` (`found` | `missing` with path), `TaskSource.fetchToday()`, `TaskSourceError(kind, retryAfterSeconds)`, `Clock`, `Settings`/`DEFAULT_SETTINGS`/`SettingsStore`; mapper `characterFromFrontmatter(frontmatter)` in `src/adapters/vault/characterMapper.ts`. The mapper accepts only real numbers (a quoted `"150"` falls back to 0). Parent spot check: `npm test` 45/45. T2, T3 and T4 launched in parallel on disjoint surfaces. Fixtures are hand-made in the shape of API v3 responses; Q016's script over real data stays pending. A1 (T4): status `not-configured` when the user ID or token is empty, so an empty setting is not shown as "Token inválido".
- **L6** (2026-10-30, user): "si dale, rama y merge al final" — chain strategy `feature-branch-chain`: work-unit commits on `feat/m1-character`, one merge to `main` when M1 closes. T3 and T4 done; T3 notes for T5: debounce re-sync from the settings `onChange` (it fires per keystroke; Habitica allows 30 requests per minute), tests import adapter modules by file path (the barrels import `obsidian`), and 4 `obsidianmd/ui/sentence-case` warnings on Habitica/Dromos/`Character.md` clear with the rule's `brands` option in `eslint.config.mts`.
