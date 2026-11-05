# Changelog

All notable changes to Dromos are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- A quest or a campaign task with 3 or more subtasks in Habitica reads as a mission: **Mission · 2/5** under its title shows how many are done. It pays no extra XP and does not move the campaign's progress.
- Long lists fold: today's quests and each phase panel of a campaign show 6 rows and **View more (N)** for the rest, with finished rows folding first.

### Fixed

- With **Open Dromos on startup** on, reloading or updating the plugin no longer switches to the Dromos tab: the view opens only when Obsidian starts.

## [0.9.0] - 2026-11-05

### Added

- **Open Dromos on startup**, off by default: when on, Obsidian shows the Dromos view each time it opens, even if you closed the tab or Sync brought the layout of another device.

## [0.8.1] - 2026-11-04

### Fixed

- A Habitica user ID or token with a character no ID or token has (a space, a line break, an accent, or an invisible character a paste can leave) shows **Invalid token** at once, and Dromos sends nothing to Habitica with it. A line break or an invisible character used to show **Offline**.

## [0.8.0] - 2026-11-03

### Added

- **The world reacts.** The sky of the landscape follows your device's clock: dawn from 05:00 and dusk from 18:00 warm the horizon and lower the sun, the day runs from 08:00, and from 21:00 a light theme turns to a deep-blue night with the moon, darker hills and a moonlit gate (a dark theme keeps its night, a little warmer at dawn and dusk). It turns over two seconds, or at once with reduced motion. When every daily is done ("Day complete"), a small campfire burns beside the path; its flame flickers, or holds still with reduced motion. What is drawn over the landscape keeps its contrast at every hour: the signpost's focus ring now has a paper band on each side, and its planks a darker wood edge, 3.5:1 or more against the hills.
- **Chronicle of deeds.** Under the skills, the last five deeds of your ledger as a journal, newest first: "Yesterday · Read 20 pages · Reader +10 XP". Each deed is one completion of a Habitica task with every skill it fed; a task without skill reads "+10 XP", a streak bonus "Streak bonus · +5 XP", and something undone in Habitica "Undone · Read 20 pages · −10 XP". It reads the ledger rows the game sync already reads, sends no request and writes nothing, and shows nothing until there is a deed.
- **Since your last visit.** When the view opens and the game sync settles, the XP bar fills from where it stood the last time this device showed it, and a line under it says what changed: "+45 XP since yesterday · Reader +15 · 2 quests" (up to three skills that rose, then "and N more"; a revert reads as "−10 XP" or "−1 quest"). Nothing shows on a device's first visit or when nothing changed; across a level the ceremony runs and the line shows without the bar filling slowly. The line stays until the view opens again, and a screen reader hears it once. With reduced motion the bar shows its value at once. Each device keeps what it last showed in Obsidian's local storage, never in a note or `data.json`.
- **The walker advances.** The walker stands on the path as far as your character is through the level, smaller as it nears a gate at the path's far end marked with the next level. When your XP rises it walks there in about a second, with a small step; at a level-up it reaches the gate during the ceremony and then starts on the new level. With reduced motion it moves at once. Below about 690 px the landscape is framed a little further left, so the gate's plaque stays clear of the signpost.
- **A level-up ceremony.** When your character levels up, the XP bar fills, the level medallion turns ochre, a ribbon with the new level unfurls over the landscape, and a panel under the card lists what your skills did in that sync. Skill level-ups and unlocks alone open the panel without the ribbon. With reduced motion, everything shows at once. It replaces the ribbon in the character card.
- **Today's quests show what they pay.** Each quest lists its kind, the skills it feeds and the XP the ledger writes for it, beside Today or Overdue. The panel is headed by how many dailies are done and the XP still to earn, or "Day complete".
- **The letter of Esdras folds.** The panel opens folded on every visit: "Letter from Esdras · today" or "Last letter · 2 Nov", the mission cut at two lines, the closest skill with what it asks, and two lines of the text. **Read the letter · N min** unrolls the rest, and **Fold the letter** at its end rolls it up and takes the keyboard focus back to the top. A letter not opened yet on this device carries an ochre wax seal and "New letter"; this device remembers it in Obsidian's local storage, never in a note or `data.json`. With reduced motion it opens and folds at once. On phones the seal sits beside the top line.
- **Three screens and a signpost.** A signpost of wooden planks in the landscape leads to the screens of the view: **Path** (home), **Campaigns** and **Skills**, and **Settings**, which opens the Dromos settings tab. Campaigns and Skills open with a card naming the screen and your character, level and XP. Changing screen takes you back to the top and moves the keyboard focus to the screen's title.

