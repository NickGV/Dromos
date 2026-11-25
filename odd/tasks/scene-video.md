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
| T1 | S1, S2, S4 | Find the videos beside the paintings (domain, `sceneArtView`) | inline | pending | |
| T2 | S2-S5 | Play them in the scene's background layer: `SceneLayers`, a playback hook on `watchSight`, the CSS by theme and reduced motion | inline | pending | |
| T3 | S6 | Placeholder loops for `archive-dark` and `desk-dark`, video prompts in `docs/own-art.md`, README and CHANGELOG, `install:local` | inline | pending | |

## Log

- **L1** (2026-11-25, user): "si subamos esto de dromos porfavor y subamos la version si es necesario y continuemos con el tema de los videos". Own art was released as 0.24.0 first (own-art L18). This document starts the videos. The specs come from the recommendation sent to Esdras for the user (own-art L12), which the user carried on with.
