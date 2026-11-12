# M11 · The avatar: a portrait for the character and for Esdras

Objective: the character gets a drawn portrait on the plaque, a ready-made wise man of the era, and Esdras gets his own in his letter, chosen by the user from mockups before any code. Vault plan: `02 - Projects/Dromos/02-Phases.md`, "Después de M5": "Avatar visual del personaje y de Esdras"; open question Q011.
Branch `feat/m11-avatar`. Delivery: work-unit commits, `--no-ff` merge into `main` and release only with the user's go-ahead. Runner: Vitest (`npm test`), then `npm run lint` and `npm run build`.

## Specs

Claude recommended the module after M10: "Lo próximo que te recomiendo es **M11: el avatar del personaje y de Esdras**", "La idea sería darte un retrato en la placa y darle a Esdras uno en su carta, con el mismo estilo de la época. Arrancaría con maquetas para que elijas, como hicimos con el header." It asked: "¿querés que tu avatar se parezca a vos, eligiendo pelo, barba, piel y ropa en los ajustes, o preferís un personaje de la época ya armado, sin personalizar?" The user answered (L2): "yo prefiero que sea ya armado por el momento, lugo veo si lo cambio, hazlo como un hombre sabio".

- **S1 The character's portrait.** "ya armado por el momento, lugo veo si lo cambio, hazlo como un hombre sabio".
  - A drawn portrait of a wise man of the era on the character's plaque, on every screen the plaque shows; the same for every user, with nothing to set (assumption: no settings in this version; changing it is for later, "lugo veo si lo cambio").
  - Drawn in Dromos's own style (flat fills on theme tokens, umber hairlines, ochre accents, like the merchant of the Shop), readable in light and dark themes and at phone width; calm motion at most, held still under reduced motion, offline and out of sight like the other scene life. The level medallion, the name, the title, the XP bar, the radar and the skills keep their meaning and their screen-reader text; the portrait is decoration (assumption) and does not repeat the name.
- **S2 Esdras's portrait.** Claude's proposal: "darle a Esdras uno en su carta, con el mismo estilo de la época". Today his letter shows "un pergamino dibujado en un círculo" (Q011) that a new letter turns into an ochre wax seal; the portrait takes that place and the new letter still shows its seal. Esdras must not be mistaken for the character: a scribe, not the wise man.
- **S3 Mockups first.** "Arrancaría con maquetas para que elijas, como hicimos con el header." A few options drawn at the plaque's and the letter's real sizes, in both themes, shown to the user; the chosen one is built. No code before the choice.
- **S4 Release.** Publish the version and check it on desktop and Android, with the user's go-ahead.

## Tasks

| ID | Specs | Task | Route | Status | Commit |
|----|-------|------|-------|--------|--------|
| T0 | S1-S3 | Mockups: three options for the wise man on the plaque, with Esdras in his letter | delegated, mockup writer (context backstop: the parent session is long); scratch only, no repository write | in progress | |
| T1 | S1, S2 | Build the chosen option | after the user's choice | pending | |
| R1 | S4 | Release with the user's go-ahead | inline | pending | |

## Log

- **L1** (2026-11-12, user): "chat listo, el shop quedo bien, que proxige?", to which Claude recommended M11, the avatar of the character and of Esdras (Q011: "El avatar se decide cuando el briefing ya se lea a diario", and the letter is read daily on home).
- **L2** (2026-11-12, user): "yo prefiero que sea ya armado por el momento, lugo veo si lo cambio, hazlo como un hombre sabio".
