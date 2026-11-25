# Scene videos: a short loop over a scene's painting

Objective: a painted scene can play a short, muted, looping video from the vault over its painting, light and dark, and the painting shows still whenever the video cannot or should not play.
Branch `feat/scene-video` from `main` after 0.24.0. Delivery: work-unit commits; merge and release only with the user's go-ahead. Runner: Vitest (`npm test`), then `npm run lint` and `npm run build`.

## Specs

The user's request (L1): "ya luego si hacemos el tema de los videos para ver que tal funcionaria todo" (own-art L12) and "continuemos con el tema de los videos" (own-art L18). It began as Esdras's question for the user: "¿en qué vista de Dromos probamos un video corto en bucle como fondo?"

- **S1 Where the videos live** (the recommendation sent to Esdras, own-art L12, which the user continued with): in the vault, next to the paintings, `<Dromos folder>/Arte/<scene>-<theme>.webm`, "no va empaquetado ni con ruta configurable". Assumption, announced: `.mp4` is accepted too, and WebM wins when both exist.
- **S2 The painting is its still frame and fallback** (same recommendation: "la pintura `archive-dark.webp` sirve de poster y de respaldo"): a video plays only over its theme's painting, and without that painting it is ignored. With the video missing, not synced or not playing, the painting shows.
- **S3 It plays only when someone can see it** (Esdras's proposal: "Pausarlo cuando no se ve … y en el móvil si gasta batería"; "Con `prefers-reduced-motion`, mostrar un `poster` quieto"): muted, looping, inline; paused while out of sight, in a hidden tab or while the window is hidden; never played under reduced motion.
- **S4 Each theme its own** (the recommendation: "El `src` de un `<video>` no se cambia con CSS"): a theme without its video shows its painting still.
- **S5 No veil** (the recommendation: "El velo no hace falta"): text stays on parchment panels, as own-art S1 says.
- **S6 Where it is tried first** (the recommendation: "el archivo de noche, porque la vela es lo que más gana con movimiento"): the mechanism works for every painted scene; the test starts with `archive-dark`, and `desk-dark` for the lamp. Dromos's side makes placeholder loops from the user's paintings so it can be seen working, and writes prompts for the user's real videos.

## Tasks

| ID | Specs | Task | Route | Status | Commit |
|----|-------|------|-------|--------|--------|
| T1 | S1, S2, S4 | Find the videos beside the paintings (domain, `sceneArtView`) | inline | done (L2) | 215e84e |
| T2 | S2-S5 | Play them in the scene's background layer: `SceneLayers`, a playback hook on `watchSight`, the CSS by theme and reduced motion | inline | done (L2) | 215e84e |
| T3 | S6 | Placeholder loops for `archive-dark` and `desk-dark`, video prompts in `docs/own-art.md`, README and CHANGELOG, `install:local` | inline | done (L2) | 6b103c7 |

## Log

- **L1** (2026-11-25, user): "si subamos esto de dromos porfavor y subamos la version si es necesario y continuemos con el tema de los videos". Own art was released as 0.24.0 first (own-art L18). This document starts the videos. The specs come from the recommendation sent to Esdras for the user (own-art L12), which the user carried on with.
- **L2** (2026-11-25): T1-T3 done, inline, test first.
  - RED then GREEN: in `SceneArt.test.ts`, 4 new tests (a video beside its painting, webm before mp4, none without its painting, other formats ignored) plus 3 expectations updated to the new shape; `scenePlayback.test.ts` (6); `sceneArtView.test.ts` (1 new, 2 updated); `archive.test.tsx` (2).
  - Code:
    - `ScenePainting` gains `lightVideo` and `darkVideo`, set only beside their theme's painting.
    - `ScenePaintingView.videos` holds the theme, the source and the poster (the painting).
    - `SceneVideo` renders a `<video>` (muted, loop, `playsInline`, `preload="none"`, painting as poster) inside the background layer.
    - `playWhileSeen` (`src/ui/atoms/scenePlayback.ts`) plays while `watchSight` reports it in sight and the page is shown, and pauses otherwise.
  - CSS: the other theme's video and every video under reduced motion are `display: none`, so they are never in sight. `object-position` follows each scene's painting.
  - The cards play the desk's video too, since they take the desk's painting view. This is the assumption announced in S6, "every painted scene".
  - Checks:
    - `npm test` 188 files, 2617 tests passed; lint 0 errors (the same 4 warnings); build passed.
    - Differential against `main`: the room, archive, shelf and card with all eight paintings and no video, and the room with no art, give byte-identical HTML.
  - Placeholders:
    - `archive-dark.webm` (251 KB) and `desk-dark.webm` (276 KB), 1800×594, 4 s, VP8.
    - Made from the user's paintings with a seamless flicker of the flame and its light: PIL frames encoded with Playwright's bundled ffmpeg, which has no pipe protocol, so the frames go through a file.
    - Copied into `Dromos/Arte/`.
  - Real playback, the real code bundled for the browser with Playwright's Chrome:
    - dark theme playing (t=2.51), light theme paused, dark again playing;
    - scrolled out of sight, paused;
    - reduced motion, paused from the start;
    - always muted.
  - The decode check gave 1800×594, 4.00 s, and the flame's luminance moved 135→136→137→116 (archive) and 148→149→150→127 (desk).
  - Docs: `docs/own-art.md` "Videos" (where, rules, size, the Sync **Videos** switch, a motion block and a line per scene), README, CHANGELOG `[Unreleased]`. `install:local` done.
  - Next: the user's look in Obsidian; the user's real videos replace the placeholders; merge and release with the user's go-ahead.
- **L3** (2026-11-25, user): "publica ya porfavor".
  - Released as 0.25.0 (minor), as 0.24.0 was:
    - `feat/scene-video` merged into `main` (0a150f9);
    - `release/0.25.0` with `docs(changelog): 0.25.0` and `npm version minor` (190a01b, tag `0.25.0`), merged back (ed16537).
  - On `main` before pushing: `npm test` 2617 passed, lint 0 errors, build passed. `main` and the tag were pushed as NickGV.
  - `release.yml` succeeded, and the release carries `main.js`, `manifest.json` and `styles.css`.
  - The two placeholder videos are in `Dromos/Arte/`. The phone gets them only with Sync's **Videos** switch on; otherwise it shows the paintings.
