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
- **S2 First scenes** (L2: "por la recomendada porfavor"; narrowed in L6: "si dale vamos con esos 3 porfavor"; widened in L12: "nos faltaria dentro del shelves y tambien cuando abrimos un libro"): the Library's wall (behind the alcoves) and desk (behind the scrolls being read), and the Archive room, `wall`, `desk` and `archive`. Next, the shelf (`shelf`), once its row titles and state lines sit on parchment (S1), its painting anchored to the top. The card takes no image of its own (L13: "si me voy con tu idea"): when a book opens, its scroll lies on the reading desk, so the card shows the `desk` paintings around the sheet. Its own art would show only in 8-11% (L5).
- **S3 The painting replaces the drawing** (L3: "1", to "La imagen reemplaza al dibujo"). While a scene's painting for the current theme is there, it fills the background layer and the SVG drawing layer is not drawn. The panels, with their text and buttons, stay on parchment as today. The archive's painting is anchored to the bottom of its scene, so its worktable shows on wide panes (L8, recommended; accepted in L9).
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
| T0 | S1-S3 | Mockups of the three scenes with the user's paintings and without, light and dark, desktop and phone | inline; scratch only | done for 5 of 6 images (L8); `wall-light` pending | scratchpad `own-art-mock/` (`gallery.html`) |
| T1 | S1, S2, S4 | Find the paintings: `SceneArt` and `sceneArtFrom` (domain), the `PaintingSource` port, `LoadSceneArt`, `VaultPaintingSource` | inline (no writer reason: T2 depends on it) | done (L10) | 5a7fc9a |
| T2 | S1-S4 | Show them: `sceneArtView`, `SceneLayers` takes a painting; the wall, the desk and the archive; the CSS by theme; the archive anchored to the bottom; read on open and on Sync in `LibraryPanel`; wired in `createDromos`; `docs/own-art.md`, README and CHANGELOG | inline | done (L10) | 55e744b |
| T3 | S4 | The six images as WebP in `Dromos/Arte/` and `install:local` for the user's look on the desktop | inline | done (L11, L12) | |
| D2 | S2, S4 | The shelf's two prompts in `docs/own-art.md` | inline | done (L12) | see L12 |
| T4 | S1-S3 | The shelf: `shelf` among the art scenes, its row titles and state lines on parchment, its painting anchored to the top; mockup first | inline | waiting for the shelf's images | |
| T5 | S2, S3 | The card on the desk: the `desk` painting behind the card's scene, the sheet as papyrus with rolled ends (L13); the book and the resource card, from the Library and from home | inline | done (L15) | 68bd93b |
| T6 | S1 | The desk's scrolls as papyrus unrolled on the desk, the scroll drawing inside each one dropped (L13) | inline | done (L15) | 68bd93b |
| V1 | | Looping video backgrounds (Esdras's question for the user, L12) | after the Library | pending | |

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
- **L7** (2026-11-24, user): "luego lo hacemos dejame este prompt en algun file en el proyecto". Paused until the user has the images. The prompts stay in `docs/own-art.md`, brought to `main` with this document so they are found from any device. Next, when the six files are in `Dromos/Arte/`: T0, the mockups with them, then the code on a new `feat/own-art` branch.
- **L8** (2026-11-25, user): "te mando las imagenes, traete lo que hay en el repositorio, estabamos haciendo lo de own art, es mas para testear a ver como se ve". Five Gemini images came from `~/Downloads`: `wall-dark` (2912×1440), and `desk-dark`, `desk-light`, `archive-dark` and `archive-light` (3584×1184 each). `wall-light` is missing, so the light wall stays drawn, as S4 says.
  - T0, scratch only (repository and vault unchanged): the real `LibraryRoom` and `ArchiveRoom` with test data, the real `styles.css`, headless Chrome at 1160, 840 and 390 px, light and dark, drawn and painted (`.is-background` gets the image, `.is-drawing` is hidden, as S3 says). The comparison is `own-art-mock/gallery.html` in this session's scratchpad.
  - The wall and the desk read well in both themes, and the panels keep their parchment, so text never sits on the painting (S1).
  - The desk's lamp is painted larger and lower than the prompt asked (y 9-24%). Centred, it shows in the top band with its top cut; anchored to the top, it hides behind the scroll cards. Centred is better.
  - The archive's paintings put the table top at y 82%, not 60%, and the window reaches x 23% and y 4-80%. Centred on wide panes, only the tops of the table's objects show, and the first pigeonhole covers the window's right edge. Anchored to the bottom, the whole table and the candle show, and only the top of the window's arch is cut. Phones show the whole table either way. Two fixes: anchor the archive to the bottom, or regenerate its two images with the table higher.
  - Size: the JPEGs are 1.4-2.4 MB each. As WebP at quality 80 and the master size, they are 33-58 KB each, far under the 600 KB in `docs/own-art.md`.
- **L9** (2026-11-25, user): "me encanta como quedo", to the mockups and to the recommendation to anchor the archive's painting to the bottom instead of regenerating it. S3 gains that anchor. Next: T1-T3 on `feat/own-art`, inline, in two work-unit commits (the lookup, then the scenes with their docs). Release only with the user's go-ahead.
- **L10** (2026-11-25): T1 and T2 done on `feat/own-art`, inline, test first.
  - RED then GREEN: `test/domain/art/SceneArt.test.ts` (7), `test/application/LoadSceneArt.test.ts` (3), `test/ui/sceneArtView.test.ts` (5), and new cases in `library.test.tsx` (3) and `archive.test.tsx` (2).
  - The matching takes names in any case, `.jpeg` as `.jpg`, and WebP before PNG before JPG when one painting has several files. These were not asked for. `.jpeg` is what the generator saved the user's files as.
  - Checks: `npm test` 187 files, 2596 tests passed; `npm run lint` 0 errors (4 warnings, all in files this change does not touch: `withTimeout.ts` and `DromosSettingTab.ts`); `npm run build` passed.
  - Differential check against `main` in a `mktemp -d` copy: the HTML of the reading room (full and empty), the archive and a shelf, with no paintings, is byte-identical.
  - The T0 harness, now passing the paintings through the real `art` prop with no injected CSS, renders the wall, desk and archive pixel-identical to the approved mockups (the archive anchored to the bottom) at 1160 and 840 px. At 390 px the largest channel difference is 13 of 255, in the text antialiasing.
  - The docs moved to T2 with the code; T3 keeps the images and the local install.
- **L11** (2026-11-25): T3. The five JPEGs, converted with `cwebp -q 80` at their own size, are in the vault as `Dromos/Arte/wall-dark.webp` (29 KB), `desk-dark.webp` (40 KB), `desk-light.webp` (83 KB), `archive-dark.webp` (46 KB) and `archive-light.webp` (66 KB). The folder did not exist before. `npm run install:local` put the `feat/own-art` build (55e744b) in the desktop vault's plugin folder. Obsidian must be reloaded or the plugin toggled to see it. The phone keeps the BRAT release, which ignores the folder. Next: the user's look in Obsidian; `wall-light` when the user makes it; merge and release only with the user's go-ahead.
- **L12** (2026-11-25, user): "vamos haciendolo, se me olvido pasarte el wall light y no se creo que nos falto algunos otros fondos no crees? … Pero si podriamos primero terminar library, la verdad me gusta mucho como se ve. Por ejemplo nos faltaria dentro del shelves y tambien cuando abrimos un libro, estaria bien que cambiemos el fondo tambien o no? Revisa cuales nos faltaria para hacer las imagenes, me das los prompts y ya luego si hacemos el tema de los videos para ver que tal funcionaria todo".
  - `wall-light` (2912×1440, Gemini) is in the vault as `Dromos/Arte/wall-light.webp` (32 KB). With the real code and the T0 harness, the light wall reads well on desktop and phone.
  - Shelf: its planks are each row's bottom border, in the panels layer, so they stay with a painting. Only the arch's shade, the drawing layer, goes away.
  - The shelf's painting shows at 66-85% (L5). It is a plain niche back with the arch's shadow along its top, anchored to the top.
  - The row titles ("Leyendo · 2") and the state lines under the tags ("En la mesa de lectura", "Pendiente") sit straight on the scene, so S1 needs them on parchment first.
  - Two prompts (`shelf-dark`, `shelf-light`, 2400×2400) were added to `docs/own-art.md`.
  - Card: the book card and the resource card keep a painting only in the two 26 px strips behind the rods (8-11%), so an image of their own shows almost nothing.
  - Proposal to the user: when a book opens, the scroll lies on the reading desk, so the card could show the `desk` paintings around the scroll, with no new images. That needs the card's frame redrawn so the painting shows around it, and a mockup first.
  - Videos (Esdras's question): after the Library, as the user asked.

- **L13** (2026-11-25, user): "si me voy con tu idea me parece mejor, y ahora que veo podriamos mejorar un poco mejor el podria ser algo mas como esto [a Gemini image: a pale papyrus unrolled across the desk between two wooden rods, the lamp and the ink pot above it, "El viejo y el mar" with its dotted underline and "Ernest Hemingway" at its lower left] claramente no tiene que ser igual". The card goes on the desk (S2). The image's dotted title and author are the desk's scroll card ("Leyendo ahora"), so the mockup covers both that card and the book card.
  - Design, in a mockup only (scratch `own-art-mock/papyrus.css` over the real components and `styles.css`):
    - Each desk scroll is a sheet of papyrus with deckled top and bottom edges (a `clip-path` polygon) and faint crossed fibres (layered repeating gradients). It has a rolled end with its rod and two knobs at each side and a soft drop shadow on the desk. The scroll drawing inside the card goes, since the card is now the scroll.
    - The book card's scene takes the `desk` painting from edge to edge, the sheet is the same papyrus, and the rods become rolled ends with knobs. The buttons stay below, on the plain panel, so no text sits on the painting (S1).
  - The papyrus is CSS, not an image: the cards change height with their text, and a painted sheet under text would break S1's AA contrast.
  - Colours: light papyrus #F1E4C4 with ink #3B2F2A (about 10.5:1), muted #665243 (about 6:1) and ochre #7A5A12 (about 5:1). Dark papyrus #362C21 with ink #EDE3CF (about 11:1), muted #B8A68E (about 6:1) and ochre #DCB25E (about 7:1).
  - Rendered at 1160 and 390 px, light and dark, before and after, in `own-art-mock/papyrus.html`, which was opened for the user.
- **L14** (2026-11-25, user): "si me gusta mucho mejor como me lo diste sobre lo que me estabas diciendo de los lugares que faltan". The papyrus mockup is approved. T5 and T6 go to code now. T4 waits for the shelf's two images (prompts in `docs/own-art.md`). The home's small reading desk opens the same card, so it gets the desk painting too, read when home opens.
- **L15** (2026-11-25): T5 and T6 done, inline, test first.
  - RED: 3 new tests failed: the desk scroll has no scroll drawing, and the book card and the resource card take the desk painting and keep their rods. GREEN after the change. 2 more tests pin the cards unchanged without a painting.
  - Code:
    - `BookCard` and `ResourceCard` take `painting`.
    - `useLibraryCards(deps, language, desk)` lays the open card on it.
    - `LibraryPanel` passes `sceneArtView(art).desk`. `ReadingDeskPanel` (home) reads the paintings once when home opens.
    - `DeskScroll` drops its `ScrollArt`.
  - CSS:
    - New tokens `--dromos-sheet*` in both themes.
    - One papyrus rule for the desk scrolls and the card's sheet: a deckled `clip-path` polygon, layered fibres, and a drop shadow on the parent.
    - The desk scrolls' rolled ends, rods and knobs are background layers of `::after`. The umbilicus becomes a rolled end with knobs.
    - The card's scene reaches the modal's edges, with a 68 px band of desk that clears the close button, and the painting at 14% top.
    - The card keeps its drawing layer (the rods) over a painting.
  - Finding: the `@container dromos-view` rule that set the modal's own padding on phones never applies, since a container cannot query itself. The modal keeps 20 px, so the card's negative margins follow `--dromos-book-modal-pad` on phones too. This was already the case before this change and is left as it is.
  - Checks: `npm test` 187 files, 2601 tests passed; `npm run lint` 0 errors (the same 4 warnings); `npm run build` passed.
  - Differential against 55e744b: the book card (reading, and finished while busy) and the resource card with a video and a takeaway, without a painting, give byte-identical HTML.
  - The real code, rendered with the paintings at 1160 and 390 px in both themes, matches the approved mockup. `install:local` done.
