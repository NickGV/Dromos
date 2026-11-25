# Own art: painted scenes from the vault, starting with the Library and the Archive

Objective: a scene can show a painting the user keeps in the vault, light and dark, instead of its SVG drawing, with the SVG drawing back whenever the painting is missing. It starts with the Library and the Archive.
Branch `feat/own-art` (to create from `main` before the first source write). Delivery: mockups first, as with every card; work-unit commits; merge and release only with the user's go-ahead. Runner: Vitest (`npm test`), then `npm run lint` and `npm run build`.

## Specs

The user's request (L1): "si dale, arranquemos con el arte propio", the idea recorded on 2026-11-06 in the vault's `08-Visual-Design.md` ("Arte propio (más adelante)"): "no se si nosotros mismos podriamos poner imagenes por detras para hacerlo mas cool y no todo como si pareciera un dibujo de niño, a mi me gusta, pero si en un futuro se puede mejorara me gustaria que se pudiera hacer".

- **S1 The rules already agreed** (`08-Visual-Design.md`, "Arte propio (más adelante)", quoted):
  - "**Las imágenes viven en el vault**, por ejemplo en `Dromos/Arte/`, y Dromos las muestra con `Vault.getResourcePath` (API pública). Así se sincronizan con el vault en Android, se cambian sin publicar una versión y el plugin sigue liviano."
  - "**No van dentro del plugin.**"
  - "**Una versión clara y una oscura** de cada escena (la sala, el estante, el encabezado)."
  - "**El texto nunca va directo sobre la imagen**: siempre sobre un panel de pergamino, para mantener el contraste AA."
  - "**Si la imagen no está, se dibuja la escena de siempre en SVG**: nada se rompe por una imagen que falta o que todavía no se sincronizó."
- **S2 First scenes** (L2: "por la recomendada porfavor"; narrowed in L6: "si dale vamos con esos 3 porfavor"): the Library's wall (behind the alcoves) and desk (behind the scrolls being read), and the Archive room, `wall`, `desk` and `archive`. The shelf and the card keep their drawing. The shelf writes text straight on its background (S1), and a card leaves 8-11% of a painting visible (L5).
- **S3 The painting replaces the drawing** (L3: "1", to "La imagen reemplaza al dibujo"). While a scene's painting for the current theme is there, it fills the background layer and the SVG drawing layer is not drawn. The panels, with their text and buttons, stay on parchment as today.
- **S4 Where the images come from** (L4: "2", to "Te escribo los prompts para generarlas con una IA de imágenes, uno por escena y por tema"): Dromos's side writes one prompt per scene and theme, in the Dromos style and with the panels' places left quiet; the user generates the images. File names and formats, announced as defaults and not objected to:
  - `<vault folder>/Arte/<scene>-light.<ext>` and `<scene>-dark.<ext>`, with the scenes `wall`, `desk` and `archive`, and `webp`, `png` or `jpg`;
  - a theme whose file is missing draws the SVG, even when the other theme has one;
  - the images are looked up when the view opens and on **Sync**.

## Tasks

| ID | Specs | Task | Route | Status | Commit |
|----|-------|------|-------|--------|--------|
| P1 | S1-S4 | Settle S4 with the user | inline | done (L4) | |
| R0 | S2-S4 | Reference renders and measurements of the five scenes, and the ten prompts | delegated (context backstop: the parent session is long); scratch only | done (L5) | scratchpad `own-art-refs/` (`measurements.md`, `prompts.md`, renders) |
| D1 | S2, S4 | `docs/own-art.md`: where the files go, their names, and the six prompts, kept in the repo since the scratch was wiped once | inline | done (L6) | see L6 |
| T0 | S1-S3 | Mockups of the three scenes with the user's paintings and without, light and dark, desktop and phone | after the user has images | pending | |

## Log

