# Painted UI: the cards, the app's background and the signpost in the painted world's look

Objective: now that the scene above every screen is painted, the cards, views and modals below it, the app's own background and the signpost speak the same painted language, through one shared card language, without losing legibility, behaviour or performance.
Branch: `feat/painted-ui`. Delivery: merge into main, release on the user's go-ahead. Test runner: Vitest (`npm test`), plus `npm run lint` and `npm run build`.

## Specs

- **S1** The character's plaque with the stats and the stages modal take the painted look (user, L1: "creo que hay que cambiar la card donde estan las stats y la modal donde aparecen los stages").
- **S2** Every other card and view does too (user, L1: "ya hay que cambiar el resto de las cards, de las campains, las today{s quests, la vista de las skills la vista de las campainas, todo realmente").
- **S3** The app gets a background of its own below the scene (user, L1: "no se que posibilidad de ponerle algun otro fondo como tal de la aplicacion, no el de arriba sino el de abajo"). Options are explored and shown before building.
- **S4** The signpost, which is also the navigation, is restyled (user, L1: "y creo que el cartel que funciona tambien como navegacion").
- **S5** One shared card language, mockup first (L1: the user agreed to "Un solo lenguaje de card ... Te lo muestro en maqueta antes de escribir código"). It builds on the papyrus pieces the user already liked: Esdras's letter and the "Leyendo ahora" scrolls.
- **S6** (assumption, from the earlier features) Everything keeps working as today: every text, button, state and behaviour, keyboard and screen-reader use, both themes, every time of day, phones and offline. Text never sits straight on an image: it always sits on its plate.
- **S7** (assumption, from letter-art L1 and landscape-art S8) Performance: the restyle adds no measurable cost.

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S1-S4 (audit: every screen, card and modal shot with the paintings, inventoried with its component) | delegated (context backstop) | in progress | |
| T2 | S5 (one card language, app background options, signpost: mockup) | inline | pending | |
| T3 | S1-S7 (apply, screen by screen, starting with Home; split after T2) | pending | pending | |
| T4 | release | inline | pending, on the user's go-ahead | |

## Log

- **L1** (2026-11-26, user):
  - **Question asked:** after 0.28.0 the user asked "como va el tema del rendimiento?" and "dime con que continuamos porque ahora hay muchos lugares o mejor dicho muchas cards que se ven un poco fuera de diseño jajaj".
  - **My proposal:** an audit of every screen, one shared card language based on the papyrus with a mockup first, then applying it screen by screen starting with Home. In parallel, the Library's loops made lighter. I asked "¿Arranco con la auditoría de las cards y, en paralelo, aligero los videos de la Biblioteca?".
  - **The user's answer:** "si dale porfavor, creo que hay que cambiar la card donde estan las stats y la modal donde aparecen los stages" and "ya hay que cambiar el resto de las cards, de las campains, las today{s quests, la vista de las skills la vista de las campainas, todo realmente, y no se que posibilidad de ponerle algun otro fondo como tal de la aplicacion, no el de arriba sino el de abajo y creo que el cartel que funciona tambien como navegacion."
  - **Route:** T1 is delegated to one read-only worker by the context backstop: this session is long and carries many images. The Library's loops are tracked in `landscape-art` T9.
