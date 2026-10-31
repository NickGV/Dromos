# Dromos

> δρόμος, *the race*. "I have finished the race" (2 Tim 4:7).

Dromos is an Obsidian plugin that shows your productive life as a calm role-playing game, set in antiquity: a character with a level and four stats, quests that come from [Habitica](https://habitica.com), campaigns (long projects with phases) that live as notes in your vault, skills that unlock and level up, and a scribe guide who writes you a short daily briefing.

It does not replace anything. Obsidian keeps the knowledge, Habitica keeps the tasks and the gold, Dromos shows the race.

**Status: M2, campaigns.** The "Dromos" tab shows your character from `Dromos/Character.md`, today's quests from Habitica and your active campaigns, on desktop and mobile. See the roadmap below.

## What the view shows

- **Character card**: name, title, level, an XP bar (XP into the level / XP the level needs) and the four stats (fuerza, inteligencia, espíritu, disciplina), read from the frontmatter of `<folder>/Character.md`. The level comes from `total_xp`; edit the note and reopen the tab (or select **Sincronizar**) to see the change. If the note is missing, the card says which path it expected and shows no invented values.
- **Quests de hoy**: today's Habitica dailies (completed ones struck through), then pending to-dos that are overdue or due today, then undated to-dos. Future to-dos are hidden.
- **Status band**: "Sincronizado hace N min", "Sincronizando…", "Sin conexión", "Token inválido", a reminder to set your credentials, or a request to wait when Habitica limits requests. After a failed sync the list from the last successful sync of this session stays on screen.
- **Campañas**: every active project and research, ordered by `priority`. A campaign is an `index` note that is the `README.md` of a folder under `02 - Projects/`, or a `research` note under `03 - Areas/<area>/Estudio/`, with `status: active`. Each card shows its kind, the open phase with a progress bar, the next step and, folded, its tasks. A project task counts as done when its Habitica to-do (`habitica_id`) is completed; a research counts completed phases. A campaign with no completed task for 14 days (configurable) gets a **Detenida** stamp. The name opens the note in a new tab.
- **Enviar a Habitica**: on a project task that has no `habitica_id`, creates the to-do in Habitica once and writes its id back into the note. The button disappears once the id is there, so repeating the click never duplicates the task.
- **Sincronizar**: fetches the quests and the campaigns' progress again and re-reads the character note and the campaign notes. Nothing syncs on a timer.

A minimal `Character.md`:

```yaml
---
name: Nicolás
title: Corredor
total_xp: 340
stats:
  fuerza: 2
  inteligencia: 4
  espiritu: 3
  disciplina: 5
---
```

Missing or non-numeric fields fall back to empty text or `0`.

## Settings

Under *Settings → Community plugins → Dromos*:

| Setting | What it is |
|---|---|
| ID de usuario de Habitica | Your Habitica user ID (Habitica: *Settings → Site Data*) |
| Token de API de Habitica | Your Habitica API token; the field is masked |
| Carpeta de Dromos | Vault folder holding `Character.md`; default `Dromos` |
| Días para marcar una campaña como detenida | Days without a completed task before an active campaign is stamped; default 14. A campaign can set its own with `stale_after_days` |

## Network use and privacy

- Dromos calls one external service, the Habitica API at `https://habitica.com/api/v3`, and only when both the user ID and the token are set. It sends read-only requests once when the Dromos tab opens and each time you select **Sincronizar**: `GET /tasks/user?type=dailys` and `type=todos` for the quests, `type=todos` and `type=completedTodos` for the campaigns, plus up to 10 `GET /tasks/<id>` for linked tasks that appear in neither list (Habitica keeps only the 30 most recently completed). Only when you select **Enviar a Habitica** does it send a `POST /tasks/user` that creates one to-do with the task's title and notes. A request that has not answered after 15 seconds counts as offline. There is no background polling and no telemetry.
- The requests carry your user ID and token in the `x-api-user` and `x-api-key` headers, as Habitica requires, plus `x-client: <creator's Habitica user ID>-dromos`, which Habitica's [API usage guidelines](https://github.com/HabitRPG/habitica/wiki/API-Usage-Guidelines) ask for: it identifies the tool's author, never you.
- The token is stored only in the plugin's `data.json` (`.obsidian/plugins/dromos/data.json`) on each device. Dromos never writes it to a note, never logs it and never shows it. If you sync your `.obsidian` folder with another tool, that tool copies `data.json` too.
- The notes of a to-do created by **Enviar a Habitica** hold the campaign's title and an `obsidian://` link made of your vault's name and the note's path. They go to your own Habitica account, so anyone who can read that account can read them.
- Quests and campaign progress are kept in memory for the session only. The only thing Dromos writes into a note is the `habitica_id` of a project task, when you select **Enviar a Habitica**; it never writes in `research` or `study-session` notes. Obsidian rewrites the frontmatter of that note when it saves the id, so comments inside the YAML may be lost.

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
| M3 Skills and XP | Ledger, level curve, unlocks, celebrations |
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

Once releases exist: install [BRAT](https://github.com/TfTHacker/obsidian42-brat), choose *Add a beta plugin* and paste this repository's URL. Each tagged release ships `main.js`, `manifest.json` and `styles.css`.

## License

MIT.
