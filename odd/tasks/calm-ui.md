# Calm UI: accessibility fixes and a warm identity

Objective: fix the accessibility defects found in the review of 2026-11-03, then make the home screen read as a calm RPG instead of a generic dashboard.
Branch: `feat/calm-ui`, from `main` at `d3e4c16`. Delivery: `single-pr`, merged into `main` without squash as M3 to M5 were; T1 is released as 0.6.2 from the branch, the rest as 0.7.0, each tag with the user's go-ahead. Tests: Vitest (`npm test`). Forecast: about 1,600 authored lines.

## Specs

The user accepted the review and one decision (L2). The items below come from that review (assumption: the user accepted them as a whole, not item by item). The only verbatim words are in L1 and L2.

- **S1** Accessibility defects, released as a fix:
  1. The sync status live region announces a change of status, not the minute count every minute.
  2. The campaign title button keeps a visible keyboard focus ring and a touch-sized target on mobile.
  3. Text reaches WCAG AA contrast (4.5:1) in Obsidian's default light and dark themes: quest group headings, the briefing of another day, locked skills and their met requirements, warning and overdue chips. Nothing is dimmed with `opacity`.
  4. "Synced N ago" uses hours and days past 60 minutes.
  5. The `<summary>` toggles are touch-sized on mobile.
  6. The home screen carries `lang` for the selected interface language.
  7. Headings nest: skill names sit under their group heading, and the panel of Esdras has a heading.
  8. Sync and Send to Habitica keep keyboard focus while busy (`aria-disabled`, not `disabled`).
  9. With reduced motion the spinner stops.
- **S2** Identity (decision D4 amended, L2): Dromos-owned tokens `--dromos-*` for ochre, clay, olive, warm grey and a display serif, with light and dark values, layered over Obsidian's variables; surfaces stay Obsidian's. XP and level in ochre, the stalled seal in clay, built habits in olive. Section titles in serif small caps with hairline rules. A local serif stack (no web font). No `color-mix()` without a plain fallback (iOS below 16.2).
- **S3** Character first: the character card is the first thing on screen. A quiet "Synced N ago · Sync" line lives in the card; a full banner shows only for offline, unauthorized, rate limited, error and not configured. The level-up becomes a ribbon in the card.
- **S4** Calm campaigns: a stalled campaign is marked by the clay seal only (no red border, no red bar). Phases drawn as one segment per phase. "Next step" in italics, without the dashed box. Inner cards flattened into rows. The title signals that it opens the note without relying on hover. No "Not linked" chip next to a "Send to Habitica" button.
- **S5** Skills as medallions: a grid of round medallions, earned in ochre with their level, locked in warm grey with a small lock and their closest requirement; selecting one shows today's card content. Icons come through an injected renderer so `ui` still does not import `obsidian`.
- **S6** Copy and settings: "Ask for a briefing" names what it does (it copies a command). The settings show where to find the token, `inputMode` numeric for days, no autocapitalize or spellcheck on the user ID.
- **S7** Two columns (quests | campaigns) when the view is at least 760 px wide.
- **S8** Illustrated header: an inline SVG landscape whose fills are tokens, with a night variant for the dark theme; shorter on narrow views.

## Tasks

| ID | Specs | Scope | Route | Status | Commit |
|---|---|---|---|---|---|
| T1 | S1 | Live region split, focus ring, contrast without opacity, hours and days, touch sizes, `lang`, headings, `aria-disabled`, reduced motion; markup tests with `react-dom/server` | inline (no Writer trigger: one unit, shares `styles.css` with T2) | pending | |
| T2 | S2 | Tokens and type in `styles.css`; values sent to Esdras for `08-Visual-Design.md` | inline | pending | |
| T3 | S3 | `HomeScreen`, `CharacterCard`, `StatusBanner`, `LevelUpBanner`, presenters | inline | pending | |
| T4 | S4 | `campaignView`, `PhaseProgress`, `CampaignCard`, `CampaignTaskRow` | inline | pending | |
| T5 | S5 | `SkillCard`, `SkillsPanel`, icon renderer in the composition root | inline | pending | |
| T6 | S6 | `en.ts`, `es.ts`, `DromosSettingTab.ts` | inline | pending | |
| T7 | S7 | Container query in `styles.css` | inline | pending | |
| T8 | S8 | `ui/atoms/Landscape.tsx`, `CharacterCard`, `styles.css` | inline | pending | |

## Log

- **L1** (2026-11-03): User, original request: "chat como ya sabes masomenos todo lo que se ha realizado en dromos, sabes tambien lo que se quiere con dromos, quisiera que primero hicieras una revision de todo lo que se ha hecho, tambien mira los issues para ver cuales ya los podemos cerrar, revisa tambien la ux/ui, sabes que tenemos un design, pero si piensas que se puede ver mejor me parece correcto que vayamos mirando toda esta parte y bueno tambien estaria bien que revisaras el plan que tenemos". The review ran read-only (three explorers: issues, plan, UI). UI findings: the screen reads as an Obsidian dashboard because D4 (`odd/tasks/m2-campaigns.md` L8) limited colors to Obsidian's variables and nothing replaced the identity of `08-Visual-Design.md`; the sync bar comes before the character; a stalled card is red three ways; nine accessibility defects (S1), checked in the code.
- **L2** (2026-11-03): Asked "¿Aceptás cambiar D4 para que Dromos tenga su propia paleta cálida (ocre, arcilla, oliva) encima de las variables de Obsidian, de modo que siga funcionando en tema claro y oscuro?". User: "si lo acepto, vamos a ir realizando estos arreglos y estas mejoras, podemos soltar subagentes de ser necesario, y te recuerdo que el claude esdras esta disponible por si quieres hablar con el". The vault-side findings (README `phases` still M4 active, the one-week decision missing from `02-Phases.md`, stale ADRs and questions, the campaign fields of issues #1 and #2) were sent to Esdras the same day; the vault is theirs to write.
