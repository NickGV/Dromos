# Link an existing Habitica to-do to a campaign task (issue #11)

Objective: a campaign task without a `habitica_id` can be linked to a to-do that already exists in Habitica, picked from a list, without creating anything there.
Branch `feat/link-existing-todo`. Delivery: work-unit commits; merge into `main`, release and closing #11 only with the user's go-ahead. Runner: Vitest (`npm test`), then `npm run lint` and `npm run build`.

## Specs

From issue #11 (its Goal, Scope, Acceptance criteria, Tests and Out of scope, quoted) and the user's decision (L1).

- **S1 Goal.** "From a campaign task shown as **Not linked**, the user can pick one of their open Habitica to-dos and link it, without creating anything in Habitica." The issue's open decision is settled by the user (L1): "solo vincular las que ya están". The picker links an existing `tasks[]` entry only and never adds one.
- **S2 Use case.** "`application`: a `LinkExistingTask` use case. It takes the campaign, the task title and the chosen to-do id, and writes the id through `CampaignRepository.linkHabiticaId`, the same path and the same `LinkResult` outcomes as `LinkTaskToCampaign`. It sends nothing to Habitica." Acceptance: "Linking an existing to-do writes its `habitica_id` into the task's entry, and the task then shows its Habitica state instead of **Not linked**." and "Linking sends no write request to Habitica."
- **S3 Picker.** "`ui`: on a **Not linked** task, a second action next to **Send to Habitica** opens a picker of the open to-dos already loaded by the sync, filtered as you type. It fetches nothing extra. Copy is in English and Spanish, in sentence case." Acceptance: "The picker opens from data already loaded; it makes no extra request." Reading (the code, L2): since calm-ui S4 a task Dromos can send shows Next or Pending beside **Send to Habitica** rather than the "Not linked" chip, which shows only when Habitica is not set up. So the action sits beside **Send to Habitica** on every project task without a `habitica_id`, and not beside **Send again**: changing an id is out of scope. Assumption: the picker is Obsidian's own search list, which filters as you type, works with the keyboard and on the phone. The action shows only while the sync's to-do list is loaded.
- **S4 One to-do, one task.** "A to-do that is already linked to another task is not offered, so one to-do never counts twice." Here "another task" means any `tasks[]` entry of any campaign note, whatever its status. The use case checks again when it writes, because another device may have linked the to-do since the sync. Assumption: a book's reading to-do is not a campaign task and is not left out.
- **S5 Where the list comes from (assumption, L2).** The campaign sync already reads Habitica's open to-dos (`GET /tasks/user?type=todos`) when an active project has a linked to-do, and keeps only those statuses. It now also keeps each open to-do's id and title, so linking one shows its state at once. It also reads that list when an active project has a task without `habitica_id`, which is one read per sync, and only then. Opening the picker sends no request.
- **S6 Messages.** Each outcome has its own message in English and Spanish, in sentence case, and none says that something was sent to or created in Habitica.
- **S7 Tests and check.** "Vitest, test-first: `LinkExistingTask` writes through the repository, reports each `LinkResult`, and never calls the task creator. The presenter leaves out to-dos that are already linked." "Manual in Obsidian: link an existing to-do, select **Sync**, complete it in Habitica, select **Sync** again, and check that the campaign's progress moves."
- **Out of scope.** "Unlinking or changing a `habitica_id`. Habits, which have their own flow (`LinkHabitToCampaign`)."

## Tasks

| ID | Specs | Task | Route | Status | Commit |
|----|-------|------|-------|--------|--------|
| T1 | S2, S4, S5 | The data and the use case: the open to-dos from the campaign sync, the linked ids of every campaign note, `LinkExistingTask`, tests first | inline (T2 depends on it; no writer reason) | done (L3) | see L3 |
| T2 | S1, S3, S6 | The action and the picker: presenter, button, picker adapter, container wiring, messages in en and es, README, docs and CHANGELOG, tests first | inline | pending | |
| V1 | S1-S7 | Independent verifier at the feature's end: Risk item 3 (shared campaign sync code and its requests) | delegated verifier | pending | |
| M1 | S7 | The manual check in Obsidian | the user | pending | |
| R1 | all | Merge, release and close #11 | inline, with the user's go-ahead | pending | |

## Log

- **L1** (2026-11-22, user): "solo vincular las que ya están, dale con el #11", answering the issue's open decision ("whether the picker also offers to add a new `tasks[]` entry from a to-do").
- **L2** (2026-11-22): Map by a read-only explorer, which changed two premises of the issue.
  - The campaign sync reads the to-do list only when something is linked. It then keeps only the statuses of linked ids and drops titles and unlinked to-dos (`HabiticaTaskStatusSource.ts:41-47`, `SyncCampaigns.ts:90`).
  - The "Not linked" chip shows only when Habitica is not set up (`campaignScreenView.ts:183`, calm-ui S4).

  Other facts:
  - The quest sync drops future-dated to-dos (`selectTodaysQuests`), so it cannot be the list.
  - `linkEntry` writes only when the entry's id is unsent, and never checks whether the id is used elsewhere (`campaignLink.ts:45-57`).
  - `sendAndLink`'s copy says "sent to Habitica", and its repository `already-linked` maps to `duplicate`.
  - `reload()` keeps the known statuses, so a newly linked id shows no state until the next sync unless the sync already holds it.
  - There is no picker UI yet; modals come from adapters, injected as functions (`createOpenCardModal`).

  Decisions taken by the parent, stated as S3-S5 assumptions: the list comes from the campaign sync, the picker is Obsidian's search list, and the action sits beside **Send to Habitica**.
- **L3** (2026-11-22): T1 inline. RED: 10 new tests failed and the `LinkExistingTask` module was missing; the pin "without the list, still answers only the linked to-dos, with no title" passed. The tests covered:
  - `HabiticaTaskStatusSource`: 2, the open list alone, and with linked to-dos.
  - `SyncCampaigns`: 6, among them "makes no request when nothing is linked and no project task could be". It replaces "makes no request when no task is linked", whose fixture had a task without id; under S5 that case now asks for the open list (a deliberate change, pinned by the new "asks only for the open to-do list…").
  - `linkedTaskIdsOf`: 2.
  - `LinkExistingTask`: 10.

  GREEN:
  - `LinkedTasks.openTodos` and an optional `title` on the open status (port). The adapter reads only the open list when nothing linked needs the completed one, and gives every open to-do of that list its trimmed title.
  - `SyncCampaigns` asks for the list while an active project has a task without id, and keeps the last list in `openTodos()`, the linked ones too. Each open to-do's status also goes into `known`, so a task linked from the list shows its state on `reload()` with no request.
  - `CampaignRepository.linkedTaskIds()`: `linkedTaskIdsOf` reads every project README in any status, through `projectTasks` and `habiticaIdFrom`.
  - `LinkExistingTask`: `choices()` and `execute()`, with the outcomes `linked`, `already-linked`, `taken`, `not-found`, `not-a-project` and `write-failed`. Its only dependencies are the repository and the list, so it cannot reach Habitica; S2's "never calls the task creator" holds by construction, and the test checks that the repository's link is its only write.

  Checks: `npm test` 182 files, 2560 passed; lint 0 errors (4 old warnings); tsc clean.
