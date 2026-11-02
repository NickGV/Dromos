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
| T4 | S7 | Android pass | by the user | pending | |
| T5 | S8 | Q014 | by the user | pending | |

S4 needs no task: `CHANGELOG.md` already goes back to 0.0.1.

## Not verified

- The workflow only runs on a pushed tag, so T1's real proof is the next release.
- S2's "BRAT actualiza en ambos dispositivos": the PC got 0.6.0 through Sync, not BRAT, and the phone's version was not read. Part of the Android pass.
- Touch sizes, scroll, card width and the keyboard in the settings: by hand on the phone (S7).

## Log

- **L1** (2026-11-02): User, while M4 waits for one check on another day: "ok, mientras tanto podriamos continuar entonces que te parece?". State found: `release.yml` builds on any tag and creates a draft; `CHANGELOG.md` covers 0.0.1 on; `versions.json` is kept by `version-bump.mjs`; both progress bars have `aria-label`; `docs/` does not exist.
- **L2** (2026-11-02): Audit against https://docs.obsidian.md/oo/plugin. **Defect fixed:** `ledgerNote.ts` used a negative lookbehind, which iOS below 16.4 cannot parse, so the whole plugin would fail to load there. `eslint-plugin-obsidianmd`'s `regex-lookbehind` misses that form (its pattern only matches `(?<=` and a literal `(?<!)`), so a `no-restricted-syntax` rule now catches both; tried on samples, and a named group still passes. Passed: no default hotkeys, no plugin name in commands, no `as any`, global `app`, `fetch`, `process.platform`, `Vault.modify`, `.obsidian`, Node modules, `console`, `innerHTML` or setting headings; `processFrontMatter`, `vault.process`, `normalizePath`, `requestUrl`, `Platform`; `await revealLeaf` for deferred views; `minAppVersion` 1.7.2 matches `revealLeaf`, the newest API used; only theme colors in the CSS; both bars labelled. Left as they are: the bars' inline `width` is a computed value, not styling; `(event.target as HTMLElement)` in the link handler, because `instanceof` fails in a popout window; skills and ledger list `getMarkdownFiles()` by folder, which is cheap. The 4 lint warnings stay: `globalThis` in `withTimeout` warns as a bare `setTimeout` would, and `window` does not exist in the Node tests; `getSettingDefinitions` is not in the installed typings.
- **L3** (2026-11-02): User, on tags: "yo supongo que el primer numero supongo que son los release grandes, el segundo es cuando son nuevas funcionalidades y el tercero son fixes y demas". I answered that the second and third are right and the first goes up for what stops being compatible, not for size, and proposed a rule. User: "si dale porfavor". Written in the Releases section of `CLAUDE.md`. By that rule, M5 so far would release as 0.6.1.
