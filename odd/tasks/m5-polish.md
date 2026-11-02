# M5: Polish and release

Objective: "que se sienta terminado y que actualizar sea un release, no copiar archivos".
Branch: `feat/m5-polish`, started from `feat/m4-briefing` to carry its last log entry. Delivery: `single-pr`, the branch merges into `main` without squash as M3 and M4 did. Tests: Vitest (`npm test`).

## Specs

Quoted from `02 - Projects/Dromos/02-Phases.md` (M5), in the user's language.

- **S1** Release: "GitHub Action que compila y publica release al crear tag `x.y.z`". Done when "Crear un tag publica el release sin pasos manuales".
- **S2** Versions: "`versions.json` y `minAppVersion` correctos para BRAT". Done when "BRAT actualiza en ambos dispositivos".
- **S3** Docs: "`docs/`: instalación, configuración de Habitica, esquemas de frontmatter, FAQ". Done when "Todo lo del plugin se puede explicar leyendo `docs/` sin abrir el código".
- **S4** "CHANGELOG desde 0.0.1".
- **S5** "Accesibilidad básica: contraste con variables del tema, `aria-label` en barras".
- **S6** "Revisar la checklist de autocrítica de plugins de Obsidian (móvil, rendimiento, estilos)".
- **S7** "Revisión en Android: tamaños táctiles, scroll, ancho de tarjetas, teclado en settings". By hand, on the user's phone.
- **S8** "Decidir si se envía a la comunidad de Obsidian". Q014, provisional: "no hasta tener un mes estable con BRAT". The user's decision.

## Tasks

| ID | Specs | Scope | Route | Status | Commit |
|---|---|---|---|---|---|
| T1 | S1 | The release workflow publishes on a tag, and a tag that is not the manifest's version or fails the checks publishes nothing. Risk: item 5 | inline (no Writer trigger) | done locally: no runnable RED for a workflow, so the tag check ran with four tags (0.6.0 passes; v0.6.0, test and 0.7.0 stop it, exit 1) and the file parsed as YAML with the steps in order. `CLAUDE.md` updated. One independent verifier at the end of the feature; the real proof is the next tag | this commit |
| T2 | S3 | `docs/`: installation, Habitica, frontmatter schemas, FAQ | inline | done: passive docs, so no RED; 26 relative links and anchors resolve, and the claims were compared with the code, which corrected two (the ledger's `kind` and `source`, BRAT's command names). What the tab shows and `Rules.md` stay in `README.md`, linked from `docs/`, so they are not written twice | this commit |
| T3 | S2, S5, S6 | Audit: the checklist, accessibility, `minAppVersion`, the 4 lint warnings | inline | done, see L2: one real defect fixed (a regex lookbehind in the ledger reader); RED by a throwaway scan, GREEN with the lookbehind gone, 200000 random lines split alike by the old and new code, 884/884, lint 0 errors and 4 warnings, build ok | this commit |
| T6 | S1, S3 | Correction after the verifier (L4) | inline | done: docs corrected against the code, `--verify-tag` added, retry steps in `CLAUDE.md`, changelog entry; recheck PASS (L5) | `56414a5` |
| T4 | S7 | Android pass | by the user | pending | |
| T5 | S8 | Q014 | by the user | pending | |

S4 needs no task: `CHANGELOG.md` already goes back to 0.0.1.

## Not verified

- ~~The workflow only runs on a pushed tag, so T1's real proof is the next release~~ Proved by 0.6.1 (L6).
- S2's "BRAT actualiza en ambos dispositivos": the PC got 0.6.0 through Sync, not BRAT, and the phone's version was not read. Part of the Android pass.
- Touch sizes, scroll, card width and the keyboard in the settings: by hand on the phone (S7).

## Log