### Changed

- **The signpost keeps its four planks** in the same order on every screen, Path, Campaigns, Skills and Settings, and burns the current screen's plank into the wood instead of leaving it out, so a plank never moves under your finger. On the shorter landscape of the Campaigns and Skills screens the planks are a little smaller, so all four fit.
- **Wording.** The road of a campaign is now **The route** ("La ruta"), so **Path** names the home screen only. A quiet line under today's quests says "Complete quests in Habitica · Dromos picks them up on sync". Skill dates use the short date of the campaigns: "Earned on 20 Oct", and "+15 XP · 2 Nov" in the recent entries.
- **On phones** the Campaigns and Skills screens open under the same 220 px landscape as home, so the signpost's four planks keep 44 px targets.
- **While offline** the sync line shows only **Sync**: the band above the landscape already says it.
- **On phones** the character's title and level no longer break mid-phrase: the small caps are tracked a little tighter, so "Apprentice scribe · level 5" fits on one line, and where a title does not fit the level goes under it, without a stray dot.
- **The landscape of the design** now heads the whole view instead of the character card: a sky with a sun and drifting clouds, birds, cypresses, a tree and a village, three hills and the path, and the walker with a staff and an ochre belt. In a dark theme it is a night with a moon, stars, lit windows and a lamp. It is lower on phones and on the Campaigns and Skills screens, and the clouds hold still with reduced motion. The character card overlaps its foot.
- **Parchment.** Dromos now draws its own surfaces instead of the theme's: parchment panels with a paper grain and an umber hairline, linen buttons, and titles in EB Garamond, a font that now ships inside the plugin, with its license. Dark themes get a night parchment of the same hues. Every text keeps a contrast of 4.5:1 or more.
- **The character card after the design**: a medallion with the level, the name in a large serif, title and level in small caps, a hatched XP bar that says how much XP the next level is away, and the six stats drawn as six pips (a number above six).
- **The panel of Esdras is a scroll**, rolled at its top and bottom, with the text of the day in a large serif and the signature beside **Copy briefing command**.
- **Compact campaign cards on the home screen**: the name, the stalled seal or the tasks done, a road with a segment per task and a gate between phases, and the next step. A card opens the Campaigns screen, where the tasks, the habits and **Send to Habitica** are. A campaign with tasks Habitica no longer has says so in one line.
- **Skills on the home screen** are one row of ring medallions; the ring is the progress, and a medallion opens the Skills screen on its skill. A skill icon written as an icon name, such as `book-open`, is drawn with Obsidian's icons.
- **The Campaigns screen after the design**: a tab per campaign, and for the one shown its kind, name and deadline, the stalled seal, a hatched bar of all its tasks with the next step, **The path** with a flag per phase, and **Tasks by phase**, each task with its state (Done, Next, Pending, Not linked or Not found in Habitica) and **Send to Habitica** where it can be sent. **Open note** opens the campaign's note. Changing tab sends no request.
- **The Skills screen after the design**: a grid of every medallion, earned first, and the detail of the one selected: level and rank or Locked, the stat it feeds, the bar to the next level or the requirements, what counts, and the recent entries of the ledger ("today", "yesterday", "N days ago"; a revert shows its XP with a minus sign).
- **Copy briefing command** sits beside **Read the letter** when the letter is old or missing, and at the end of today's letter.
- **Offline**: a band above the landscape says "Last known state · N ago" and the landscape loses its color; the sync line stays quiet. Other sync failures keep their band in the character card.

### Fixed

- Links in the briefing kept Obsidian's purple, 3.53:1 on the parchment; they are now ochre ink and underlined, 4.9:1 or more, and inline code is a chip of the paper.
- The mission's why showed Esdras's backticks as they were; text in backticks is now code.
- The briefing's text and mission stop at a reading width of about 36em on wide panes.

## [0.7.0] - 2026-11-03

### Changed

