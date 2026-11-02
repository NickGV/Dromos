# Installation

Dromos installs through [BRAT](https://github.com/TfTHacker/obsidian42-brat) and works on desktop and mobile.

## Quick path

1. In Obsidian, install and enable **BRAT** from the community plugins.
2. Run BRAT's command **Plugins: Add a beta plugin for testing** and paste `https://github.com/NickGV/Dromos`.
3. Enable **Dromos** under *Settings → Community plugins*.
4. Fill in the settings below and open the tab from the ribbon icon or with `Dromos: Open`.

Repeat it on each device.

## Settings

Under *Settings → Community plugins → Dromos*:

| Setting | What it is | Default |
|---|---|---|
| Habitica user ID | See [Habitica](habitica.md#connect-your-account) | empty |
| Habitica API token | Masked, and stored only on this device | empty |
| Dromos folder | Vault folder that holds `Character.md` | `Dromos` |
| Days before a campaign counts as stalled | Days without a completed task | 14 |
| Language | Interface language, English or Español | English |

## What the game needs to start

| Needed | Without it |
|---|---|
| `<folder>/Character.md`, see [its format](frontmatter.md#character) | The tab names the path it expected, and the game does not start |
| Habitica credentials | The tab asks you to connect your account |
| Skill notes in `<folder>/Skills/`, see [their format](frontmatter.md#skill) | The Skills section is empty; XP still counts for the character |

The game starts on the day of your first successful sync. What you completed before that day never becomes progress.

## Commands

| Command | What it does |
|---|---|
| `Dromos: Open` | Opens the tab |
| `Dromos: Rebuild state from ledger` | Recomputes `Character.md` and the skill notes from the ledger, with no Habitica request. See [Rebuilding](../README.md#rebuilding) |

## Updating

BRAT can update at startup, or you can run its command **Plugins: Check for updates to all beta plugins and UPDATE**. Then close Obsidian and open it again.

**Check the result** under *Settings → Community plugins → Dromos*. If it still shows the old version, see [the FAQ](faq.md#i-updated-and-still-see-the-old-version).

## Removing it

Remove Dromos and BRAT's entry for it from their settings. Your notes stay as they are, because they are ordinary Markdown. Habitica keeps your tasks and the `skill/<id>` tags.

## Next step

[Connect Habitica](habitica.md).
