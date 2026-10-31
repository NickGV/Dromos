# Changelog

All notable changes to Dromos are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Campaigns: every active project (the `README.md` of a folder under `02 - Projects/`) and research (a note under `03 - Areas/<area>/Estudio/`) shows as a card with its kind, open phase, progress bar, next step and folded task list, ordered by `priority`. Progress of project tasks comes from Habitica; a research counts its completed phases.
- **Detenida** stamp for an active campaign with no completed task in 14 days; new setting "Días para marcar una campaña como detenida" and a per-campaign `stale_after_days`.
- **Enviar a Habitica** on a project task without a `habitica_id`: creates the to-do once and writes its id back into the note.
- A warning on a task whose Habitica to-do no longer exists; a notice when Habitica's progress could not be refreshed, with the last known progress kept for the session.

## [0.1.0] - 2026-10-30

### Added

- Character card read from `<folder>/Character.md`: name, title, level and XP bar derived from `total_xp`, and the four stats; an empty state names the expected path when the note is missing.
- Today's quests from Habitica: dailies due today (completed ones struck through), then overdue and due-today to-dos, then undated to-dos.
- Status band ("Sincronizado hace N min", "Sin conexión", "Token inválido" and others) and a manual **Sincronizar** button; the quests sync once when the view opens and on the button, never on a timer.
- Settings tab with the Habitica user ID, the Habitica API token (masked, stored only in the plugin's `data.json`) and the Dromos folder.
- Habitica API v3 client over `requestUrl` with typed errors for unauthorized, rate-limited, offline and unknown failures. A request that takes longer than 15 seconds counts as offline, so the band never stays on "Sincronizando…".

### Fixed

- An absurdly large `total_xp` in `Character.md` no longer freezes Obsidian: the level curve clamps totals to `Number.MAX_SAFE_INTEGER`.

### Changed

- The view's styles use Obsidian theme variables instead of a fixed palette, so it follows light and dark themes, and adapts to phone width.

## [0.0.1] - 2026-10-28

### Added

- Plugin scaffold from the official Obsidian sample plugin: esbuild, TypeScript strict, eslint with Obsidian rules, release workflow on tags.
- React 18 view `Dromos` (`ItemView`) opened from a ribbon icon and the `Dromos: Open` command, mounted in a main tab.
- Hexagonal folder layout (`domain`, `application`, `ports`, `adapters`, `ui`).
- Domain `LevelCurve` with the character and skill curves, covered by Vitest.
- Warm palette exposed as CSS custom properties on the view root.
- `npm run install:local` to copy the build into a local vault.
