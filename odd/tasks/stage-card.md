# The stage card: where the character stands on the road of life

Objective: tapping the character's portrait on the plaque opens a card with the stage reached, what the next stage still asks and the whole road of twelve stages, so the long goals of M11 can be seen. Follow-up of M11 (`odd/tasks/m11-avatar.md`).
Branch `feat/stage-card`. Delivery: mockups first, then work-unit commits, `--no-ff` merge into `main` and a release only with the user's go-ahead. Runner: Vitest (`npm test`), then `npm run lint` and `npm run build`.

## Specs

Claude proposed (L1): "Hoy la etapa solo se ve en el dibujo. No hay ningún lugar que diga "sos Corredor; para Caminante te falta nivel 3 y 30 días en el camino"." The user accepted (L2): "uu si me parece genial".

- **S1 The card.** From the accepted proposal: "al tocar tu retrato en la placa, se abra una ficha con: tu etapa actual y su nombre; la siguiente etapa, con cada requisito tildado o con lo que falta (por ejemplo "nivel 2 de 3", "11 de 30 días", "0 de 1 skills"); el camino completo de las 12 etapas, con las que ya pasaste marcadas."
  - The portrait becomes a button with an accessible name (assumption: it names the stage and that it opens the road); the medallion keeps "Level N".
  - At the last stage there is no next stage; the card says the road is complete (assumption).
  - Requirements come from the same rules as the drawing (`stageRules.ts`, `Rules.md` `stages`), so the card and the figure never disagree; a requirement the stage does not ask is not listed.
  - Stage names in English and Spanish, like the rest of the UI (assumption: Runner, Wayfarer, Pilgrim, Apprentice, Disciple, Traveller, Student, Scholar, Mentor, Counsellor, Elder, Sage; Corredor, Caminante, Peregrino, Aprendiz, Discípulo, Viajero, Estudioso, Erudito, Mentor, Consejero, Anciano, Sabio).
  - Read from the vault alone, no Habitica request; light and dark themes, phone width, keyboard and screen reader.
- **S2 Mockups first.** "Arrancaría con maquetas, como siempre." A few options at real sizes, both themes, desktop and phone, shown to the user; the chosen one is built.
- **S3 Release.** Publish and check on desktop and Android, with the user's go-ahead.

## Tasks

| ID | Specs | Task | Route | Status | Commit |
|----|-------|------|-------|--------|--------|
| T0 | S1, S2 | Mockups of the card, with the user's real state and a mid-road example | delegated mockup writer (context backstop: the parent session is long); scratch only | in progress | |
| T1 | S1 | Build the chosen option | after the user's choice | pending | |
| R1 | S3 | Release with the user's go-ahead | inline | pending | |

## Log

- **L1** (2026-11-12, user): "que continua?", to which Claude recommended showing the stage and what the next one still asks, with a card opened from the portrait, then titles by big feats.
- **L2** (2026-11-12, user): "uu si me parece genial". T0 launched.