- **L1** (2026-11-02): User, while M4 waits for one check on another day: "ok, mientras tanto podriamos continuar entonces que te parece?". State found: `release.yml` builds on any tag and creates a draft; `CHANGELOG.md` covers 0.0.1 on; `versions.json` is kept by `version-bump.mjs`; both progress bars have `aria-label`; `docs/` does not exist.
- **L2** (2026-11-02): Audit against https://docs.obsidian.md/oo/plugin. **Defect fixed:** `ledgerNote.ts` used a negative lookbehind, which iOS below 16.4 cannot parse, so the whole plugin would fail to load there. `eslint-plugin-obsidianmd`'s `regex-lookbehind` misses that form (its pattern only matches `(?<=` and a literal `(?<!)`), so a `no-restricted-syntax` rule now catches both; tried on samples, and a named group still passes. Passed: no default hotkeys, no plugin name in commands, no `as any`, global `app`, `fetch`, `process.platform`, `Vault.modify`, `.obsidian`, Node modules, `console`, `innerHTML` or setting headings; `processFrontMatter`, `vault.process`, `normalizePath`, `requestUrl`, `Platform`; `await revealLeaf` for deferred views; `minAppVersion` 1.7.2 matches `revealLeaf`, the newest API used; only theme colors in the CSS; both bars labelled. Left as they are: the bars' inline `width` is a computed value, not styling; `(event.target as HTMLElement)` in the link handler, because `instanceof` fails in a popout window; skills and ledger list `getMarkdownFiles()` by folder, which is cheap. The 4 lint warnings stay: `globalThis` in `withTimeout` warns as a bare `setTimeout` would, and `window` does not exist in the Node tests; `getSettingDefinitions` is not in the installed typings.
- **L3** (2026-11-02): User, on tags: "yo supongo que el primer numero supongo que son los release grandes, el segundo es cuando son nuevas funcionalidades y el tercero son fixes y demas". I answered that the second and third are right and the first goes up for what stops being compatible, not for size, and proposed a rule. User: "si dale porfavor". Written in the Releases section of `CLAUDE.md`. By that rule, M5 so far would release as 0.6.1.
- **L4** (2026-11-02): Independent verifier of `907f05d` against `main` (Risk item 5, scratch clone, real `gh` against a local stub, nothing pushed). S1 PASS on all it could check: the tag check, failing checks stop the job, `gh release create` publishes with no prompt; end to end needs a real tag. S2, S4, S5 and S6 PASS statically. The ledger reader shows no difference from `main` over 40 hostile lines and 400000 fuzz lines. **S3 FAIL, three blockers, all in the docs:** the project `status` default written as `active` when no status gives no card; "local day" when the day is hard-coded to America/Bogota (`SystemClock.ts`, `questMapper.ts`), so a user elsewhere would see today's briefing dim; and "the id is the file name" without saying lowercase, because `Lector.md` passes as a note and never receives a quest. Fixed in T6, with the smaller contradictions and gaps it listed. Advisories taken: `--verify-tag`, because without it a tag deleted during the job would be recreated from the default branch; the retry steps. Left: `--latest` is forced, and the tag can sit on any commit, because releases from a feature branch are how this project tests. The hard-coded zone stays as a documented limit: it is right for the user, and changing it is a decision for before Q014.
- **L5** (2026-11-02): Recheck of the three blockers on `56414a5`: PASS on all, and on the two additions (`--verify-tag` published with the tag present and exited 1 with it missing, against a local stub; the `link.writeFailed` and `link.duplicate` table matches what the code produced). Advisories, left: a duplicate can also come from a stale metadata cache, and `write-failed` also fires when the entry is gone at write time. Next: the real tag (0.6.1 by the rule), which needs the user's go-ahead; the Android pass; Q014.
- **L6** (2026-11-02): User: "si dale porfavor, y dime con que continuo porfavor". Changelog dated (`05dfa15`), `chore(release): 0.6.1` (`abb6a04`), branch and tag pushed, and nothing else: the workflow ran every step, including the tag check, and published https://github.com/NickGV/Dromos/releases/tag/0.6.1 as the latest, not a draft. S1 holds on a real tag. CI on Node 20, 22 and 24 green; the three assets are byte-identical to the local build. Before tagging: 884/884, lint 0 errors and 4 warnings, build ok. Not merged to `main`. Left to the user: updating with BRAT on both devices (S2), the Android pass (S7), Q014 (S8), and M4's dimming check.
- **L7** (2026-11-02): User: "1 ya actualice todo funciona correctamente, todo funciona correcto en android la verdad, la entiendo perfectamente." and "manana cuando haga lo que me dices te comento lo del panel palido". S7 accepted on the user's word. **S2 is not met on this PC:** at 16:53 its plugin files are still 0.6.0, and BRAT's settings pin `NickGV/dromos` to `0.6.0`, written at 15:35; they said `latest` at 15:15. Who pinned it was not established. A pinned BRAT never updates, so this PC would stay behind silently. Still open: the user's answer on this, M4's dimming check tomorrow, then the merge on the user's word; Q014 waits for the month with BRAT.
- **L8** (2026-11-02): User, on where they saw 0.6.1: "en mi android". So BRAT updated on Android. S2 stays open only for this PC: the user sets Dromos back to the latest version in BRAT when at it, and confirms 0.6.1.
- **L9** (2026-11-02): User: "ya lo puse en este computador y bien ya confirme". Checked on disk: the files are 0.6.1, written here by BRAT at 16:58:22 and identical to the build, so S2 holds on both devices. BRAT's settings still pin `0.6.0`, unchanged since 15:35, so its next update here may need the same manual step. Not one ledger row has a skill yet: skill XP, a real unlock, the banner, the toast, habit rows and Send to Habitica with tags still have not run in real use.
