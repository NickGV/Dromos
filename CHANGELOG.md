# Changelog

All notable changes to Dromos are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [0.4.0] - 2026-11-01

### Added

- **Skills.** Sixteen skills, all locked at the start and earned through quests, campaigns, habit streaks and, for some, something you confirm by hand. Each has a description, five ranks (levels 1, 5, 10, 15 and 20), its own level and XP bar, and shows what it still asks for. They live as notes in `<folder>/Skills/`; an unlock is permanent and a skill earns XP from the day after it unlocks.
- **XP and the ledger.** Completed Habitica to-dos and dailies earn XP by priority (a daily streak earns a bonus every 7 days); unchecking a task takes it back. Every change is a row in `<folder>/Ledger/YYYY-MM.md`, which is only ever appended to. Dromos counts only from the day of its first sync, so past completions never become progress.
- **Six stats.** The character now has fuerza, vitalidad, inteligencia, sabiduría, espíritu and disciplina, each showing the level that the XP of the unlocked skills that feed it would have on the skill curve (disciplina also counts the dailies that carry no skill), so a stat of 3 and a skill of level 3 mean the same. A `Character.md` written with the old four stats still reads.
- **Level-up banner** for a new character level, a new skill level or rank, and a skill unlock.
- **Campaign habits.** A project can list `habits` with a target number of days; each can be sent to Habitica as a daily and shows its streak over the target. The streak is Habitica's, so a missed day starts it again.
- **Send to Habitica** puts the `skill/<id>` tags of the task or habit on what it creates, and creates the tags that do not exist.

### Changed

- Dromos now writes the derived fields of `Character.md` and of the skill notes, and appends to the ledger; `name`, `title` and the rest of those notes stay yours. Obsidian rewrites the frontmatter of those notes when Dromos saves them, so comments inside the YAML may be lost.
- Opening the view or selecting **Sync** now makes about eight Habitica requests instead of four.
- `skill` in a campaign or a task accepts a single id or a list.

### Known limits

- A daily counts for XP only if Dromos sees it completed the day it was done; open the view that day. Its streak still counts for habits and unlocks.
- A daily that Habitica still shows as done after your local midnight, because its day has not rolled over yet, can be counted again for the new day.
- A ledger row you damage by hand is listed as unreadable; Dromos cannot know what it said, so it may add that transition again. A row repeated exactly is counted once.

## [0.3.0] - 2026-10-31

### Added

- Interface language setting: English by default, Español optional. It switches the open view at once and changes only Dromos' own text, never your notes or the keys of `Character.md`.

### Changed

- The interface is now in English by default. Users who want the previous Spanish copy choose **Español** under Settings → Dromos → Language; the Spanish text is exactly what 0.2.0 showed.

## [0.2.0] - 2026-10-31

### Changed

- The `x-client` header now carries the tool author's Habitica user ID, as Habitica's API usage guidelines require, instead of the ID of whoever runs the plugin.

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
