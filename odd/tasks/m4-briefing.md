# M4: Esdras on screen

Objective: the guide speaks, in writing. The view shows `Dromos/Briefing.md`, which Esdras writes and Dromos only reads.
Branch: `feat/m4-briefing`. Delivery: `single-pr`, the branch merges into `main` without squash as M3 did. Tests: Vitest (`npm test`).

## Specs

Quoted from the vault (`02-Phases`, `04-Game-Design`, `08-Visual-Design`), in the user's language.

- **S1** Panel: "Plugin: `loadBriefing()` y `BriefingPanel` con el texto renderizado con `MarkdownRenderer`". Place: "**Panel de Esdras**: saludo y misión del día, o "Esdras aún no escribió hoy"", second on the home screen, after the character card. Look: "Un rollo abierto con el texto; ícono de pergamino 📜; firma "— Esdras"".
- **S2** Old briefing: "Si el briefing es de otro día, mostrarlo atenuado con "Esdras aún no escribió hoy"". Done when "Un briefing viejo se distingue de uno de hoy" and "la vista usa `created` para saber si es de hoy".
- **S3** Links: "La vista lo muestra con el formato de Esdras, con wikilinks clicables".
- **S4** Frontmatter: "El plugin muestra el cuerpo renderizado como markdown y usa el frontmatter para resaltar la misión y la skill cercana." Agreed with Esdras (L4): the plugin names the skill from `near_unlock.skill` and computes what is left from the game; `near_unlock.remaining`, `mission.habitica_id` and `stale_campaigns` left the schema in `04-Game-Design#Briefing`. The panel signs, the body does not.
- **S5** Tests: "Parser de `Briefing.md`: sin frontmatter, con fecha de hoy, con fecha pasada"; "Render con `MarkdownRenderer` verificado a mano (no unit test)".
- **S6** Button: "Botón "Pedir briefing" que copia al portapapeles el comando para correr el oficio (sin ejecutar nada desde el plugin)". The command, from Esdras (L4): `/dromos-briefing`, run in OpenCode from the vault's folder. Desktop only, agreed (L4).
- **S7** Esdras's side, in `logos-dotfiles`, not in this repository: "nuevo oficio `dromos-briefing`" and "Actualizar `vault-context.md` describiendo la carpeta `Dromos/`". Done when "Correr el oficio en OpenCode genera un briefing coherente con el estado real". Freshness, from Esdras (L4): the job reads the date of the last ledger row, asks the user when it is older than yesterday or the month's ledger is missing, and states "Datos hasta <fecha>" in the body. The plugin adds no signal.
- **S8** Trigger (Q013), decided by the user: "Si dale, manual por ahora". No timer and no Obsidian Headless in M4.
- **S9** Writer (ADR-008): "Esdras lee ese estado y escribe `Dromos/Briefing.md`". Dromos never writes that note.

## Tasks

| ID | Specs | Scope | Route | Status | Commit |
|---|---|---|---|---|---|
| T1 | S2, S4, S5, S9 | Domain `Briefing`, mapper of the note, `isBriefingOf` the day; parser tests | inline (no Writer trigger) | done: 8 tests RED (missing module) then GREEN | `54d3bf4` |
| T2 | S1, S9 | Port, `VaultBriefingRepository`, `LoadHome` returns the briefing; a failed read does not hide the character | inline | done: 6 tests RED then GREEN, 866/866, lint 0 errors and 4 warnings. `VaultBriefingRepository` has no unit test (Obsidian-bound) | `54d3bf4` |
| T3 | S1, S2, S3, S4 | Presenter, `BriefingPanel`, Markdown adapter with clickable wikilinks, copy in both languages, CSS | inline | done: `briefingView` 11 tests RED then GREEN, 877/877, lint 0 errors and 4 warnings, build ok. `createMarkdownRender`, `MarkdownBlock`, `BriefingPanel` and the container wiring have no unit tests (no React harness); manual check pending, as S5 says. Risk: item 6, so one independent verifier runs at the end of the feature | `4b90615` |
| T4 | S6 | "Pedir briefing" button | inline | done: `RequestBriefing` and `briefingRequestMessage`, 7 tests RED then GREEN, 881/881, lint 0 errors and 4 warnings, build ok. `SystemClipboard` and the button have no unit tests (Obsidian-bound, no React harness): manual check pending | this commit |
| T5 | all | README and CHANGELOG | inline | done, unreleased section | `4a123bd`, this commit |

## Not verified

- The render with `MarkdownRenderer`, the wikilinks and the button: by hand in Obsidian, as S5 says. Nothing has run in Obsidian yet: this build is not installed. Esdras left a sample `Dromos/Briefing.md` for it (L4).
- Esdras's job itself: "Correr el oficio en OpenCode" has not been run. It is uncommitted in `logos-dotfiles`, which is Esdras's to commit.
- What a wikilink to a note that does not exist does when followed. `openLinkText` should create it, as anywhere in Obsidian; check it by hand, since Dromos would have caused that note.
- A render that resolves after its view closed. The adapter fills its own child for that reason; StrictMode's double effect in the real view is the check.

## Log

- **L1** (2026-11-02): User: "Dale, arranquemos con M4".
- **L2** (2026-11-02): Esdras's session ended with the PC shutdown and no peer is reachable, so S4, S6 and S7 stay open with Esdras. The plugin side does not depend on them, so it goes first. The user answered Q013: "Si dale, manual por ahora".
- **L3** (2026-11-02): T1-T3 done on the branch, not pushed. `stale_campaigns` and `mission.habitica_id` are not read: the campaign cards already stamp the stalled ones and nothing here needs the id. Next: Esdras answers S4, S6 and S7 when their session is open, then T4, the manual check and the independent verifier.
- **L4** (2026-11-02): Esdras, in their session: "Frescura: no necesito señal nueva del plugin (de acuerdo, no escribas la nota en cada sync). El oficio lee la fecha de la última fila del ledger; si es anterior a ayer o falta el ledger del mes, le pregunta a Nick si Sync ya trajo los datos y no escribe hasta que responda. Además el cuerpo declara "Datos hasta <fecha>"." / "`near_unlock.remaining`, `mission.habitica_id` y `stale_campaigns` salen del esquema (ya editado en 04-Game-Design#Briefing). Las campañas estancadas las menciono en el cuerpo. El oficio no firma." / "Comando exacto a copiar: `/dromos-briefing` (comando de OpenCode, hay que correrlo desde la carpeta de la vault; la ruta no la conoce el plugin). Botón solo en escritorio: de acuerdo." Checked on disk: the sample note, the locked skill `desarrollador`, the schema, Q013 decided, and both job files. T4 follows.
