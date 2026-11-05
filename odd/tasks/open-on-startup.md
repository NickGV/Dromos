# Open Dromos on startup (opt-in)

Objective: an opt-in setting so Dromos opens its own view when Obsidian starts, instead of relying on the restored workspace layout.
Branch: `feat/open-on-startup` · Delivery: `single-pr` (one unit; nothing is pushed until the user allows it) · Runner: `npm test` (Vitest), plus `npm run lint` and `npm run build`.

## Specs

- **S1** — "New setting `openOnStartup`, boolean, default `false` (opt-in; existing users see no change)."
- **S2** — "When on, once the workspace layout is ready, Dromos reveals its view (`VIEW_TYPE_DROMOS = 'dromos-home'`). No duplicate tab when Obsidian already restored one."
- **S3** — "Works on mobile; no desktop-only API, `isDesktopOnly` stays `false`. Nothing runs before `onLayoutReady`; no vault reads at startup."
- **S4** — "UI copy in English and Spanish; Obsidian strings in sentence case."
  - en: "Open Dromos on startup" / "Shows the Dromos view when Obsidian opens. Leave it off to open Obsidian where you left it."
  - es: "Abrir Dromos al iniciar" / "Muestra la vista de Dromos al abrir Obsidian. Déjalo apagado para abrir Obsidian donde lo dejaste."

## Tasks

| ID | Specs | Scope | Route | Status | Commit |
|---|---|---|---|---|---|
| U1 | S1–S4 | `Settings.openOnStartup` and its store, settings toggle and copy, `onLayoutReady` in `main.ts`, README and CHANGELOG | inline (small, one understood change; no writer reason) | done: 4 new tests RED→GREEN (8 failing before the change, the fixture's `openOnStartup: true` included); `npm test` 1284/1284, lint 0 errors (4 existing warnings), build ok; startup hook in `main.ts` checked by hand only; independent verifier: no blockers (L3) | `6a68bc4` |

## Log

- **L1** (2026-11-05, user): task "opt-in 'Open Dromos on startup'" pasted with the specs above, plus "no subas nada al github hasta que yo te lo permita porfavor".
- **L2** (2026-11-05): Implemented in one commit. `Settings.openOnStartup` (default `false`) is read with `booleanOr`, so a missing or non-boolean value (`'true'`, `1`, `null`) reads as off. The `STORED` fixture holds `openOnStartup: true`, not `false`, so the "every stored field" and round-trip tests prove the value is actually read and written rather than matching the default. `createDromos` exposes the live settings as `settings()`; `main.ts` registers `workspace.onLayoutReady` after the view and calls the existing `activateView()`, which reuses an open Dromos leaf (no duplicate tab). An `unloaded` flag set in `onunload()` stops the callback after an early unload. Known effect: `onLayoutReady` also runs at once when the layout is already ready, so with the setting on, reloading or updating the plugin (BRAT) reveals the Dromos tab too.
- **L3** (2026-11-05): Risk item 6 (the `onLayoutReady` hook in `main.ts` has no automated test), so one independent verifier ran against `109ded2..6a68bc4` in a scratch clone: S1–S4 pass, no blockers. It probed `'false'`, `0`, `undefined`, `false`, `'true'`, `1`, `null`, `{}`, `[]` (all read as off, only `true` as on), an old `data.json` without the key (every other field identical to the baseline), and the saved keys (the baseline's five in the same order plus `openOnStartup`). It checked against the 1.12.3 typings that `onLayoutReady` runs at once when the layout is already ready, and that `revealLeaf` (since 1.7.2, the `minAppVersion`) loads a deferred leaf, which `activateView()` reuses. Advisories, not acted on: the hook could move out of `main.ts` to get a unit test; revealing the view mounts the home screen, which reads the vault and syncs Habitica once, as any open does; `unloaded` never resets, harmless because Obsidian builds a new plugin instance on enable. Installed into `~/Documents/logos` with `npm run install:local`. Not done: the manual restart checks in Obsidian (ON → one Dromos tab; OFF → Obsidian opens where it was) need the user. Nothing pushed (L1).
- **L4** (2026-11-05, user): "ya probe y funciona correcatemente, ya puedes subir los cambios y tambien la version". Manual restart checks in Obsidian passed (user). Merged into `main` and released as 0.9.0 (minor: something new the user can use).
