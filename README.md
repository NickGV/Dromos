# Dromos

> δρόμος, *the race*. "I have finished the race" (2 Tim 4:7).

Dromos is an Obsidian plugin that shows your productive life as a calm role-playing game, set in antiquity: a character with a level and six stats, quests that come from [Habitica](https://habitica.com), campaigns (long projects with phases) that live as notes in your vault, skills that unlock and level up, and a scribe guide who writes you a short daily briefing.

It does not replace anything. Obsidian keeps the knowledge, Habitica keeps the tasks and the gold, Dromos shows the race.

**Status: M5, polish and release.** The interface is in English, with Spanish available in the settings. The "Dromos" tab shows your character from `Dromos/Character.md`, the briefing of Esdras, today's quests from Habitica, your active campaigns and your skills, on desktop and mobile. See the roadmap below.

## What the view shows

- **The scene and its signpost**: the view opens on a landscape, a summer afternoon with a walker on the path, or a night with a moon, stars and a lamp in a dark theme; on parchment colors of its own and titles in EB Garamond, which ships inside the plugin. Its sky follows your device's clock: dawn from 05:00 and dusk from 18:00 warm the horizon and lower the sun, the day runs from 08:00, and from 21:00 a light theme turns to a deep-blue night with the moon (a dark theme keeps its night at every hour, a little warmer at dawn and dusk). The sky turns over two seconds, or at once with reduced motion. When every daily of the day is done, a small campfire burns beside the path; its flame holds still with reduced motion. The walker stands as far along the path as your character is through the level, and at its far end a gate is marked with the next level ("Level 6"); when your XP rises it walks there, and at a level-up it reaches the gate during the ceremony, then starts on the new level. With reduced motion it moves at once. A signpost in the landscape leads to the three screens of the view, **Path** (the home screen described below), **Campaigns** and **Skills**, and to **Settings**, which opens the Dromos tab of Obsidian's settings (the plank is hidden where Obsidian cannot open it). Its planks keep the same order on every screen, and the plank of the screen you are on is burnt into the wood. Campaigns and Skills open with a card naming the screen and your character, level and XP. While Habitica cannot be reached, a band above the landscape says "Last known state · N ago" and the landscape loses its color.
- **Character card**: under the landscape, a medallion with your level, your name, your title and level in small caps, a hatched XP bar (XP into the level / XP the level needs, and how much XP the next level is away), a line under it with what changed since your last visit on this device ("+45 XP since yesterday · Reader +15 · 2 quests": the XP, up to three skills that rose and how many more, and the quests completed, with a minus sign where something was undone), which stays until the view opens again and the six stats (fuerza, vitalidad, inteligencia, sabiduría, espíritu, disciplina) as six pips each, or as a number above six, read from the frontmatter of `<folder>/Character.md`. Dromos keeps the level, the XP and the stats of that note up to date from your ledger; `name` and `title` stay yours. If the note is missing, the card says which path it expected and shows no invented values, and the game does not start.
- **Panel of Esdras**: a scroll, rolled at its top and bottom, with the briefing in `<folder>/Briefing.md`, which the scribe writes and Dromos only reads. It opens folded, as a letter: "Letter from Esdras · today" (or "Last letter · 2 Nov" for one of another day), the mission of the day, the skill closest to unlocking with what it still asks, and the first two lines of the text. **Read the letter · N min** unrolls the rest: why this mission, with its code as code, and the text rendered as a note, with links you can follow; **Fold the letter** at its end rolls it up and takes you back to the top. A letter you have not opened on this device carries an ochre wax seal and "New letter". A briefing of another day stays visible, dimmed; with no note, "Esdras has not written today" is all the panel shows. The note is read when the view opens and on **Sync**. On desktop, **Copy briefing command** copies the command that makes Esdras write it, `/dromos-briefing`, to run in OpenCode from your vault folder; Dromos itself runs nothing. It sits beside **Read the letter** when the letter is old or missing, and at the letter's end otherwise.
- **Today's quests**: one panel, headed by how many of today's dailies are done and the XP the pending ones still pay ("Day complete" once they are all done). Then one list: today's Habitica dailies (a completed one gets its check and is struck through), then pending to-dos that are overdue or due today, then undated to-dos. Future to-dos are hidden. Under each title, its kind, **Mission · 2/5** when it has 3 or more subtasks in Habitica (its checklist, done out of total; display only, it pays no extra XP), the skills it feeds, the XP the ledger writes for it, and Today or Overdue. Dromos does not complete quests: you do that in Habitica, as a quiet line under the panel reminds you ("Complete quests in Habitica · Dromos picks them up on sync").
- **Sync line**, at the foot of the character card, with the **Sync** button: a quiet "Synced N min ago" (hours and days after the first hour) or "Syncing…" while nothing needs you (while offline the line shows only **Sync**, since the band above the landscape says it), and a band when there is something to do: "Invalid token", a reminder to set your credentials, or a request to wait when Habitica limits requests. After a failed sync the list from the last successful sync of this session stays on screen.
- **Campaigns**: on the home screen, a card for every active campaign: its name, the clay **stalled** seal or how many tasks are done, its road (a segment per task, grouped by phase, with a gate between phases) and the next step. Selecting a card opens the **Campaigns** screen. The **Campaigns** screen has a tab for every active project and research, ordered by `priority`, and shows one at a time: its kind, its name, its deadline (`Due 28 Nov · 25 days left`, `Due today`, `3 days overdue` or `No deadline`), the stalled seal, a hatched bar of all its tasks with the next step, **The route** (each phase with its tasks as segments and its count), **Tasks by phase** (a panel per phase, then the tasks without a phase, each with its state: Done, Next, Pending, Not linked or Not found in Habitica, and **Mission · 2/5** when its Habitica to-do has 3 or more subtasks) and its habits. **Open note** opens the campaign's note in a new tab. Changing tab or screen sends no request to Habitica. A campaign is an `index` note that is the `README.md` of a folder under `02 - Projects/`, or a `research` note under `03 - Areas/<area>/Estudio/`, with `status: active`. A project task counts as done when its Habitica to-do (`habitica_id`) is completed; a research counts completed phases. A campaign with no completed task for 14 days (configurable) gets a **stalled** seal.
- **Send to Habitica**: on a project task that has no `habitica_id`, creates the to-do in Habitica once and writes its id back into the note. The button disappears once the id is there, so repeating the click never duplicates the task.
- **Campaign habits**: a project can list `habits` (a title, `days` of streak to build it, default 21, and optionally a `skill`). Each shows its Habitica streak over its target and can be sent to Habitica as a daily. The streak is Habitica's own: one missed day sends it back to zero.
- **Skills**: on the home screen, one row of ring medallions, the ring showing the progress through the level of an earned skill or towards unlocking a locked one; selecting one opens the **Skills** screen on it. An icon written as an icon name, such as `book-open`, is drawn with Obsidian's icons; anything else, such as an emoji, stays as written. The **Skills** screen has a grid of every medallion, earned first, and the detail of the one selected (the first by default): its level and rank or **Locked**, the stat it feeds, the bar to the next level or your progress on every requirement, **What counts** (its description) and its **Recent entries**, the last five rows of the ledger with their XP and day ("+15 XP · 2 Nov"); the day a skill was earned uses the same short date. Every skill starts locked and is earned: a skill asks for several quests, campaigns or habit streaks, and sometimes something you confirm by hand. Its XP counts from the day after it unlocks, and an unlock is permanent. Skills live as notes in `<folder>/Skills/`.
- **Chronicle**: under the skills, the last five deeds of your ledger as a journal, newest first: "Yesterday · Read 20 pages · Reader +10 XP". A deed is one completion of a Habitica task with every skill it fed, "+10 XP" alone for a task without skill; a streak bonus reads "Streak bonus · +5 XP", and something undone in Habitica reads "Undone · Read 20 pages · −10 XP". The day says Today, Yesterday or N days ago for the last week, then the date. It comes from the ledger the game sync already reads, with no request of its own, and shows nothing until there is a deed.
- **Level-up**: when the character levels up, the XP bar fills, the level medallion turns ochre, a ribbon with the new level unfurls over the landscape and a panel opens under the card listing what your skills did in that sync. Skill level-ups and unlocks alone open the panel without the ribbon. **Dismiss** closes it. With reduced motion, everything shows at once. An unlock also shows a short notice.
- **Sync**: fetches the quests, the campaigns' progress and the game again and re-reads the notes. Nothing syncs on a timer.

### How XP works

- Habitica stays the engine: a completed **to-do** is worth 5, 10, 15 or 25 XP by its priority and a completed **daily** 3, 5, 8 or 12; a daily earns 10 more XP every 7 days of streak. Habits (the + and − buttons) give no XP.
- Dromos counts only from the day of its first sync: what you completed before is never turned into progress.
- A stat shows the level its XP would have on the skill curve: it is fed by the unlocked skills that feed it, and `disciplina` also by the dailies that carry no skill.
- A task counts for the character once and, in full, for each unlocked skill it is tagged with (`skill/<id>` tags; Dromos creates them in Habitica when you send a campaign task, and you add them by hand to your own tasks). Unchecking a task takes its XP back.
- Everything is recorded as rows in `<folder>/Ledger/YYYY-MM.md`, one note a month; rows are only ever added.

A minimal `Character.md` (Dromos writes the numbers; you write `name` and `title`):

```yaml
---
name: Nicolás
title: Corredor
total_xp: 0
stats:
  fuerza: 0
  vitalidad: 0
  inteligencia: 0
  sabiduria: 0
  espiritu: 0
  disciplina: 0
---
```

Missing or non-numeric fields fall back to empty text or `0`; a note written with the old four stats still reads.

A `Briefing.md` (`created` decides whether it counts as today's; everything but the text is optional):

```yaml
---
type: dromos-briefing
created: 2026-11-03
mission:
  title: Close the sign-up screen of Kairos
  why: It is the campaign with the nearest deadline.
near_unlock:
  skill: lector
---

Shalom. Today the race asks for one thing.
```

### Changing the rules

The numbers above are defaults. To change them, create `<folder>/Rules.md` with only the fields you want to change; Dromos reads this note and never writes it.

```yaml
---
type: dromos-rules
xp:
  todo: { trivial: 5, easy: 10, medium: 15, hard: 25 }
  daily: { trivial: 3, easy: 5, medium: 8, hard: 12 }
  streak_bonus: { every: 7, xp: 10 }
level_curve: { kind: polynomial, base: 100, exponent: 1.5 }  # the character: round(base * level ^ exponent)
skill_curve: { kind: polynomial, base: 100, exponent: 1.3 }
rank_levels: [1, 5, 10, 15, 20]
---
```

- New XP values price new rows only: a row keeps what it paid. A changed curve or rank level recomputes every level from your past XP at the next sync or rebuild.
- A value that cannot work keeps its default and is named in the **Skills** section: XP that is not a whole number above 0, a curve base below 1, an exponent outside 0 to 10, or rank levels that are not five rising whole numbers starting at 1. A field Dromos does not know is named too, and a note whose frontmatter cannot be read plays entirely by the defaults and says so.

### Rebuilding

The command `Dromos: Rebuild state from ledger` recomputes `Character.md` and the skill notes from the ledger alone: no Habitica request and no new rows, so it works offline and without an account. If `Character.md` is missing it creates it again, with an empty `name` and `title` for you to write back. Those two fields and the day a skill unlocked live only in their notes, so a rebuild cannot recover them from a deleted note, and a `game_start` created again is the oldest day in the ledger.

## Settings

Under *Settings → Community plugins → Dromos*:

| Setting | What it is |
|---|---|
| Habitica user ID | Your Habitica user ID (Habitica: *Settings → Site Data*) |
| Habitica API token | Your Habitica API token; the field is masked |
| Dromos folder | Vault folder holding `Character.md`; default `Dromos` |
| Days before a campaign counts as stalled | Days without a completed task before an active campaign is stamped; default 14. A campaign can set its own with `stale_after_days` |
| Open Dromos on startup | Shows the Dromos view when Obsidian opens; off by default |
| Language | Interface language, English by default; choose Español to see the interface in Spanish. It changes only Dromos' own text, never your notes, and applies at once |

## Network use and privacy

- Dromos calls one external service, the Habitica API at `https://habitica.com/api/v3`, and only when both the user ID and the token are set. It sends read-only requests once when the Dromos tab opens and each time you select **Sync**: `GET /tasks/user?type=dailys` and `type=todos` for the quests, `type=todos` and `type=completedTodos` for the campaigns, `GET /tags` plus the dailies, to-dos and completed to-dos again for the game, and up to 10 `GET /tasks/<id>` for linked tasks and habits that appear in no list (Habitica keeps only the most recently completed to-dos). Only when you select **Send to Habitica** does it send writes: a `POST /tasks/user` that creates one to-do or daily with the title, the notes and the tags, and a `POST /tags` for a `skill/<id>` tag that does not exist yet. A request that has not answered after 15 seconds counts as offline. There is no background polling and no telemetry.
- The requests carry your user ID and token in the `x-api-user` and `x-api-key` headers, as Habitica requires, plus `x-client: <creator's Habitica user ID>-dromos`, which Habitica's [API usage guidelines](https://github.com/HabitRPG/habitica/wiki/API-Usage-Guidelines) ask for: it identifies the tool's author, never you.
- The token is stored only in the plugin's `data.json` (`.obsidian/plugins/dromos/data.json`) on each device. Dromos never writes it to a note, never logs it and never shows it. If you sync your `.obsidian` folder with another tool, that tool copies `data.json` too.
- Which letter of Esdras you last opened is kept on each device, in Obsidian's local storage for the vault (under `dromos:briefing-read`: the letter's date and a short hash of its text), never in a note or in `data.json`. On Obsidian before 1.8.7 it is kept in memory until Obsidian closes.
- What the view last showed on each device is kept the same way, under `dromos:last-seen`: your character's level and total XP, the XP of each skill, how many completed quests the ledger counts and when it was saved. It is what "since your last visit" compares with; it is read and written on the device only and sends nothing anywhere.
- The notes of a to-do created by **Send to Habitica** hold the campaign's title and an `obsidian://` link made of your vault's name and the note's path. They go to your own Habitica account, so anyone who can read that account can read them.
- Quests and campaign progress are kept in memory for the session only. Dromos writes into your notes in four places: the `habitica_id` of a project task or habit when you select **Send to Habitica**; the derived fields of `Character.md` (`level`, `total_xp`, `xp_to_next`, `stats`, `game_start`, `last_sync`, `updated_by`); the derived fields of each skill note (`unlocked`, `unlocked_on`, `level`, `xp`, `xp_to_next`); and new rows at the end of the monthly ledger note. The rebuild command can also create `Character.md` when it is missing. It never writes in `Briefing.md`, `Rules.md`, `research` or `study-session` notes. Obsidian rewrites the frontmatter of a note when Dromos saves it, so comments inside the YAML may be lost.

## Principles

1. **Markdown is the truth.** All game state lives in a `Dromos/` folder of your vault as human-readable frontmatter. Uninstall the plugin and you lose nothing.
2. **Habitica stays the engine.** Tasks are created and completed there. Dromos reads, links and gives context.
3. **State is derived, never accumulated.** XP, levels and stats are recomputed from a ledger of events. Change a formula and rebuild.
4. **Idempotent.** A completed task earns XP exactly once.
5. **Mobile from day one.** No Node or Electron APIs; `requestUrl` instead of `fetch`.

## Roadmap

| Milestone | Delivers |
|---|---|
| M0 Foundations | Repo, build, empty view on desktop and Android |
| M1 Character | Character card from `Dromos/Character.md` and today's Habitica quests |
| M2 Campaigns | Project and research notes with phases, progress and tasks linked by `habitica_id` |
| M3 Skills and XP | Six stats, ledger, level curves, earned skills with ranks, campaign habits, level-up banner, `Rules.md`, rebuild command |
| M4 The guide | Daily briefing written by the scribe, shown in the view |
| M5 Polish | Android pass, BRAT releases, docs |

## Development

Requirements: Node 20 or newer, npm.

```bash
npm install
npm run dev          # esbuild in watch mode -> main.js
npm test             # Vitest: domain, application, adapter and presenter tests
npm run lint         # eslint with the Obsidian plugin rules
npm run build        # type-check + production bundle
```

Install into a local vault for manual testing (defaults to `~/Documents/logos`, override with `DROMOS_VAULT`):

```bash
npm run install:local
```

Then enable **Dromos** under *Settings → Community plugins* and open it from the ribbon icon or the command palette (`Dromos: Open`).

### Recording Habitica fixtures

`test/fixtures/habitica/recorded/` holds real Habitica responses with every id and text replaced by a fake, so tests run against the shape Habitica really sends. To record them again, by hand and never in CI (Node 22.18 or newer):

```bash
HABITICA_USER_ID=... HABITICA_API_TOKEN=... npm run fixtures:habitica
```

The script fetches your dailies, to-dos and completed to-dos, keeps the structure and the values Dromos reads (type, completion, due flags and dates, priority, streak), and turns ids into `00000000-0000-4000-8000-…` and texts into `text 1`, `notes 1` and so on. It writes nothing if any of your strings would reach the files. The raw responses never touch the disk, and the script prints counts only.

To keep the token out of your shell history and off the screen, read both values from the plugin's settings:

```bash
DATA="${DROMOS_VAULT:-$HOME/Documents/logos}/.obsidian/plugins/dromos/data.json"
HABITICA_USER_ID=$(node -p "require('$DATA').habiticaUserId") HABITICA_API_TOKEN=$(node -p "require('$DATA').habiticaApiToken") npm run fixtures:habitica
```

Review the diff before committing the new files.

## Architecture

Hexagonal. The domain is plain TypeScript and never imports `obsidian` or `react`; that is what makes the game rules testable in milliseconds.

```
src/
├── main.ts          # Plugin entry: registers the view, ribbon, command and settings tab
├── composition/     # Composition root: settings, adapters and use cases wired once per load
├── domain/          # Character, Skill, Quest, Campaign, Ledger, rules (LevelCurve, XpRules, UnlockRules)
├── application/     # Use cases: LoadHome, SyncGameState, LinkTaskToCampaign
├── ports/           # Interfaces: GameStateRepository, CampaignRepository, TaskSource, Clock, SettingsStore
├── adapters/
│   ├── vault/       # Frontmatter and ledger persistence through the Obsidian vault API
│   ├── habitica/    # Habitica REST client over requestUrl
│   └── obsidian/    # Settings store, clock
└── ui/              # React: atoms, molecules, organisms, containers, presenters, DromosView (ItemView)
test/                # Vitest; fixtures under test/fixtures
```

Dependencies point inwards: `ui` and `adapters` know Obsidian; `application` knows `domain` and `ports`; `domain` knows nothing.

## Installing with BRAT

Install [BRAT](https://github.com/TfTHacker/obsidian42-brat), choose *Add a beta plugin* and paste this repository's URL. Each tagged release ships `main.js`, `manifest.json` and `styles.css`. See [the documentation](docs/README.md) for installation, Habitica, the note formats and an FAQ.

## License

MIT.
