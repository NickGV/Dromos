# M4: Esdras on screen

Objective: the guide speaks, in writing. The view shows `Dromos/Briefing.md`, which Esdras writes and Dromos only reads.
Branch: `feat/m4-briefing`. Delivery: `single-pr`, the branch merges into `main` without squash as M3 did. Tests: Vitest (`npm test`).

## Specs

Quoted from the vault (`02-Phases`, `04-Game-Design`, `08-Visual-Design`), in the user's language.

- **S1** Panel: "Plugin: `loadBriefing()` y `BriefingPanel` con el texto renderizado con `MarkdownRenderer`". Place: "**Panel de Esdras**: saludo y misión del día, o "Esdras aún no escribió hoy"", second on the home screen, after the character card. Look: "Un rollo abierto con el texto; ícono de pergamino 📜; firma "— Esdras"".
- **S2** Old briefing: "Si el briefing es de otro día, mostrarlo atenuado con "Esdras aún no escribió hoy"". Done when "Un briefing viejo se distingue de uno de hoy" and "la vista usa `created` para saber si es de hoy".
- **S3** Links: "La vista lo muestra con el formato de Esdras, con wikilinks clicables".
- **S4** Frontmatter: "El plugin muestra el cuerpo renderizado como markdown y usa el frontmatter para resaltar la misión y la skill cercana." Assumption, pending with Esdras: the plugin names the skill from `near_unlock.skill` and computes what is left from the game, ignoring `near_unlock.remaining`.
- **S5** Tests: "Parser de `Briefing.md`: sin frontmatter, con fecha de hoy, con fecha pasada"; "Render con `MarkdownRenderer` verificado a mano (no unit test)".
- **S6** Button: "Botón "Pedir briefing" que copia al portapapeles el comando para correr el oficio (sin ejecutar nada desde el plugin)". Blocked on the exact command from Esdras. Proposal, pending with Esdras: desktop only.
- **S7** Esdras's side, in `logos-dotfiles`, not in this repository: "nuevo oficio `dromos-briefing`" and "Actualizar `vault-context.md` describiendo la carpeta `Dromos/`". Done when "Correr el oficio en OpenCode genera un briefing coherente con el estado real". Open with Esdras: how the job knows its copy of the vault is current, since `last_sync` does not move on a sync with no changes.
- **S8** Trigger (Q013), decided by the user: "Si dale, manual por ahora". No timer and no Obsidian Headless in M4.
- **S9** Writer (ADR-008): "Esdras lee ese estado y escribe `Dromos/Briefing.md`". Dromos never writes that note.

## Tasks

| ID | Specs | Scope | Route | Status | Commit |
|---|---|---|---|---|---|
| T1 | S2, S4, S5, S9 | Domain `Briefing`, mapper of the note, `isBriefingOf` the day; parser tests | inline (no Writer trigger) | pending | |
| T2 | S1, S9 | Port, `VaultBriefingRepository`, `LoadHome` returns the briefing; a failed read does not hide the character | inline | pending | |
| T3 | S1, S2, S3, S4 | Presenter, `BriefingPanel`, Markdown adapter with clickable wikilinks, copy in both languages, CSS | inline | pending | |
| T4 | S6 | "Pedir briefing" button | inline | blocked: needs the command from Esdras | |
| T5 | all | README and CHANGELOG | inline | pending | |

## Not verified

- The render with `MarkdownRenderer` and the wikilinks: by hand in Obsidian, as S5 says.

## Log

- **L1** (2026-11-02): User: "Dale, arranquemos con M4".
- **L2** (2026-11-02): Esdras's session ended with the PC shutdown and no peer is reachable, so S4, S6 and S7 stay open with Esdras. The plugin side does not depend on them, so it goes first. The user answered Q013: "Si dale, manual por ahora".