- **A warm palette of its own.** Dromos now has its colors, from its visual design, over the theme's surfaces and text: ochre for XP, levels and progress, clay for the stalled seal, olive for a built habit, umber for rules and outlines. Section titles are serif small caps between two short rules, and every title uses a serif your device already has. Light and dark themes both get their own values.
- **A landscape** heads the character card: hills, two cypresses and a robed figure under a pale sky, and a starry night with a lamp in the dark theme. It is drawn with the palette, so it follows the theme.
- **The character comes first.** The sync status and the **Sync** button moved to the foot of the character card, as a quiet line while all is well and a band only when there is something to do. A level-up is a ribbon under the name instead of a banner above the card. On phones the six stats stay three per row, so the card is shorter.
- **Calmer campaigns.** A stalled campaign is marked by its clay seal only, without a red border or bar. The phases are drawn as a road, one stretch per phase. The next step is in italics, the campaigns sit as rows instead of cards inside a card, and the name is underlined because it opens the note. A task or habit that can be sent shows only **Send to Habitica**, without a "Not linked" label beside it.
- **Skills as medallions.** Every skill is a medallion: earned in ochre with its level and rank, locked as a grey silhouette with a lock and the requirement closest to done. Choosing one opens its card.
- On wide panes, today's quests and the campaigns sit side by side.
- **Ask for a briefing** is now **Copy briefing command**, which is what it does. The settings say where Habitica shows the user ID and the token, the phone keyboard no longer capitalizes or corrects them, and the days of the stalled threshold get a number pad.

### Fixed

- Screen readers heard the sync status again every minute, because its "N min ago" changed while the view was open. Now they hear a change of status only.
- The campaign name lost its keyboard focus ring, and on phones its touch area was smaller than a button's.
- Text that fell under the WCAG AA contrast ratio in Obsidian's default themes now reaches it: the Dailies and To-dos headings, a briefing of another day, locked skills, warnings, and the Overdue and Stalled labels. Nothing is dimmed with transparency anymore.
- "Synced 185 min ago" now reads "Synced 3 h ago", and days after a day.
- The task and skill toggles are touch-sized on phones.
- The view declares its language, so a screen reader reads the Spanish interface with a Spanish voice.
- Headings nest: skill names sit under Earned and To unlock, and the panel of Esdras has a heading.
- Sync and Send to Habitica keep keyboard focus while they work.
- With reduced motion, the spinner holds still.

## [0.6.1] - 2026-11-02

### Added

- `docs/`: installation, Habitica, the format of each note and an FAQ.

### Changed

- Pushing a version tag now publishes the release, with no draft to publish by hand. A tag that is not the version in `manifest.json`, or that fails the tests, the lint or the build, publishes nothing.

### Fixed

- The ledger reader used a regular expression iOS below 16.4 cannot parse, so the plugin would not load there.

## [0.6.0] - 2026-11-02

### Added

- **Panel of Esdras.** The view shows `<folder>/Briefing.md` under the character card: the mission of the day, the skill closest to unlocking with what it still asks, and the text rendered as a note, with links you can follow. A briefing of another day stays visible, dimmed, under "Esdras has not written today". Dromos only reads this note.
- **Ask for a briefing**, on desktop: copies the command `/dromos-briefing` to the clipboard, to run in OpenCode from your vault folder. Dromos itself runs nothing.

### Known limits

- The note is read when the view opens and on **Sync**, so a briefing that arrives while the view is open shows on the next **Sync**.

## [0.5.0] - 2026-11-01

### Added

- **`Rules.md`.** The XP table, the streak bonus, both level curves and the rank levels can now be set in `<folder>/Rules.md`. A missing field keeps its default; a value that cannot work keeps its default and is named in the Skills section, as is a field Dromos does not know or a frontmatter it cannot read. New XP values price new rows only, and a changed curve or rank level recomputes every level.
- **Rebuild state from ledger** command: recomputes `Character.md` and the skill notes from the ledger, without Habitica and without adding rows, and creates `Character.md` again if it is missing.
- A toast when a skill unlocks, next to the banner.

### Known limits

- A rebuild cannot recover what only a deleted note held: the `name` and `title` of `Character.md`, and the day a skill unlocked. A skill note created again counts XP only from its new unlock, and a `game_start` created again is the oldest day in the ledger, later than the real start if that first day left no row.
- A rebuild with no sync yet in the session shows habit progress as 0 until the next sync. It changes no unlock.

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
