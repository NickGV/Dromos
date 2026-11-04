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
| T1 | S1, S5 | Anonymizer `test/fixtures/habitica/anonymize.ts` and its unit tests on a synthetic payload | inline (no Writer trigger: one unit, about 200 lines). Risk: item 2 (the guard that keeps personal data out of a public repo) | done: 10 tests RED (module missing) then GREEN; breaking the id-key rule fails 1 of them; `tsc` and ESLint clean | `76ab86b` |
| T2 | S1, S2, S3 | Script `scripts/record-habitica-fixtures.mjs`, `npm run fixtures:habitica`, README section, a test that its `x-client` matches `HABITICA_X_CLIENT` | inline. Risk: item 2 (reads credentials) | done: the x-client test fails when the values differ; a scratch run against a stubbed `fetch` wrote 3 files with fakes only and printed counts only, and the 401, unreachable, non-JSON, `CI`, missing-credential and space-in-token paths each exit 1 with one line and no credential; 1276/1276, lint 0 errors and 4 warnings, build ok | `743b874` |
| T3 | S4, S6 | The user records; commit the recorded fixtures with tests that read them through the adapters and check they hold only fakes | inline; waits on the user | done: recorded by the user (L3); 4 tests read the recordings through `HabiticaTaskSource`, `HabiticaGameTaskSource` and `HabiticaTaskStatusSource` and check they hold only fakes; GREEN at once (they pin current behavior on real data, so no RED); 1280/1280, lint 0 errors and 4 warnings, build ok | `659d0bf` |
| T4 | S1-S6 | Independent verifier over the branch before any push (Risk item 2) | delegated (Verification trigger) | done: Verifier PASS, no blockers (L4); advisory A2 fixed | `c2e5832` |

## Log

- **L1** (2026-11-04): User: "que copntinua". The agent recommended #8 (the only open issue with code; #1 and #2 are vault work, #10 tracks M2). User: "si dale porfavor".
- **L2** (2026-11-04): Exploration, before any write.
  - Endpoints Dromos reads: `/tasks/user?type=dailys` and `?type=todos` (`HabiticaTaskSource`, `HabiticaGameTaskSource`), `?type=completedTodos` (`HabiticaGameTaskSource`, `HabiticaTaskStatusSource`), `/tasks/{id}` and `POST /tasks/user`. The fixtures cover the three lists S1 names.
  - Fixtures load through `habiticaFixture()` in `test/adapters/habitica/FakeHttp.ts` (`vi.importActual`, literal paths: `tsconfig` has no `resolveJsonModule`). Only `HabiticaTaskSource.test.ts` uses them, asserting crafted titles (A1).
  - `scripts/` is outside `tsconfig` and ignored by ESLint, so the anonymizer lives in `test/` (type-checked, linted, tested) and the script imports it. Node 24 runs the `.ts` file directly (type stripping, Node 22.18 or newer), so the anonymizer uses only erasable syntax and no imports.
  - The plugin's `data.json` in `~/Documents/Logos` has `habiticaUserId` and `habiticaApiToken` (keys read, values not). `DROMOS_VAULT` is not set in the agent's shell.
- **L3** (2026-11-04): The user ran the script with `!`, credentials read from `data.json` (A4). Output: "Wrote 0 dailys, 17 todos, 30 completedTodos to test/fixtures/habitica/recorded/." The account has no dailies, so `recorded/dailys.json` is an empty list and the real shape of a daily is not covered until the user has one and records again.
  - Review of the files: envelope `success`/`data` only; every string is a fake id, `text N`, `notes N`, an empty note, `type` `todo`, `attribute` `str`, or a date in a date field; `foreignStrings` is 0 for all three.
  - The one dated to-do, the one the user set due on 2026-11-04 for issue #9, is stored as `2026-11-04T05:00:00.000Z`: midnight in Bogota. That confirms with real data the decision of issue #9 S2 (no change), and the new test pins it.
  - A completed to-do finished at `2026-11-01T00:36:14.831Z` reads as 2026-10-31 in Bogota; the game and status tests pin that day.
- **L4** (2026-11-04): Independent verifier over `e1a575e..659d0bf` (Risk item 2), in a scratch clone with no network and fake credentials: no blockers, S1 to S6 PASS.
  - S1: its own oracle over 400 seeded fuzz runs of 3 responses (20,064 position checks, 12,021 leak checks) found 0 failures; three deliberately broken anonymizers each failed it. The stub log shows only the three lists requested, with the trimmed credentials and `HABITICA_X_CLIENT`.
  - S2: 16 failure paths (401, 429, 500, a failure on the third list, an unreachable host with the token in the error, non-JSON with the token in the body, `CI`, missing or header-unsafe credentials) exit 1 with one line, no credential or raw string printed, no fixture changed, and no raw string anywhere on disk after the runs.
  - S4: its own scan of the committed recordings found only fake ids, `text N`, `notes N`, empty strings, enums and dates in date fields; `src/` and the hand-made fixtures unchanged; no workflow runs the script. 1280/1280 at the head, 1265/1265 at the baseline, lint 0 errors and the same 4 warnings, build ok.
  - Fixed: a 200 body that is not a Habitica envelope ended in a stack trace (A2); it now prints "Habitica sent a response that is not a task list; nothing was written." and exits 1, checked with a stub.
  - Left as advisories: object keys that are not id-shaped are copied unchecked (Habitica sends only schema keys and id keys); a real text identical to a fake makes the script refuse to write, which fails safe; the recording has no dailies.
