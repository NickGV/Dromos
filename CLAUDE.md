# Dromos

Obsidian plugin (TypeScript, React 18, esbuild): the user's productive life as a calm RPG over the Logos vault. Character from `Dromos/Character.md`, quests from Habitica, campaigns and a scribe guide later.

Generic Obsidian plugin rules (manifest, releases, privacy, mobile, listeners) live in @AGENTS.md. This file only adds what is specific to Dromos.

## Commands

- `npm test` — Vitest (`test/`). `npm run test:watch` while iterating.
- `npm run lint` — ESLint with `eslint-plugin-obsidianmd`.
- `npm run build` — `tsc -noEmit` then production esbuild. Run it before saying a change is done.
- `npm run install:local` — builds and copies `main.js`, `manifest.json`, `styles.css` into `$DROMOS_VAULT/.obsidian/plugins/dromos`. The default vault is `~/Documents/second_brain`; set `DROMOS_VAULT` to the real vault path.

## Architecture (hexagonal)

```
src/
  domain/       pure rules and models (character, quest, rules/LevelCurve, ledger, skill, campaign)
  ports/        interfaces: Clock, GameStateRepository, SettingsStore, TaskSource, TaskSourceError
  application/  use cases: LoadHome, SyncQuests, QuestState
  adapters/     vault/ (Character.md via metadataCache), habitica/ (HTTP client + task source)
  composition/  createDromos.ts wires adapters into use cases
  ui/           atomic design: atoms, molecules, organisms, containers, presenters
  main.ts       plugin lifecycle only
test/           mirrors src/; fakes in test/fakes, anonymized fixtures in test/fixtures/habitica
```

Rules that keep it honest:

- Dependencies point inward: `domain` imports nothing; `application` imports `domain` and `ports`; only `adapters` and `ui/DromosView` touch `obsidian`.
- Tests never import `obsidian`. The HTTP function is injected into `HabiticaClient`; the real one wraps `requestUrl` with `throw: false`.
- UI is container/presenter: only containers (`ui/containers`) call `application/`; organisms render props; view-model logic lives in `ui/presenters` and is unit-tested.
- Missing frontmatter fields fall back to defaults, never `NaN`. A missing `Character.md` shows an empty state naming the note, never invented data.
- The Habitica token lives only in the plugin's `data.json` (masked input). It must never reach the console or any vault note.
- Habitica allows 30 requests per minute: no polling, sync on open and on the manual button only.

## Workflow

- Work is tracked with ODD feature documents in `odd/tasks/<feature>.md` (specs `S#`, tasks, log). Read the document up to `## Log` before touching a feature and report which `S#` you covered. M1 is `odd/tasks/m1-character.md`.
- Conventional Commits, work units of about 400 authored lines on a feature branch (`feat/<name>`), tests and docs alongside the behavior.
- Commits use the personal identity already set in this repo's local git config (NickGV). Do not change it.
- TDD when a deterministic test is possible: observe RED, then GREEN.
- Never commit `main.js`, `data.json`, or `node_modules`.

## Releases

- Bump `manifest.json` and `versions.json` with `npm version`, then push a tag equal to the version, no leading `v`.
- `release.yml` creates the GitHub release as a **draft**. BRAT cannot see drafts, so publish it: `gh release edit <tag> --draft=false --latest`.
- The repo is public, so BRAT needs no token. Users install through BRAT on every device, Android included.

## Vault contracts (live in the Logos vault, not here)

Planning lives in the vault under `02 - Projects/Dromos/` (Charter, Architecture, Phases, Tech-Decisions ADR-001..013, Game-Design, Open-Questions, Visual-Design). The ones this code depends on:

- ADR-013: closed dictionary of 17 English `type` values and English tags; `archeion` is the area hub type.
- Q020: Esdras (the vault agent) is the only writer of `study-session` notes. Dromos only reads them.
- ADR-007: secrets stay in plugin `data.json`.

If a change needs a contract that is not written down here, ask the user to point to the vault note instead of guessing.

## Language

Code, comments, UI copy, tests, docs and commits are in English. Obsidian UI strings use sentence case.
