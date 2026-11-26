# Painted UI: the cards, the app's background and the signpost in the painted world's look

Objective: now that the scene above every screen is painted, the cards, views and modals below it, the app's own background and the signpost speak the same painted language, through one shared card language, without losing legibility, behaviour or performance.
Branch: `feat/painted-ui`. Delivery: merge into main, release on the user's go-ahead. Test runner: Vitest (`npm test`), plus `npm run lint` and `npm run build`.

## Specs

- **S1** The character's plaque with the stats and the stages modal take the painted look (user, L1: "creo que hay que cambiar la card donde estan las stats y la modal donde aparecen los stages").
- **S2** Every other card and view does too (user, L1: "ya hay que cambiar el resto de las cards, de las campains, las today{s quests, la vista de las skills la vista de las campainas, todo realmente").
- **S3** The app gets a background of its own below the scene (user, L1: "no se que posibilidad de ponerle algun otro fondo como tal de la aplicacion, no el de arriba sino el de abajo"). The user chose option A, "Camino": the road's earth in CSS, whose ragged edge rises into the painting (L4).
- **S4** The signpost, which is also the navigation, is restyled (user, L1: "y creo que el cartel que funciona tambien como navegacion").
- **S5** One shared card language, mockup first (L1: the user agreed to "Un solo lenguaje de card ... Te lo muestro en maqueta antes de escribir código"). It builds on the papyrus pieces the user already liked: Esdras's letter and the "Leyendo ahora" scrolls.
- **S6** (assumption, from the earlier features) Everything keeps working as today: every text, button, state and behaviour, keyboard and screen-reader use, both themes, every time of day, phones and offline. Text never sits straight on an image: it always sits on its plate.
- **S7** (assumption, from letter-art L1 and landscape-art S8) Performance: the restyle adds no measurable cost.

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S1-S4 (audit: every screen, card and modal shot with the paintings, inventoried with its component) | delegated (context backstop) | done | L2 |
| T2 | S5 (one card language, app background options, signpost: mockup) | delegated (context backstop, L2) | done; approved (L4) | L3 |
| T3 | S1-S7 (apply the approved language and background A everywhere, fix the mockup's weak points, then the Library, archive and Shop pass) | delegated (context backstop, L4) | in progress | |
| T4 | release | inline | pending, on the user's go-ahead | |

## Log

- **L1** (2026-11-26, user):
  - **Question asked:** after 0.28.0 the user asked "como va el tema del rendimiento?" and "dime con que continuamos porque ahora hay muchos lugares o mejor dicho muchas cards que se ven un poco fuera de diseño jajaj".
  - **My proposal:** an audit of every screen, one shared card language based on the papyrus with a mockup first, then applying it screen by screen starting with Home. In parallel, the Library's loops made lighter. I asked "¿Arranco con la auditoría de las cards y, en paralelo, aligero los videos de la Biblioteca?".
  - **The user's answer:** "si dale porfavor, creo que hay que cambiar la card donde estan las stats y la modal donde aparecen los stages" and "ya hay que cambiar el resto de las cards, de las campains, las today{s quests, la vista de las skills la vista de las campainas, todo realmente, y no se que posibilidad de ponerle algun otro fondo como tal de la aplicacion, no el de arriba sino el de abajo y creo que el cartel que funciona tambien como navegacion."
  - **Route:** T1 is delegated to one read-only worker by the context backstop: this session is long and carries many images. The Library's loops are tracked in `landscape-art` T9.
- **L2** (2026-11-26): T1, the audit, is done. It resumed after the previous session ended.
  - **Shots:** 60 screenshots (every screen and modal, light by day and dark at night, 1160 and 360 px), plus two contact sheets in `~/Downloads/dromos-ui/`. The inventory is in scratch `ui-audit/inventory.md`.
  - **Families:**
    - 20 parchment panels and cards, all drawn by one rule at `styles.css:1249`.
    - 12 list rows, with only a line between rows.
    - 1 button recipe with about 15 uses (`styles.css:1289`).
    - 8 pills, badges and chips.
    - 8 progress bars and charts in five styles and two colours for one meaning.
    - 7 different idioms for tabs and navigation.
    - 1 modal shell with 4 contents.
    - 6 empty and notice states.
  - **Worst clashes:**
    1. The character plaque with the radar (`CharacterCard.tsx:61`, `styles.css:2062`).
    2. The stage and titles modals (`StageCard.tsx:21`, `TitlesCard.tsx:22`, `styles.css:5285`).
    3. The signpost planks (`Signpost.tsx:46`, `styles.css:1116`).
    4. The shared panel rule.
    5. The screen header band (`ScreenHeader.tsx:26`).
    6. The rounded pills and chips.
    7. The web buttons.
    8. The app background.
  - **Tokens:**
    - `--dromos-paper` (19 uses), `--dromos-panel` (28) and `--dromos-umber` (108), the grain, shadow and line tokens, and `--dromos-font-display` (61).
    - The papyrus `--dromos-sheet-*` tokens live only in the Library's section.
    - Radii and shadows are literals, so tokens alone cannot reshape the cards.
  - **App root:** `DromosView.tsx:33` puts `dromos-root` on Obsidian's content element, which paints a flat `--dromos-paper` (#faf5ea by day, #1b1713 at night) with no image. The content column is 720 px wide, or 1100 px with two columns on Home. Below the scene's hard bottom edge, the cards sit on paper of almost the same tone. An S3 background belongs on `.dromos-root` or a layer under the content.
  - **Signpost:** a `<nav class="dromos-signpost">` absolutely placed in the scene, with up to six tilted planks, the current one burnt in. On phones the planks are 34 px tall.
  - **Route:** T2 is delegated to one design worker by the context backstop.
- **L3** (2026-11-26): T2 is done. The mockup sits over the real components, in scratch `painted-ui-mock/` (`design.md`, `proposed.css`, `mock-src.css` and `shots/`). The user's copies are `~/Downloads/dromos-ui/maqueta-{home,campanas,skills,modales,fondos,cartel}.png`.
  - **The language:** everything below the scene is an object of the same world.
    - **Cards, lists and modals** are papyrus sheets, with fibres, a ragged edge and a soft shadow, and no umber border.
    - **Ledgers:** Home's campaigns and the campaign's phases become ledger sheets with ruled rows.
    - **Wood:** the signpost, the gate plaque and the screen title, which becomes a wooden sign hung by two cords from the scene's foot. This is the only markup change: `ScreenHeader.tsx:26`, `dromos-panel` → `dromos-sign`. Four tests pin that class.
    - **Ink:** one ochre bar for all progress. The tabs become words with an ochre underline, and the pills become small caps, with a stamp only on the attention-seeking ones.
    - **Modals:** the stage and titles modals become an unrolled scroll on rods.
    - **The character plaque:** a papyrus leaf hung from a rod, with the radar as an ink star.
    - **Tokens:** radii and shadows become tokens.
  - **Background options:**
    - **A, "Camino":** the road's packed earth, in CSS only, with a ragged edge rising into the painting. Recommended.
    - **B, "Lino":** CSS only. It keeps the hard edge.
    - **C, "Tierra pintada":** the landscape continued downward. It needs the user's painting, and the tabs would sit on it.
  - **Signpost:** arrow-shaped plank boards on a post with a pointed cap, in CSS only. The current plank flips: charred by day, lamplit at night. It clears 3:1 against the paintings at every hour, where the old one reached 2.81 and 2.37. Its letters are at least 8.6:1, and phone targets are 44 px.
  - **Performance:** idle within noise, scrolling +1.5 points. `background-attachment: local` is mandatory on `.dromos-root`, the scroll container: without it, scrolling cost about 145 %.
  - **Weak points:**
    - The day ground's grain looks a little like sandpaper.
    - The sheets separate from the ground only by shadow and edge (1.32:1 tone contrast).
    - The radar labels are about 8.5 px.
    - The empty states, the Shop's confirmation and the level-up card were not shot.
    - The Library alcoves, the archive pigeonholes and the Shop tabs need their own pass.
  - **Parent check:** the Home before/after at both widths and themes, and the backgrounds sheet.
- **L4** (2026-11-26, user): I asked "¿Vamos con este lenguaje y el fondo A?" and the user answered "si dale".
  - **T3, delegated to one writer by the context backstop:**
    - **Source:** apply `proposed.css` and the `ScreenHeader` change from the mockup.
    - **Weak points to fix:** the day grain, the sheet/ground separation on dim phones, the radar labels, and the states that were not shot.
    - **Then:** the pass for the Library alcoves, the archive pigeonholes and the Shop tabs.
    - **Return:** before/after sheets of every screen, and the performance measurement.