- **L1** (2026-11-22, user): "si dale, arranquemos con el arte propio", choosing it among the unscheduled ideas.
- **L2** (2026-11-22, user): "por la recomendada porfavor", to starting with the Library and the Archive. The map came from a read-only explorer:
  - Only `SceneLayers` (`src/ui/atoms/SceneLayers.tsx:13-31`) has the empty background layer meant for this art. It is used by the wall and desk (`LibraryRoom.tsx:58, 83`), the shelf (`LibraryShelf.tsx:21`), the card (`BookCard.tsx:46`, `ResourceCard.tsx:41`) and the archive (`ArchiveRoom.tsx:30`). The CSS is ready (`styles.css:3536-3542`).
  - The home landscape, the Shop stall and the portraits are single SVGs with opaque fills. The walker and the gate sit at fixed 960×300 coordinates (`walkerView.ts:19-31`).
  - Nothing loads a vault image yet. The way to reach `obsidian` from the UI is a function type the UI declares (`IconRender`, `MarkdownRender`), implemented in `src/adapters/obsidian` and wired in `createDromos.ts`.
  - The theme is CSS only: dark is the default on `.dromos-root`, and light is set under `.theme-light .dromos-root`.
  - The tests pin the layer order (`library.test.tsx:105-111, 160, 240`; `archive.test.tsx:53, 132`; `resourceCard.test.tsx:44`).
- **L3** (2026-11-22, user): "1", to "La imagen reemplaza al dibujo … Si la imagen falta, vuelve el dibujo de siempre."
- **L4** (2026-11-22, user): "2", to the parent writing the prompts. Headless Chromium is available (`/usr/bin/chromium`), so the scene boxes are measured instead of guessed. R0 was delegated to a worker, scratch only, which renders the five scenes with the real `styles.css` at 1546, 840 and 390 px, light and dark, and drafts the prompts.
- **L5** (2026-11-24): R0 done by the worker, scratch only; repository and vault unchanged. A first run was cut by a usage limit and resumed.
  - Method: the real components and `styles.css`, headless Chromium over the DevTools protocol, at 1546, 840 and 390 px, light and dark. The visible share was counted by filling the background layer with magenta and hiding the drawing layer, as S3 does.
  - Measurements (box in CSS px; aspect; share of a painting left visible). Light and dark are identical:

    | Scene | 1546 px | 840 px | 390 px |
    |---|---|---|---|
    | wall | 1068×314; 3.41; 50% | 784×527; 1.49; 53% | 334×681; 0.49; 17% |
    | desk | 1068×305; 3.50; 27% | 784×305; 2.57; 28% | 334×477; 0.70; 24% |
    | shelf | 1068×822; 1.30; 85% | 784×822; 0.95; 81% | 334×687; 0.49; 66% |
    | archive | 1068×267; 4.00; 75% | 784×267; 2.94; 66% | 334×210; 1.59; 81% |
    | card | 638×559; 1.14; 8% | 630×559; 1.13; 8% | 324×634; 0.51; 11% |

    Heights follow the content (wall 0.30 to 3.41, desk 0.37 to 8.34, shelf 0.19 to 1.30), so only the archive has a stable aspect.
  - Recommended masters, with the safe area every pane keeps under a centred `cover`: wall 3200×1600 (x 38-62%, y 21-79%); desk 3600×1200 (x 38-62%, y 7-93%); shelf 2400×2400; card a 1000×4000 strip that tiles from top to bottom; archive 3600×1200 (x 24-76%, y 13-87%, with the window at x 2-16% shown on wide panes only).
  - Findings:
    - (1) The shelf draws its row titles and state lines straight on the scene background, which breaks S1 ("El texto nunca va directo sobre la imagen"). A painting would have to stay within measured luminance limits, nearly flat in the light theme.
    - (2) The card leaves 8-11% of a painting visible: two thin strips where the rods are drawn.
    - (3) Under S3 the lamp, the inkwell, the archive's window and worktable, and the card's rods disappear with the drawing layer, so the paintings must carry them, and they land in different places on each pane.
    - (4) A `cover` painting's texture scales with the box.
    - (5) The desk shows a different top band on each pane; anchoring its background to the top fixes that.
    - (6) The light theme has night hours, but S1 gives one light file, so the light painting is daylight at every hour.
  - Prompts: a shared style block (the palette tokens of both themes; no text, no people, nothing modern; quiet where panels sit) and ten scene prompts, each with what it must not paint, its layout in percent and its format.
- **L6** (2026-11-24, user): "si dale vamos con esos 3 porfavor", to starting with the wall, the desk and the archive (six images) and leaving the shelf and the card drawn. S2 is narrowed. The six prompts and the shared style block were copied from the worker's `prompts.md` into `docs/own-art.md`, with where the files go (S4), on the new branch `feat/own-art`. The worker's scratch (`own-art-refs/`) stays for the mockups.
