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

Add the tag `skill/<id>` to the task, where `<id>` is the file name of the skill note, in lowercase with no spaces: `skill/lector` for `Skills/lector.md`.

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

A project task or habit with no `habitica_id` shows a **Send to Habitica** button. It creates the to-do or daily and writes its id back into the note, so the button disappears and repeating the click creates nothing. A habit beside the Library's desk, declared in an area note (`type: archeion`, ADR-017), works the same way: the same daily, tags and requests as a campaign habit, and only its `habitica_id` is written into the area note.

Two messages name an id, and both mean the task already exists in Habitica:

| Message | What to do |
|---|---|
| The id could not be saved in the note | Write it yourself as `habitica_id`. Sending again would create a second task |
| A duplicate was created | Delete the task with that id in Habitica. This happens when the note was linked at the same moment from elsewhere |

The notes of a created to-do or daily hold the title of its campaign (or of its area) and a Markdown link, **Open in Obsidian** (in the language of the settings), to an `obsidian://` address made of your vault's name and the note's path. Habitica, on the web and on Android, makes only web and mail addresses clickable on their own, so a bare `obsidian://` address, as in the tasks sent before 0.12.1, stays plain text; the Markdown link opens the note. They go only to your own account.

## Start reading a book

A pending book (`status: planning`) offers **Empezar a leer** on its card in the library. It creates one reading to-do per book, then writes `status: active`, `started` (today) and its `habitica_id` into the book note:

- The title is "Leer: " and the book's title; the notes hold the link to the book note, **Abrir en Obsidian**.
- It carries the `skill/lector` tag, created if it does not exist yet, so completing it counts for **lector** like any other to-do.
- Its checklist has five unchecked items: "Terminar de leer" and the four questions of the reflection.

If Habitica fails, nothing is written and the book stays pending. If the to-do was created but the note could not be saved, the message names the to-do's id, as with **Send to Habitica**. A book that already has a `habitica_id` never gets a second to-do: starting it only writes the state and the date.

**Terminar** on a book being read writes `status: completed` and `finished` (today). It does not complete the to-do in Habitica; that stays yours, once the reflection is written. Dromos seals the book only when the four sections of the reflection have text.

## The Shop

