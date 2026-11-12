# Titles earned by big feats

Objective: the character's title is earned by big, rare feats instead of being only free text, and the user chooses which earned title the plaque shows. Backlog item of the vault's `02-Phases.md` ("Recompensas por subir de nivel (títulos ...)": "los títulos quedan para más adelante, por hazañas grandes") and ADR-019 ("Una idea para más adelante: títulos raros por hazañas grandes"; "Un título por nivel: descartado por Nick").
Branch `feat/titles`. Delivery: decisions, then mockups, then work-unit commits, `--no-ff` merge into `main` and a release only with the user's go-ahead. Runner: Vitest (`npm test`), then `npm run lint` and `npm run build`.

## Specs

Claude proposed (L1): "Hoy "Corredor" es texto libre en `Character.md`, y la idea sería que se ganen con logros concretos: terminar tu primera campaña, leer 10 libros, una racha de 30 días. Los irías juntando y elegirías cuál mostrar en la placa." The user accepted (L1): "si dale porfavor".

- **S1 Titles by big feats, granted by Esdras.** Titles are earned by concrete, rare feats ("terminar tu primera campaña, leer 10 libros, una racha de 30 días"), never one per level (ADR-019: "por nivel serían muchos y muy fáciles"). Earned titles are collected. Esdras grants them (L3): "yop prefiero que sea esdras quien lo haga me suena mejor que sea el quien es mi guia el que decida, estaria genial esa parte". Dromos does not decide a feat; it reads what Esdras wrote (assumption: in a note of his in the Dromos folder, like `Shop.md`, ADR-019).
- **S2 The user chooses the title shown, in Dromos.** "Los irías juntando y elegirías cuál mostrar en la placa." Chosen in Dromos (L4: "1", to "Lo elegís en Dromos ... Tocás tu título en la placa y elegís entre los que ganaste. Para esto Dromos tendría que escribir `title` en `Character.md` ... Eso pide un ADR que lo autorice, solo con títulos ganados."): Dromos writes `title` in `Character.md`, only a title Esdras granted, after an ADR the user accepts.
- Constraint from the vault contract (04-Game-Design): "`name` y `title` son del usuario y de Esdras; el plugin los respeta." Any change to who writes `title` needs an ADR the user accepts.
- Decided: who grants (L3, Esdras) and where the choice is made (L4, in Dromos). Proposed to the user as one ADR (L5), pending: the note `Dromos/Titles.md` that only Esdras writes; "Corredor" as the first title; the card to choose; the notice of a new title; Esdras's rules and the feats he judges by.

## Tasks

| ID | Specs | Task | Route | Status | Commit |
|----|-------|------|-------|--------|--------|
| D1 | S1, S2 | The user's decisions, one question at a time, and the ADR in the vault | inline | in progress | |

## Log

- **L1** (2026-11-12, user): "si dale porfavor", to Claude's proposal of titles by big feats, after the stage card closed.
- **L2** (2026-11-12): read in the vault: ADR-019 leaves titles out ("Los títulos quedan fuera: por nivel serían muchos y muy fáciles (Nick). Una idea para más adelante: títulos raros por hazañas grandes."); 04-Game-Design: `title: Corredor  # título narrativo, lo cambia Esdras al subir de nivel` and "`name` y `title` son del usuario y de Esdras; el plugin los respeta."
- **L3** (2026-11-12, user, on who grants titles: Dromos counting feats, Esdras, or both): "yop prefiero que sea esdras quien lo haga me suena mejor que sea el quien es mi guia el que decida, estaria genial esa parte". S1 rewritten.
- **L4** (2026-11-12, user, on choosing the title in Dromos or asking Esdras): "1". S2 rewritten.
- **L5** (2026-11-12): the ADR proposal sent to the user, pending: (1) `Dromos/Titles.md`, `type: dromos-titles`, written only by Esdras: a table `| id | title | feat | granted | why |`; Dromos reads it, never writes it, and names and skips a row it cannot read. (2) "Corredor", today's title, is the first one: Esdras writes its row with the day the game started. (3) Tapping the title on the plaque opens a card with the earned titles (title, feat, date and Esdras's why); choosing one writes it to `title` in `Character.md`, the only value Dromos ever writes there; the plaque keeps showing whatever `title` holds. (4) A title newer than the last one seen on this device shows once: "Esdras te otorgó un título: …". (5) Esdras: an exception in his rules to write `Titles.md`, like `Shop.md`; the feats are his judgment, guided by a short list in 04-Game-Design (first finished campaign, 10 finished books, 30 days of a habit, a skill at rank 5, a new stage), and `dromos-titles` in the dictionary, in `logos-dotfiles`. (6) 04-Game-Design: `title` is the user's, Esdras's and, when a granted title is chosen, Dromos's. Nothing goes to Habitica.
