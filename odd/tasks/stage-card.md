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
| T0 | S1, S2 | Mockups of the card, with the user's real state and a mid-road example | delegated mockup writer (context backstop: the parent session is long); scratch only | done (L3); the user's choice pending | `../dromos-worktrees/stage-card-mockups/` |
| T1 | S1 | Build the chosen option | after the user's choice | pending | |
| R1 | S3 | Release with the user's go-ahead | inline | pending | |

## Log

- **L1** (2026-11-12, user): "que continua?", to which Claude recommended showing the stage and what the next one still asks, with a card opened from the portrait, then titles by big feats.
- **L2** (2026-11-12, user): "uu si me parece genial". T0 launched.
- **L3** (2026-11-12): T0 done by the mockup writer, scratch only (repository and vault unchanged). Nine boards, real components with Obsidian's `app.css`: today (Corredor, level 2, 11 of 30 days, next Caminante), mid-road (Viajero, next Estudioso) and the end (Sabio, "El camino está completo"), light and dark, 840 and 390 px. **A · La ficha**: a modal like the book card (640 px), the big bust, "Para ser Caminante" with each requirement ticked or missing ("nivel 2 de 3 · Te faltan 248 XP", "11 de 30 días · Faltan 19 días: el 1 de diciembre"), the twelve busts in niches (passed ticked, current ringed in ochre, next dashed), "Lo que cuenta hoy". **B · La placa se despliega**: in place of the radar row, twelve dots and the next stage's requirements; the plaque grows up to 165 px past the scene at 840 px. **C · El camino dibujado**: a new screen "Etapas", the road climbing in three switchbacks to the Sage's temple with each stage's walker on its milestone, and a side panel. Portrait as a button named "Corredor, etapa 1 de 12. Ver las etapas" (Obsidian shows it as the tooltip); the medallion stays outside the button with "Nivel 2". The name "Camino" is taken by the signpost, so "Etapas". Writer's pick: A. Shown to the user.
