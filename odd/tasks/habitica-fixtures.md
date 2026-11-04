# Real anonymized Habitica fixtures (issue #8)

Objective: tests run against the real shape of Habitica responses, recorded once from the user's account, without exposing any personal data (issue #8, Q016).
Branch: `test/habitica-fixtures`, from `main` at `e1a575e`. Delivery: `single-pr`, merged into `main` without squash. Tests: Vitest (`npm test`). Forecast: about 350 authored lines, plus the recorded JSON (generated, not counted).

## Specs

Quoted from issue #8 (Goal, Scope, Acceptance criteria, Tests, Out of scope).

- **S1** Script: "A script run by hand (never in CI) that reads the credentials from environment variables, fetches `dailys`, `todos` and `completedTodos`, and replaces ids, texts, notes, tag ids and user ids with deterministic fakes. It keeps the fields Dromos reads (`type`, `completed`, `isDue`, `date`, `priority`, `streak`, `tags`) and the overall structure."
- **S2** Output: "Write the anonymized JSON into `test/fixtures/habitica/`; raw responses are never written to disk inside the repo."
- **S3** Docs: "Document the script in the README."
- **S4** Acceptance: "Committed fixtures contain no real ids or texts (spot-check against the account)." "Existing tests pass with the new fixtures, adjusting expectations only where counts change."
- **S5** Test: "A unit test for the anonymizer on a synthetic payload: same structure out, no original strings left."
- **S6** Goal: "Tests run against the real shape of Habitica responses without exposing any personal data." Out of scope: "Recording fixtures for endpoints Dromos does not use."

Assumptions (the agent's, not the issue's; the user can overrule them):

- **A1** (S2, S4) The recorded fixtures go to `test/fixtures/habitica/recorded/`, beside the hand-made ones, which stay. The hand-made fixtures hold crafted cases that rule tests assert by title against a fixed clock (a daily not due, an overdue to-do, an undated one); real data cannot promise those cases. Existing tests stay unchanged, and new tests read the recorded fixtures through the adapters.
- **A2** (S1) A fixture keeps only `success` and `data` from the envelope. `notifications`, `userV` and `appVersion` are dropped, because notifications can carry party messages and names.
- **A3** (S1, S5) Strings kept as they are: empty strings, `type`, `frequency` and `attribute` from their closed sets, and ISO dates in date fields. Every other string becomes a fake: ids and id-shaped keys become `00000000-0000-4000-8000-NNNNNNNNNNNN`, and any other text becomes `<field> N`.
- **A4** (S1) The user runs the script with `!`, with the credentials read from the plugin's `data.json` into the environment, so the token is never typed into the conversation or printed.

## Tasks

| ID | Specs | Scope | Route | Status | Commit |
|---|---|---|---|---|---|
| T1 | S1, S5 | Anonymizer `test/fixtures/habitica/anonymize.ts` and its unit tests on a synthetic payload | inline (no Writer trigger: one unit, about 200 lines). Risk: item 2 (the guard that keeps personal data out of a public repo) | done: 10 tests RED (module missing) then GREEN; breaking the id-key rule fails 1 of them; `tsc` and ESLint clean | this commit |
| T2 | S1, S2, S3 | Script `scripts/record-habitica-fixtures.mjs`, `npm run fixtures:habitica`, README section, a test that its `x-client` matches `HABITICA_X_CLIENT` | inline. Risk: item 2 (reads credentials) | pending | |
| T3 | S4, S6 | The user records; commit the recorded fixtures with tests that read them through the adapters and check they hold only fakes | inline; waits on the user | pending | |
| T4 | S1-S6 | Independent verifier over the branch before any push (Risk item 2) | delegated (Verification trigger) | pending | |

## Log

- **L1** (2026-11-04): User: "que copntinua". The agent recommended #8 (the only open issue with code; #1 and #2 are vault work, #10 tracks M2). User: "si dale porfavor".
- **L2** (2026-11-04): Exploration, before any write.
  - Endpoints Dromos reads: `/tasks/user?type=dailys` and `?type=todos` (`HabiticaTaskSource`, `HabiticaGameTaskSource`), `?type=completedTodos` (`HabiticaGameTaskSource`, `HabiticaTaskStatusSource`), `/tasks/{id}` and `POST /tasks/user`. The fixtures cover the three lists S1 names.
  - Fixtures load through `habiticaFixture()` in `test/adapters/habitica/FakeHttp.ts` (`vi.importActual`, literal paths: `tsconfig` has no `resolveJsonModule`). Only `HabiticaTaskSource.test.ts` uses them, asserting crafted titles (A1).
  - `scripts/` is outside `tsconfig` and ignored by ESLint, so the anonymizer lives in `test/` (type-checked, linted, tested) and the script imports it. Node 24 runs the `.ts` file directly (type stripping, Node 22.18 or newer), so the anonymizer uses only erasable syntax and no imports.
  - The plugin's `data.json` in `~/Documents/Logos` has `habiticaUserId` and `habiticaApiToken` (keys read, values not). `DROMOS_VAULT` is not set in the agent's shell.
