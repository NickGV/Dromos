# Ledger repeats: Dromos cleans exact copies when it writes

Objective: a month's ledger note stops collecting rows that repeat another row exactly, the copies a sync on a stale vault leaves once Obsidian Sync merges (app-reports L23).
Branch `fix/ledger-repeats`. Delivery: one work-unit commit, the merge into `main` and any release only with the user's go-ahead. Runner: Vitest (`npm test`), then `npm run lint` and `npm run build`.

## Specs

The user chose option A (L1): "que Dromos limpie las copias exactas cada vez que escribe en el ledger", with its stated limit, "las copias pueden aparecer un rato, hasta la próxima sincronización".

- **S1 Clean on write.** Each time Dromos writes rows into a month's ledger note, the note it leaves has no row that repeats an earlier row of its ledger table exactly: the same eight cells, spaces around a cell not counting. The first copy stays where it is; the later copies go.
- **S2 Nothing else changes.** Frontmatter, prose, the header, the separator, rows that differ in any cell, other tables and pipe lines lower in the note stay as they were. A note with no repeats gets exactly the text the append wrote before this change. Assumption: a repeated line that does not parse as a row stays, because Dromos shows it as unreadable for the user to fix.
- **S3 Same game.** What Dromos computes from the ledger does not change: the first copy is the one `uniqueRows` already keeps, so totals, each task's last state, recent deeds and the weekly history read the same.
- **S4 Only when writing.** A sync that adds no row leaves the note untouched, so copies can stay until the next sync that writes to that month.
- **S5 Contract and docs.** The ledger port, `docs/README.md` and `docs/frontmatter.md` stop saying that Dromos never changes a row; the CHANGELOG gets an Unreleased "Fixed" entry.

## Tasks

| ID | Specs | Task | Route | Status | Commit |
|----|-------|------|-------|--------|--------|
| T1 | S1-S5 | Drop exact repeats in `appendLedgerRows`, tests first; port, docs and CHANGELOG | inline (one unit, no writer reason) | done (L3) | see L3 |
| V1 | S1-S5 | Independent verifier: Risk item 1 (stored data) and item 3 (the documented "never changes a row") | delegated verifier | pending | |

## Log

- **L1** (2026-11-22, user): "si dale porfavor, implementa la A". Option A, as offered: "que Dromos limpie las copias exactas cada vez que escribe en el ledger. Es simple y se puede probar bien, y cualquier dispositivo que sincronice deja el archivo limpio. La contra es que Dromos pasaría a editar filas que ya existen, cuando hoy solo agrega. Además las copias pueden aparecer un rato, hasta la próxima sincronización."
- **L2** (2026-11-22): Evidence and route. The origin is in app-reports L23: a device that opens Obsidian on a stale vault runs the game sync before Obsidian Sync brings the newer ledger, and Sync's merge keeps both copies. The one-off cleanup of `2026-11.md` (153 to 44 rows) was checked with Dromos's own code, keeping the first copy. The only ledger writer is `VaultLedgerRepository.appendNow`, which calls `appendLedgerRows` for both `vault.process` and `vault.create`. That function is pure, so the cleaning goes there and is tested through it; the repository imports `normalizePath` from `obsidian`, which Vitest cannot load. RDD is off (global), so there is no native review.
- **L3** (2026-11-22): T1 inline. RED: 8 tests in `ledgerNote.test.ts`; the 4 new rules failed (S1 three, S3 one) while the 4 pinning S2 and S4 passed. One S2 assertion was wrong: `parseLedgerNote` also reports the user's own table lines as unreadable, which is existing behavior, so it now counts only the broken line. GREEN: `appendLedgerRows` runs the old append (`withRowsAdded`) and then `withoutRepeatedRows`, which matches rows by their eight parsed cells (spaces trimmed, `\|` read), keeps the first copy, and skips lines that do not parse and anything outside the ledger table. `ledgerTable` replaces `ledgerTableEnd` and returns header and end. Contract and docs: `LedgerRepository.append`, the `VaultLedgerRepository` comment, `docs/README.md`, `docs/frontmatter.md`, CHANGELOG Unreleased "Fixed". Checks: `npm test` 180 files, 2532 passed; lint 0 errors (4 old warnings); build passed. Differential, `main`'s `ledgerNote.ts` against the change, appending one probe row: on the vault's cleaned `2026-11.md` the output is byte-identical; on the backup with 109 repeats the new output's rows equal `uniqueRows` of the old output's (45); appending nothing leaves both notes unchanged. Risk: item 1 (Dromos now removes rows from stored notes) and item 3 (the documented "never changes a row"), so V1 runs.
