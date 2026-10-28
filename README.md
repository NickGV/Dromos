# Dromos

> δρόμος, *the race*. "I have finished the race" (2 Tim 4:7).

Dromos is an Obsidian plugin that shows your productive life as a calm role-playing game, set in antiquity: a character with a level and four stats, quests that come from [Habitica](https://habitica.com), campaigns (long projects with phases) that live as notes in your vault, skills that unlock and level up, and a scribe guide who writes you a short daily briefing.

It does not replace anything. Obsidian keeps the knowledge, Habitica keeps the tasks and the gold, Dromos shows the race.

**Status: M0, foundations.** The plugin builds, opens an empty "Dromos" tab on desktop and mobile, and nothing else yet. See the roadmap below.

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
| M2 Campaigns | Project notes with phases and tasks linked by `habitica_id` |
| M3 Skills and XP | Ledger, level curve, unlocks, celebrations |
| M4 The guide | Daily briefing written by the scribe, shown in the view |
| M5 Polish | Android pass, BRAT releases, docs |

## Development

Requirements: Node 20 or newer, npm.

```bash
npm install
npm run dev          # esbuild in watch mode -> main.js
npm test             # Vitest: domain and application tests
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
├── main.ts          # Plugin entry: registers the view, ribbon and commands
├── domain/          # Character, Skill, Quest, Campaign, Ledger, rules (LevelCurve, XpRules, UnlockRules)
├── application/     # Use cases: LoadHome, SyncGameState, LinkTaskToCampaign
├── ports/           # Interfaces: GameStateRepository, CampaignRepository, TaskSource, Clock, SettingsStore
├── adapters/
│   ├── vault/       # Frontmatter and ledger persistence through the Obsidian vault API
│   ├── habitica/    # Habitica REST client over requestUrl
│   └── obsidian/    # Settings store, clock
└── ui/              # React: atoms, molecules, organisms, containers, DromosView (ItemView)
test/                # Vitest; fixtures under test/fixtures
```

Dependencies point inwards: `ui` and `adapters` know Obsidian; `application` knows `domain` and `ports`; `domain` knows nothing.

## Installing with BRAT

Once releases exist: install [BRAT](https://github.com/TfTHacker/obsidian42-brat), choose *Add a beta plugin* and paste this repository's URL. Each tagged release ships `main.js`, `manifest.json` and `styles.css`.

## License

MIT.
