# FAQ

## Updating

### I updated and still see the old version

Close Obsidian completely and open it again, because an open window keeps the code it loaded.

If you use Obsidian Sync with community plugins, the new files can arrive a few seconds after the app has started. That window also holds the old code, and one more restart fixes it.

## XP and levels

### My old tasks gave no XP

Dromos counts from the day of its first sync, so past completions never become progress.

### A task gave XP to the character but not to a skill

Check these three things:

1. The task has the tag `skill/<id>`, matching the file name of the skill note, which must be lowercase with no spaces.
2. The skill is unlocked. While it is locked, tagged to-dos count toward unlocking it instead.
3. The skill was already unlocked the day before. Its XP counts from the day after it unlocks.

### A daily gave no XP

A daily counts only if Dromos sees it completed on the day it was done, so open the tab that day. Its streak still counts for habits and unlocks.

### A daily counted again after midnight

Habitica may still show it as done before your day rolls over. A sync on that same day after the rollover takes it back; a later sync does not.

### I unchecked a task

The next sync adds a `revert` row and takes the XP back. The old row stays, because the ledger only grows.

### I changed a number in `Rules.md` and old rows did not change

That is by design: a row keeps what it paid. A changed curve or rank level does recompute every level at the next sync or rebuild.

## Notes

### Something in my notes looks wrong after a sync

Run `Dromos: Rebuild state from ledger`. It recomputes the notes from the ledger, with no Habitica request.

### I deleted `Character.md`

The same command creates it again. `name` and `title` lived only in that note, so write them back. A `game_start` created again is the oldest day in the ledger.

### I edited a ledger row by hand

A damaged row is listed as unreadable in the Skills section. Dromos cannot know what it said, so it may add that change again. A row repeated exactly counts once.

### A skill does not appear, or the Skills section names a note

If the section names it, the note could not be read, and it says why. If it says nothing, check that the note has `type: dromos-skill`, because any other note in the folder is ignored. See [the skill format](frontmatter.md#skill).

### My comments in the frontmatter disappeared

Obsidian rewrites the frontmatter when Dromos saves a note. Keep comments in the body.

## Several devices

### Can I use Dromos on several devices?

Yes. Install it on each one and enter your credentials on each, because they stay on that device. Rows two devices add alike count once.

### `last_sync` did not change after a sync

It changes only when the sync changed something, so it does not prove that a sync ran.

### A note written on one device does not reach another

Obsidian Sync runs only while the app is open on both ends. A briefing written on a computer reaches your phone once Obsidian has been open on that computer.

## The panel of Esdras

### It says "Esdras has not written today"

No briefing is dated today. On desktop, **Copy briefing command** copies `/dromos-briefing`; run it in OpenCode from your vault folder, then select **Sync**.

### The button is missing on my phone

That is by design: the command runs on a computer.

### The letter shows only its first lines

The panel opens folded so the quests stay in sight. Select **Read the letter** to unroll it, and **Fold the letter** at its end to roll it up.

### The wax seal comes back on another device

Each device remembers on its own which letter you opened, so a letter read on your computer is still new on your phone.

### A new briefing does not show

The panel reads the note when the tab opens and on **Sync**. Select **Sync**.

### The mission talks about old work

The briefing comes from your notes, so check the note it cites. Most often `phases` in the project note is out of date.

## Habitica

### "Too many requests to Habitica"

Habitica allows 30 requests per minute, and each sync makes about eight. Wait the time it shows.

### A campaign is stamped "Stalled"

No task of it was completed for the days in the setting (14 by default), or for its own `stale_after_days`. A campaign with no completed task counts from `created`.

## Time

### The day changes at the wrong hour

Dromos' day is America/Bogota's, whatever your device says. It does not read your time zone yet.
