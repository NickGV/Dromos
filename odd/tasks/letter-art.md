# Letter art: Esdras's letter as papyrus, with his painted portrait

Objective: Esdras's letter on Home reads as the same papyrus as "Leyendo ahora", and his portrait can be the user's own painting, with nothing new that moves or plays on Home. The landscape comes after this, and it needs measured performance numbers.
Branch: `feat/letter-art`. Delivery: merge into main, release on the user's go-ahead. Test runner: Vitest (`npm test`), plus `npm run lint` and `npm run build`.

## Specs

- **S1** Esdras's letter is a papyrus scroll like the desk's: the same papyrus, rolled at its top and its bottom on rods with knobs, and with deckled sides. Folded and unrolled, the letter keeps every word, button, state and behaviour it has today. Text never sits on an image.
- **S2** Esdras's portrait can be the user's painting: `Dromos/Arte/esdras-light.<ext>` in the light theme and `esdras-dark.<ext>` in the dark theme, with the own-art S4 naming rules. The painting fills the niche under its arch; the frame, the molding and the new letter's wax seal stay. A theme without its painting keeps the drawn scribe. The paintings are read when Home opens and on each Sync.
- **S3** Performance (user: "tambien deberiamos tener en cuenta la cuestion del rendimiento"):
  - The letter adds nothing that moves or plays on Home. There is no video: an `esdras-*.webm` is ignored. There is no animation: the papyrus is static CSS.
  - The portrait files are small.
  - What already moves (the scene videos and the landscape's animations) is measured, so the landscape's plan starts from numbers.
- **S4** `docs/own-art.md` gives the prompts for the two portraits. When the user sends them, they are exported to WebP and placed in the vault.

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S1 | inline | pending | |
| T2 | S2, S3 (no video) | inline | pending | |
| T3 | S3 (measurements) | inline | pending | |
| T4 | S4 (prompts, docs) | inline | pending | |
| T5 | S4 (portraits in) | inline | waiting for the user's portraits | |
| T6 | release | inline | waiting for the user's go-ahead | |

## Log

- **L1** (2026-11-25, user): "continuemos mejor con la carta de esdras y luego hay si el paisaje porfavor" and "tambien deberiamos tener en cuenta la cuestion del rendimiento". My earlier proposal for the letter, which the user chose: "Ya es un pergamino, así que puede tomar el papiro que hicimos para 'Leyendo ahora'. Además, el retrato de Esdras como escriba podría ser una pintura tuya en vez del dibujo."
- **L2** (2026-11-25): Mockup and decisions:
  - **Mockup:** a scratch harness rendered the real `BriefingPanel` with an extra stylesheet, folded and open, light and dark, at 600 and 360 px. The letter loses its card border: the papyrus `::before` is the desk's, with a vertical deckle (seed 11), and the two `.dromos-scroll-edge` become rolls on a rod with knobs. The portrait grows from 46×57 to 64×79 on wide panes, so a painting reads; phones keep a small one inline.
  - **No portrait video:** Home is always on screen, and a loop the size of a thumbnail is not worth a decoder running all the time (S3).
  - **Route:** inline, because no writer trigger applies.
