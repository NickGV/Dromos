# Habitica

Habitica stays the engine: you create and complete tasks there, and Dromos reads them and turns them into XP.

## Connect your account

1. In Habitica, open *Settings → Site Data* and copy your **User ID** and **API Token**.
2. Paste them under *Settings → Community plugins → Dromos*.
3. Open the Dromos tab, or select **Sync**.

**Expected result:** the status band says "Synced" and today's quests appear.

The token stays in this device's `data.json`. Dromos never writes it to a note, logs it or shows it. If another tool syncs your `.obsidian` folder, that tool copies the file too.

## How tasks turn into XP

| Task | XP by priority (trivial, easy, medium, hard) |
|---|---|
| To-do | 5, 10, 15, 25 |
| Daily | 3, 5, 8, 12 |
| Daily streak | 10 more XP every 7 days of streak |
| Habit (the + and − buttons) | None |

- Unchecking a task takes its XP back.
- A task counts once for the character and, in full, for each unlocked skill it is tagged with.
- A skill earns XP from the day after it unlocks.

These numbers are defaults; [you can change them](../README.md#changing-the-rules).

## Tag a task with a skill

Add the tag `skill/<id>` to the task, where `<id>` is the file name of the skill note: `skill/lector` for `Skills/lector.md`.

**Send to Habitica** puts the tags on what it creates and creates the ones that do not exist. On your own tasks you add them by hand.

## What unlocks a skill

A skill unlocks when all its requirements are met, and an unlock is permanent.

| Requirement | What counts |
|---|---|
| `quests` | Different to-dos completed with its tag and not unchecked since. Dailies never count, and to-dos done while it is locked do |
| `campaigns` | Completed campaigns that name the skill |
| `habit` | The longest current streak among dailies with its tag. The streak is Habitica's, so a missed day starts it again |
| `manual` | Something you confirm yourself, with `confirmed: true` in the note |

## Send to Habitica

A project task or habit with no `habitica_id` shows a **Send to Habitica** button. It creates the to-do or daily once and writes its id back into the note, so the button disappears and cannot create a duplicate.

The notes of a created to-do hold the campaign's title and an `obsidian://` link made of your vault's name and the note's path. They go only to your own account.

## When Dromos talks to Habitica

Only when the tab opens and when you select **Sync**. Nothing runs on a timer, and there is no telemetry.

| Action | Requests |
|---|---|
| Opening the tab or selecting **Sync** | About eight reads, plus up to 10 for linked tasks missing from the lists |
| **Send to Habitica** | One write for the task, one for each tag that does not exist |

Habitica allows 30 requests per minute. A request with no answer after 15 seconds counts as offline.

## Status band

| It says | What to do |
|---|---|
| Connect your Habitica account | Enter both credentials in the settings |
| Invalid token | Check the user ID and the token |
| Offline | Check your connection, then select **Sync** |
| Too many requests to Habitica | Wait the time it shows, then select **Sync** |

After a failed sync, the last list from this session stays on screen.

## Known limits

- A daily counts for XP only if Dromos sees it completed on the day it was done, so open the tab that day. Its streak still counts for habits and unlocks.
- A daily that Habitica still shows as done after your local midnight can count again for the new day. A sync on that same day after Habitica rolls over takes it back; a later sync does not.
