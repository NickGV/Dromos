# M1 hardening (issue #9)

Objective: close or explicitly decide each advisory left by the M1 verification (`odd/tasks/m1-character.md` L11), as issue #9 lists them.
Branch: `fix/m1-hardening`, from `main` at `80524fe`. Delivery: `single-pr`, merged into `main` without squash like the features before it. Tests: Vitest (`npm test`). Forecast: about 200 authored lines.

## Specs

Quoted from issue #9 (Scope, Acceptance criteria, Tests).

- **S1** Time zone: "One source for the time zone (a shared constant, or a date conversion the clock provides)." Test: "both conversions agree".
- **S2** UTC-midnight due dates: "Compare due dates with the Habitica app; if they differ, treat date-only due dates as local dates." The issue's context: "It may match what the Habitica app shows on a device in Bogota; confirm before changing anything." Test: "Bogota date at a UTC-midnight timestamp".
- **S3** Malformed token: "Validate the token format before sending (header-safe characters) and show the invalid-token or not-configured state instead of offline." Test: "a malformed token gives the right status without a request".
- **S4** Settings API: "Adopt the declarative settings API when the typings support it, keeping `minAppVersion` honest; otherwise document why the warning stays."
- **S5** "Items 1–3 fixed, each with a test." "Item 4 fixed or documented." "`npm test`, `npm run lint` and `npm run build` pass."

## Tasks

| ID | Specs | Scope | Route | Status | Commit |
|---|---|---|---|---|---|
| T1 | S1, S5 | One module holds the time zone and the date conversion; `SystemClock` and `questMapper` use it | inline (no Writer trigger: about 40 lines) | done: `src/adapters/localDate.ts`; 2 tests RED (module missing) then GREEN; 1261/1261, lint 0 errors and 4 warnings, build ok. Risk: none (same conversion, one copy) | this commit |
| T2 | S2, S5 | Pin the UTC-midnight case with a test; compare one real to-do with the Habitica app | inline | test added and passing (it pins the current behavior); pending: the user's comparison | this commit (test) |
| T3 | S3, S5 | `HabiticaClient` refuses credentials with characters outside visible ASCII before any request, as `Unauthorized` | inline. Risk: item 2 (a guard on credentials), so an independent verifier at the end | pending | |
| T4 | S4, S5 | Document why `getSettingDefinitions()` is not adopted | inline | pending | |

## Log

- **L1** (2026-11-04): User, after the M6 merge: "con que continuamos?", then "ya la v 0.8.0, vamos con el #9". The user has seen 0.8.0, so the M6 review task in the vault's `02-Phases` can be closed (Esdras's note).
- **L2** (2026-11-04): Exploration, before any write.
  - S1: `DROMOS_TIME_ZONE = 'America/Bogota'` and an `Intl.DateTimeFormat` are declared twice, in `src/adapters/obsidian/SystemClock.ts` and `src/adapters/habitica/questMapper.ts`. `localDate` from `questMapper` also serves `gameTaskMapper` and `HabiticaTaskStatusSource`.
  - S2: Habitica's web client shows a to-do's due date with `moment(this.task.date).format(...)` (`website/client/src/components/tasks/task.vue`, `formatDueDate`), which is the device's local time: the same conversion Dromos does for a device in Bogota. Dromos never sends a `date` when it creates a task (`HabiticaTaskCreator`). Not known: what the Habitica Android app shows.
  - S3: a token with characters outside visible ASCII reaches `requestUrl`, which throws; `HabiticaClient.request` maps every throw to `Offline`. The banner already has the right state, `unauthorized` ("Invalid token" / "Token inválido"). `HabiticaClient.request` is the one place every Habitica call goes through.
  - S4: the installed typings are `obsidian` 1.12.3, and `package.json` asks for `latest`. `getSettingDefinitions()` arrived in 1.13.0 (the 1.14.4 typings, read in scratch). Adopting it means updating the dev dependency and keeping `display()` for Obsidian 1.7.2 to 1.12, so the settings would be written twice. The declarative token field is the `secret` control, which keeps the token in `app.secretStorage`, while ADR-007 keeps it in `data.json`. The only gain is that Dromos's five settings appear in Obsidian's settings search on 1.13 or later. Decision: document it, do not adopt.