The **Shop** plank of the signpost opens the Shop: your Habitica gold and your own Habitica rewards (Habitica's *Rewards* column). Dromos keeps no currency of its own: the gold is Habitica's, and the Shop is the only place Dromos shows it, as a whole number.

- **Buy** asks first. The confirmation names the reward, its price and the gold you will have left; only **Buy** in it spends gold. Cancel, Escape or closing it buys nothing.
- Buying spends the gold in Habitica, exactly as clicking the reward there does, and the Shop shows the gold Habitica answers with. Habitica keeps the reward, so you can buy it again.
- A reward that costs more than your gold cannot be bought: its button stays quiet and says how much gold is missing.
- Offline or without credentials the Shop says so and nothing can be bought.
- A purchase that fails says what happened. When Habitica did not answer at all, Dromos cannot tell whether the gold was taken: check your gold in Habitica before buying again.

### Esdras's offers

Esdras can offer you things in `<folder>/Shop.md` (`type: dromos-shop`), a table he writes and Dromos only reads:

| Column | What it holds |
|---|---|
| `id` | A short name of lowercase letters, digits and hyphens, never used again |
| `offer` | What is offered |
| `price` | Whole gold above 0 |
| `why` | Why he offers it; may be empty |
| `until` | The last day it is offered, `YYYY-MM-DD`, or empty |

The Shop shows the offers not bought yet whose last day is today or later. Dromos reads the first table with that header, by the names of its columns, so their order and the Table Editor's spacing do not matter. A row with a bad `id`, `price` or `until`, or with no offer, is skipped and the Shop names its line; with a repeated `id` the first row counts.

Buying an offer, after the same confirmation as a reward:

1. Dromos looks up the Habitica reward with alias `dromos-offer-<id>` and creates it only when it does not exist, so trying again never creates a second one.
2. It buys that reward, which spends the gold.
3. It writes the purchase into `Purse.md` with the offer's `id`, so the offer is not offered again.
4. It deletes that reward from Habitica.

A reward whose alias starts with `dromos-offer-` is never listed among your own, even when deleting it failed.

### The purse

Every purchase is written into `<folder>/Purse.md` (`type: dromos-purse`) once Habitica confirms it: a table `| date | kind | what | gold | level | offer |`, one `purchase` row with the price as negative gold, and the offer's `id` for one of Esdras's offers. Only Dromos writes it; the Shop lists its last five purchases, offline too. A purchase that fails writes nothing. If Habitica bought it but the note could not be written, the toast says so.

### The level bonus

Each new level of the character adds gold in Habitica: `gold_per_level` times the level reached, 10 a level unless `Rules.md` sets `gold_per_level` (a whole number above 0), so reaching level 3 adds 30. Two levels at once pay both. A toast tells it, "+30 gold for reaching level 3".

- Only a level-up a sync finds is paid: levels reached before this version are not.
- Each level is paid once. Right before paying, Dromos reads `Purse.md` again; a level with a `bonus` row there is never paid again. The row is written once Habitica confirms the gold.
- A payment Habitica refuses (invalid token, too many requests) writes nothing and is tried again on the next sync, also after Obsidian restarts on that device.
- A payment with no clear answer (no answer within 15 seconds, an error status) may still have reached Habitica. That device keeps the gold it read and the gold it asked for, and the next sync reads your gold first. If it is the gold asked for, the bonus was paid: Dromos writes its row and sends nothing. If it is the gold read before, it was not: Dromos pays it again. If it is neither, Dromos never pays that level again and a toast asks you to check your gold in Habitica.
- Dromos reads your gold and writes it back plus the bonus. If you spend gold in Habitica at that very second, one can overwrite the other. If two devices find the same level-up before `Purse.md` syncs between them, the bonus can be paid twice.

## When Dromos talks to Habitica

Only when the tab opens, when you select **Sync**, when you open the Shop and when you act on a button. Nothing runs on a timer, and there is no telemetry.

| Action | Requests |
|---|---|
| Opening the tab or selecting **Sync** | About eight reads, plus up to 10 for linked tasks missing from the lists. The habits beside the Library's desk are looked up in the same sync and share that cap of 10; opening the Library sends nothing |
| **Send to Habitica** | One write for the task. With skills, one read of your tags and one write for each that does not exist. The same for a habit beside the Library's desk |
| **Empezar a leer** | One read of your tags, one write for `skill/lector` if it does not exist, and one write for the to-do. None for a book that already has a `habitica_id` |
| **Terminar** | None |
| Opening the Shop, or selecting **Sync** on it | Two reads: `GET /user?userFields=stats` for the gold and `GET /tasks/user?type=rewards` for your rewards |
| **Buy** on one of your rewards, once confirmed | One write, `POST /tasks/<id>/score/up`, which spends the gold and answers with it. If Habitica refuses (it answers a short purse as it answers bad credentials), one more read of the gold tells which it was |
| **Buy** on one of Esdras's offers, once confirmed | One read, `GET /tasks/dromos-offer-<id>`; one write to create the reward when it does not exist, `POST /tasks/user`; one write to buy it, `POST /tasks/<id>/score/up`; one write to delete it, `DELETE /tasks/<id>`. Opening the Shop reads `Shop.md` from the vault, with no request |
| A sync that finds a new level, or a bonus still owed | One read of the gold, `GET /user?userFields=stats`, and one write per level, `PUT /user` with `stats.gp` set to that gold plus the bonus. None when no bonus is owed |

Habitica allows 30 requests per minute. A request with no answer after 15 seconds counts as offline.

## Status band

The sync status sits at the foot of the character card, next to **Sync**. While all is well it is a quiet line ("Synced 3 min ago", "Syncing…"). It becomes a band when there is something to do:

| It says | What to do |
|---|---|
| Connect your Habitica account | Enter both credentials in the settings |
| Invalid token | Check the user ID and the token. It also shows, with no request to Habitica, when either one has a space, a line break, an accent or an invisible character inside, which a paste can leave |
| Last known state · N ago (a band above the landscape; the line shows only **Sync**) | Check your connection, then select **Sync** |
| Too many requests to Habitica | Wait the time it shows, then select **Sync** |
| Could not sync with Habitica | Try again in a few minutes |

After a failed sync, the last list from this session stays on screen.

A task marked **Not found in Habitica** has a `habitica_id` Habitica does not know, usually because the task was deleted there. Correct or remove the id in the note.

## Known limits

- A daily counts for XP only if Dromos sees it completed on the day it was done, so open the tab that day. Its streak still counts for habits and unlocks.
- A daily that Habitica still shows as done after midnight can count again for the new day. A sync on that same day after Habitica rolls over takes it back; a later sync does not.
- Dromos' day is America/Bogota's, whatever your device says. In another time zone it changes at a different hour from yours.
