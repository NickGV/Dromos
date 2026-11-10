# Home layout and the scene header (D)

Objective: the home screen in two columns, one scene header on every screen with the character on a plaque inside it (option D), the skills in miniature there, and a richer, quietly animated landscape.
Branch `feat/home-header` (landscape in `feat/landscape-life`, worktree `~/Documents/dromos-worktrees/landscape`). Delivery: work-unit commits, `--no-ff` merge into `main` and release only with the user's go-ahead. Runner: Vitest (`npm test`), then `npm run lint` and `npm run build`.

## Specs

- **S1 Home layout.** "quiero que sea a la izquierda la carta de esdras, abajito todo el tema de la today's quests con sus filtros y a la derecha las campanas, lo que estoy leyendo, puede ser una mini mesa y las cronicas."
  - From 736 px of view width (the current two-column breakpoint): the left column holds Esdras's letter, then Today's quests with their filters, unchanged; the right column holds Campaigns, a small reading desk with the books being read ("lo que estoy leyendo, puede ser una mini mesa"), then the Chronicle. Narrower: one column in that order.
  - The character card and the skills row leave the home screen (S2, S3 take their place in the header).
  - The reading desk shows only the books being read (`status: active`), in the library's desk style, smaller; clicking a book opens the same book card as in the library. With no book being read the section is not drawn.
- **S2 Header D on every screen.** "estoy viendo que la parte de arriba solo funciona o se ve bien en la pagina del path, pero en las otras no se logra ver bien al corredor (tambien me gustaria mejorar ese header, si puedes dame varias opciones para ver cual elijo)"; then "Elijo la D me gusta como se ve". Option D of the mockups (`scratchpad/header/options.html`): "El paisaje completo en todas las pantallas (270 px), con el corredor siempre entero, y tu nombre, nivel, XP y cuatro habilidades en una placa dentro de la escena, a la izquierda. En el teléfono la placa baja debajo de la escena."
  - Every screen draws the same scene, tall enough that the walker, the gate and its plaque are whole at every view width from 320 to 2560 px; the signpost keeps its five planks, the current one burnt in.
  - The plaque: the level medallion, the name, the title and level, the XP bar with its text, the since-last-visit line, the level-up ceremony as the card had it, and the sync line (status and Sync). Inside the scene at its bottom left where the view is wide enough for it to clear the walker and the gate; under the scene on narrower views. Loading, missing and unreadable `Character.md` keep their texts there.
  - Nothing overlaps the scene's foot any more. The header card of the other screens keeps its title (and back link) and drops the character line.
- **S3 Skills in the header.** "creo que las skills podriamos tener una mini visual en el header"
  - The plaque shows "Skills · N of M" and the four skills nearest to unlocking (earned ones count, locked ones by progress) as small ring medallions; each opens the Skills screen on that skill.
- **S4 A richer, animated landscape.** "Elijo la D me gusta como se ve, pero me gustaria que en el paisaje agregaramos mas cositas, quizas lo mejoraramos un poco para que se vea mas cool, ponerle depronto mas animaciones y demas, que dices? Que todo no se vea como tan simplesito"
  - More life in the same line style and tokens (every color a `--dromos-scene-*` token, so the dark theme and the hours keep working), with calm slow loops. The walker's walk and the level-up stay the focal moments.
  - Every loop stops under `prefers-reduced-motion` and while the scene is out of sight.
- **S5 (assumption, Claude's call, reversible).** The six stats of the character card move to the top of the Skills screen, since the plaque has no room for them and Option D shows none.

## Tasks

| ID | Specs | Task | Route | Status | Commit |
|----|-------|------|-------|--------|--------|
| T1 | S2, S3, S5 | The scene header and the plaque on every screen, the mini skills, the stats on the Skills screen | delegated, writer A (parallel units, trigger a) | pending | |
| T2 | S1 | Home in two columns, the reading desk on home | delegated, writer A (shares `HomeScreen.tsx` and `styles.css` with T1) | pending | |
| T3 | S4 | More life and calm motion in the landscape | delegated, writer B in the landscape worktree (parallel units, trigger a) | pending | |
| T4 | S1-S5 | Merge T3, seam check (full suite, lint, build), README and CHANGELOG, dev build in the vault | inline | pending | |
| R1 | | Release with the user's go-ahead | inline | pending | |

## Log

- **L1** (2026-11-10, user): "chat quisiera que realizaramos un cambio de distribuccion en la pagina principal [Image #3], tambien estoy viendo que la parte de arriba solo funciona o se ve bien en la pagina del path, pero en las otras no se logra ver bien al corredor (tambien me gustaria mejorar ese header, si puedes dame varias opciones para ver cual elijo)". The image was a mockup with a date heading, "El encargo de hoy, de Esdras", today's quests, campaigns, "Leyendo" and "Crónica de hoy".
- **L2** (2026-11-10): the scene of the other screens is 170 px, and the 960 × 300 drawing (`xMidYMax slice`) shows only its lowest ~102 units there: the walker spans y 167-236 and the gate's top is 157.6, so the head and the plaque are cut.
- **L3** (2026-11-10, user): asked what to clarify about the image's new functions (marking quests, a new quest in Habitica, "Empezar ahora", "Hoy no", "Anotar"), the user answered with the layout only: "quiero que sea a la izquierda la carta de esdras, abajito todo el tema de la today's quests con sus filtros y a la derecha las campanas, lo que estoy leyendo, puede ser una mini mesa y las cronicas. creo que las skills podriamos tener una mini visual en el header". No new functions.
- **L4** (2026-11-10): four header options drawn from the live markup (A Panorama, B Franja del camino, C Medallón, D Escena con placa), desktop and phone, in `scratchpad/header/options.html`.
- **L5** (2026-11-10, user): "Elijo la D me gusta como se ve, pero me gustaria que en el paisaje agregaramos mas cositas, quizas lo mejoraramos un poco para que se vea mas cool, ponerle depronto mas animaciones y demas, que dices? Que todo no se vea como tan simplesito".
