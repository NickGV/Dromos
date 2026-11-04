# Dromos

> δρόμος, *the race*. "I have finished the race" (2 Tim 4:7).

Dromos is an Obsidian plugin that shows your productive life as a calm role-playing game, set in antiquity: a character with a level and six stats, quests that come from [Habitica](https://habitica.com), campaigns (long projects with phases) that live as notes in your vault, skills that unlock and level up, and a scribe guide who writes you a short daily briefing.

It does not replace anything. Obsidian keeps the knowledge, Habitica keeps the tasks and the gold, Dromos shows the race.

**Status: M5, polish and release.** The interface is in English, with Spanish available in the settings. The "Dromos" tab shows your character from `Dromos/Character.md`, the briefing of Esdras, today's quests from Habitica, your active campaigns and your skills, on desktop and mobile. See the roadmap below.

## What the view shows

- **Character card**: a landscape (a starry night in the dark theme), then name, title, level, an XP bar (XP into the level / XP the level needs) and the six stats (fuerza, vitalidad, inteligencia, sabiduría, espíritu, disciplina), read from the frontmatter of `<folder>/Character.md`. Dromos keeps the level, the XP and the stats of that note up to date from your ledger; `name` and `title` stay yours. If the note is missing, the card says which path it expected and shows no invented values, and the game does not start.
- **Panel of Esdras**: the briefing in `<folder>/Briefing.md`, which the scribe writes and Dromos only reads: the mission of the day, the skill closest to unlocking with what it still asks, and the text rendered as a note, with links you can follow. A briefing of another day stays visible, dimmed, under "Esdras has not written today"; with no note, that line is all the panel shows. The note is read when the view opens and on **Sync**. On desktop, **Copy briefing command** copies the command that makes Esdras write it, `/dromos-briefing`, to run in OpenCode from your vault folder; Dromos itself runs nothing.
- **Today's quests**: today's Habitica dailies (completed ones struck through), then pending to-dos that are overdue or due today, then undated to-dos. Future to-dos are hidden.
- **Sync line**, at the foot of the character card, with the **Sync** button: a quiet "Synced N min ago" (hours and days after the first hour) or "Syncing…" while all is well, and a band when there is something to do: "Offline", "Invalid token", a reminder to set your credentials, or a request to wait when Habitica limits requests. After a failed sync the list from the last successful sync of this session stays on screen.
- **Campaigns**: every active project and research, ordered by `priority`. A campaign is an `index` note that is the `README.md` of a folder under `02 - Projects/`, or a `research` note under `03 - Areas/<area>/Estudio/`, with `status: active`. Each campaign shows its kind, the open phase and its progress, the next step, its phases drawn as a road (one stretch per phase, the open one taller) and, folded, its tasks. A project task counts as done when its Habitica to-do (`habitica_id`) is completed; a research counts completed phases. A campaign with no completed task for 14 days (configurable) gets a **Stalled** seal. The underlined name opens the note in a new tab.
- **Send to Habitica**: on a project task that has no `habitica_id`, creates the to-do in Habitica once and writes its id back into the note. The button disappears once the id is there, so repeating the click never duplicates the task.
- **Campaign habits**: a project can list `habits` (a title, `days` of streak to build it, default 21, and optionally a `skill`). Each shows its Habitica streak over its target and can be sent to Habitica as a daily. The streak is Habitica's own: one missed day sends it back to zero.
- **Skills**: a medallion for every skill. An earned one is ochre, with its level and its rank under its name; one still to unlock (folded) is a grey silhouette with a lock and the requirement closest to done. Choosing a medallion opens its card: level, rank, XP bar and description, or what it asks for and your progress on every requirement. Every skill starts locked and is earned: a skill asks for several quests, campaigns or habit streaks, and sometimes something you confirm by hand. Its XP counts from the day after it unlocks, and an unlock is permanent. Skills live as notes in `<folder>/Skills/`.
- **Level-up ribbon**: when the character or a skill levels up, or a skill unlocks, a dismissible ribbon under the name in the character card says so the next time the view updates.
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
| Language | Interface language, English by default; choose Español to see the interface in Spanish. It changes only Dromos' own text, never your notes, and applies at once |

## Network use and privacy

- Dromos calls one external service, the Habitica API at `https://habitica.com/api/v3`, and only when both the user ID and the token are set. It sends read-only requests once when the Dromos tab opens and each time you select **Sync**: `GET /tasks/user?type=dailys` and `type=todos` for the quests, `type=todos` and `type=completedTodos` for the campaigns, `GET /tags` plus the dailies, to-dos and completed to-dos again for the game, and up to 10 `GET /tasks/<id>` for linked tasks and habits that appear in no list (Habitica keeps only the most recently completed to-dos). Only when you select **Send to Habitica** does it send writes: a `POST /tasks/user` that creates one to-do or daily with the title, the notes and the tags, and a `POST /tags` for a `skill/<id>` tag that does not exist yet. A request that has not answered after 15 seconds counts as offline. There is no background polling and no telemetry.
- The requests carry your user ID and token in the `x-api-user` and `x-api-key` headers, as Habitica requires, plus `x-client: <creator's Habitica user ID>-dromos`, which Habitica's [API usage guidelines](https://github.com/HabitRPG/habitica/wiki/API-Usage-Guidelines) ask for: it identifies the tool's author, never you.
- The token is stored only in the plugin's `data.json` (`.obsidian/plugins/dromos/data.json`) on each device. Dromos never writes it to a note, never logs it and never shows it. If you sync your `.obsidian` folder with another tool, that tool copies `data.json` too.
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

Install into a local vault for manual testing (defaults to `~/Documents/second_brain`, override with `DROMOS_VAULT`):

```bash
npm run install:local
```

Then enable **Dromos** under *Settings → Community plugins* and open it from the ribbon icon or the command palette (`Dromos: Open`).

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
