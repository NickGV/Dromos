# Note formats

Every note Dromos uses is plain Markdown with YAML frontmatter. A missing or wrongly typed field falls back to a default; it never breaks the view.

**Avoid comments inside the frontmatter of notes Dromos writes:** Obsidian rewrites the frontmatter when Dromos saves, so comments may be lost.

**Days are America/Bogota's.** Every "day" below is the calendar day in that time zone, whatever your device says. Dromos does not read your zone yet.

| Note | Section |
|---|---|
| `Character.md` | [Character](#character) |
| `Skills/<id>.md` | [Skill](#skill) |
| `README.md` of a project | [Project](#project) |
| A research and its sessions | [Research](#research) |
| A book, `type: book` | [Book](#book) |
| `Ledger/YYYY-MM.md` | [Ledger](#ledger) |
| `Briefing.md` | [Briefing](#briefing) |
| `Rules.md` | [Changing the rules](../README.md#changing-the-rules) |

## Character

`<folder>/Character.md`. You write `name` and `title`; Dromos writes the rest.

```yaml
---
type: dromos-character
created: 2026-10-28
name: Nicolás
title: Corredor
---
```

| Field | Written by | Meaning |
|---|---|---|
| `name`, `title` | You | Shown on the card |
| `level`, `total_xp`, `xp_to_next` | Dromos | Derived from the ledger |
| `stats` | Dromos | `fuerza`, `vitalidad`, `inteligencia`, `sabiduria`, `espiritu`, `disciplina` |
| `game_start` | Dromos | The day of the first sync; nothing before it counts |
| `last_sync` | Dromos | The last sync that changed something, not the last sync that ran |
| `updated_by` | Dromos | `dromos` |

## Skill

`<folder>/Skills/<id>.md`. The file name is the id, and it must be lowercase with no spaces: tags are read in lowercase, so `Lector.md` would pass as a note and never receive a quest.

```yaml
---
type: dromos-skill
created: 2026-10-31
id: centinela
name: "Centinela"
icon: 🛡️
stat: disciplina
description: "Proteger la atención con deep work."
habitica_tag: skill/centinela
ranks:
  - name: "Distraído"
    description: "Su atención se la lleva el teléfono."
requirements:
  - { kind: habit, days: 21 }
  - { kind: quests, count: 5 }
  - { kind: campaigns, count: 1 }
  - { kind: manual, id: deep-work-test, text: "Pasar el Deep Work Test", confirmed: false, confirmed_on: null }
---
```

| Field | Rule |
|---|---|
| `type` | Must be `dromos-skill`; any other note in the folder is ignored, with no message |
| `id` | Optional; if present it must equal the file name |
| `stat` | Required, one of the six stats |
| `habitica_tag` | Optional; if present it must be `skill/<id>` |
| `ranks` | Up to five, in order; they apply at levels 1, 5, 10, 15 and 20 |
| `requirements` | All must be met, and a skill with none never unlocks. See [what each kind counts](habitica.md#what-unlocks-a-skill) |

Dromos writes `unlocked`, `unlocked_on`, `level`, `xp` and `xp_to_next`. An `unlocked: true` you set by hand also counts, and it stays.

A note with a wrong `id`, `stat`, tag or requirement is not read at all, and the Skills section names it with the reason. A requirement that cannot be read is never skipped, because that would make the skill easier to unlock.

## Project

The `README.md` of a folder under `02 - Projects/`, with `type: index`. It shows as a campaign while `status` is `active`.

```yaml
---
type: index
title: Kairos
status: active
priority: high
created: 2026-10-05
skill: desarrollador
stale_after_days: 30
phases:
  - { id: m1, name: "First screen", status: active }
tasks:
  - { title: "Build the screen", phase: m1, habitica_id: null, skill: desarrollador }
habits:
  - { title: "Code every morning", days: 21, skill: desarrollador, habitica_id: null }
---
```

| Field | Rule | Default |
|---|---|---|
| `title` | Shown on the card. Write it: without it the card reads "README" | The file name |
| `status` | `planning`, `active`, `paused`, `completed` or `archived`. Only `active` shows as a card, and `completed` counts for skills | None: with no `status` there is no card |
| `priority` | `high`, `medium` or `low`; it orders the cards | `low` |
| `skill` | One id or a list; a task with no `skill` trains these | None |
| `stale_after_days` | Overrides the setting for this campaign | The setting |
| `phases[].status` | Same values as `status` | `planning` |
| `tasks[].habitica_id` | Written by **Send to Habitica**; a task is done when its to-do is completed | None |
| `habits[].days` | Streak days that build the habit | 21 |

An entry with no `id` (phase) or no `title` (task, habit) is left out. `deadline`, `area` and a task's `resources` are read, but nothing shows them yet.

## Research

A note with `type: research` under `03 - Areas/<Area>/Estudio/`. It shares `status`, `priority`, `area` and `phases` with a project. Its progress counts completed phases.

Its tasks are its study sessions: notes with `type: study-session` that link back to it.

```yaml
---
type: study-session
research: "[[Estudio - Libros Apócrifos]]"
session: 5
phase: contexto
status: active
habitica_id: 3f2a1c8e-...
created: 2026-10-30
---
```

A session counts as done with `status: completed`. Dromos only reads these notes.

## Book

A note with `type: book`, wherever it lives. Esdras creates it in `03 - Areas/Bibliotheke/` as `<Title> - <Author>.md`, from `Templates/book.md`. After that, Dromos writes only `status`, `started`, `finished` and `habitica_id`; the body is yours.

```yaml
---
type: book
title: "Klara y el Sol"
author: "Kazuo Ishiguro"
shelf: "Ficción"
status: active
started: 2026-11-07
habitica_id: 3f2a1c8e-...
created: 2026-11-06
---
```

| Field | Written by | Rule | Default |
|---|---|---|---|
| `title` | Esdras | The title alone, without the author | The file name |
| `author` | Esdras | | None |
| `shelf` | Esdras, with you | One shelf, written as it should read ("Teología"). Shelves that differ only in case are one shelf, named as its first book by title writes it | No shelf ("Sin estante"), listed last |
| `status` | Esdras creates it `planning`, or `completed` for a book you already read; then Dromos | `planning` pending, `active` reading, `paused` paused, `completed` finished. `archived` has no use yet | `planning` |
| `started`, `finished` | Dromos, when you start and finish the book | `YYYY-MM-DD` | None |
| `habitica_id` | Dromos, when you start the book | The reading to-do in Habitica. Dromos never replaces one that is already there | None |

### The reflection

Four sections, with these headings at any level, in this order:

1. `## De qué trata`
2. `## Qué me quedó`
3. `## Qué cambia en mí`
4. `## Con qué lo conecto`

A section has text when a paragraph, list, quote, callout, table, code block, math or HTML sits between its heading and the next heading of any level. A comment (`%% %%`) or a horizontal rule alone does not count, and neither does text under a sub-heading. A missing heading, or one spelled another way, is an empty section; if a heading appears twice, the first one counts. Dromos reads this from Obsidian's cache of the note, never the text itself, so the other sections of the note never count.

**A book is sealed** when its `status` is `completed` and all four sections have text. A `completed` book with any section empty shows as missing its reflection ("Falta la reflexión"), not sealed.

## Ledger

`<folder>/Ledger/YYYY-MM.md`, one note a month. Dromos only adds rows, and every level comes from them.

| Column | Meaning |
|---|---|
| `date` | The day, `YYYY-MM-DD` |
| `habitica_id` | The task |
| `task` | Its title then |
| `kind` | `todo` or `daily` |
| `skill` | One row per tagged skill; empty with no tag |
| `xp` | What this row pays; a `revert` is negative |
| `source` | `complete`, `revert` or `streak` |
| `n` | Which completion of that task this is |

Do not edit rows by hand: a damaged row is listed as unreadable, and Dromos may add that change again. A row repeated exactly counts once.

## Briefing

`<folder>/Briefing.md`, written by Esdras with `/dromos-briefing`. Dromos only reads it, when the tab opens and on **Sync**.

```yaml
---
type: dromos-briefing
created: 2026-11-03
mission:
  title: "Close the sign-up screen of Kairos"
  why: "It is the campaign with the nearest deadline."
near_unlock:
  skill: lector
---

Shalom. Today the race asks for one thing.
```

| Field | Rule |
|---|---|
| `created` | The day, `YYYY-MM-DD`. Today's letter is headed "Letter from Esdras · today"; one of another day, or with no date, is dimmed and headed "Last letter · 2 Nov" (or "Last letter") |
| `mission.title`, `mission.why` | The title heads the folded panel, cut at two lines; the why opens the unrolled letter, with text in backticks shown as code and no other markdown. No title, no mission |
| `near_unlock.skill` | A skill id; shown only while that skill is locked, and Dromos works out what it still asks |
| Body | Rendered as a note, with links you can follow. The panel signs it, so the body should not. It should not start with a `---` line |
