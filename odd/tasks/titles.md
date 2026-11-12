# Titles earned by big feats

Objective: the character's title is earned by big, rare feats instead of being only free text, and the user chooses which earned title the plaque shows. Backlog item of the vault's `02-Phases.md` ("Recompensas por subir de nivel (títulos ...)": "los títulos quedan para más adelante, por hazañas grandes") and ADR-019 ("Una idea para más adelante: títulos raros por hazañas grandes"; "Un título por nivel: descartado por Nick").
Branch `feat/titles`. Delivery: decisions, then mockups, then work-unit commits, `--no-ff` merge into `main` and a release only with the user's go-ahead. Runner: Vitest (`npm test`), then `npm run lint` and `npm run build`.

## Specs

Claude proposed (L1): "Hoy "Corredor" es texto libre en `Character.md`, y la idea sería que se ganen con logros concretos: terminar tu primera campaña, leer 10 libros, una racha de 30 días. Los irías juntando y elegirías cuál mostrar en la placa." The user accepted (L1): "si dale porfavor".

- **S1 Titles by big feats.** Titles are earned by concrete, rare feats ("terminar tu primera campaña, leer 10 libros, una racha de 30 días"), never one per level (ADR-019: "por nivel serían muchos y muy fáciles"). Earned titles are collected.
- **S2 The user chooses the title shown.** "Los irías juntando y elegirías cuál mostrar en la placa."
- Constraint from the vault contract (04-Game-Design): "`name` y `title` son del usuario y de Esdras; el plugin los respeta." Any change to who writes `title` needs an ADR the user accepts.
- Open decisions, asked one at a time (L3 on): who grants a title; where the earned titles and the chosen one live; the catalog of feats.

## Tasks

| ID | Specs | Task | Route | Status | Commit |
|----|-------|------|-------|--------|--------|
| D1 | S1, S2 | The user's decisions, one question at a time, and the ADR in the vault | inline | in progress | |

## Log

- **L1** (2026-11-12, user): "si dale porfavor", to Claude's proposal of titles by big feats, after the stage card closed.
- **L2** (2026-11-12): read in the vault: ADR-019 leaves titles out ("Los títulos quedan fuera: por nivel serían muchos y muy fáciles (Nick). Una idea para más adelante: títulos raros por hazañas grandes."); 04-Game-Design: `title: Corredor  # título narrativo, lo cambia Esdras al subir de nivel` and "`name` y `title` son del usuario y de Esdras; el plugin los respeta."
