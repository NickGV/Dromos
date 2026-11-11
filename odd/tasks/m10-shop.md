# M10 · La tienda: rewards, Esdras's offers and the level bonus

Objective: a Shop screen where the user buys, with his Habitica gold, his own Habitica rewards and the offers Esdras writes, and a gold bonus paid once for each new level. Contract: vault `02 - Projects/Dromos/03-Tech-Decisions.md`, ADR-019; plan: `02-Phases.md`, M10.
Branch `feat/m10-shop`. Delivery: work-unit commits, `--no-ff` merge into `main` and release only with the user's go-ahead. Runner: Vitest (`npm test`), then `npm run lint` and `npm run build`.

## Specs

The user's idea (L1): "estaba pensando en realizar algo asi como una tienda donde estarian algunas recompensas que vienen directamente de habitica y que yo pueda comprar y tambien quizas comprar y podria ser tambien que esdras me venda algunas". His changes (L2): "con el tema del 3 no creo que sea por nivel, terminaria con muchos titulos" and "creo que mejor el oro aparezca solo en la tienda, no quiero verlo en la placa del personaje, el oro viene y debe venir directamente de habitica, si se puede el tema del oro extra podria estar bien, porque nos ayudaria con el tema de la recompensas". His approval (L4): "si asi me parece bien", to Claude's plan, whose key point was: "que Dromos toque tu oro en Habitica en dos casos: restar cuando comprás, siempre con confirmación, y sumar el bono cuando subís de nivel".

- **S1 The gold and the Habitica rewards.** "recompensas que vienen directamente de habitica y que yo pueda comprar"; "el oro viene y debe venir directamente de habitica".
  - The gold is Habitica's `stats.gp`; Dromos keeps no currency of its own and shows the gold only in the Shop (never on the plaque), as a whole number.
  - The Shop lists the user's own Habitica rewards (tasks of type `reward`): their name, their notes when they have any, and their price (`value`).
  - Buying one asks for a confirmation that names the reward, its price and the gold left after it; confirmed, it buys it in Habitica (`POST /api/v3/tasks/:id/score/up`, which takes the gold) and shows the new gold Habitica returns. A reward that costs more than the gold there is cannot be bought, and says why.
  - The Shop reads the gold and the rewards when it opens (and on Sync), never on a timer (Habitica allows 30 requests a minute). Offline or without credentials, it says so and lets nothing be bought. A failed purchase says what happened and changes nothing in the vault.
- **S2 Esdras's offers.** "podria ser tambien que esdras me venda algunas".
  - Offers live in `<Dromos folder>/Shop.md`, a table `| id | offer | price | why | until |` that only Esdras writes (ADR-019): `id` a short unique name, `price` whole gold, `why` why he offers it, `until` a `YYYY-MM-DD` date or empty. Dromos only reads it.
  - The Shop shows the open offers (not bought, not past `until`) with their offer, why, price and "until" date. A row it cannot read is reported, the others still show.
  - Buying one, after the same confirmation, creates it as a reward in Habitica and buys it, and writes the purchase into the purse (S3). A bought offer is not offered again.
- **S3 The level bonus and the purse.** "si se puede el tema del oro extra podria estar bien, porque nos ayudaria con el tema de la recompensas"; and the plan's "Dromos te suma oro en Habitica cada vez que subís de nivel, por ejemplo 10 por cada nivel nuevo (30 al pasar al 3). El monto queda en la nota de reglas del vault, así lo podés cambiar. Dromos anota qué niveles ya pagó, así nunca te paga dos veces el mismo."
  - When the game sync finds the character reached a new level, Dromos adds `goldPerLevel × that level` gold in Habitica (`PUT /api/v3/user` setting `stats.gp` to the gold it just read plus the bonus), once for each level reached (two levels at once pay both). `goldPerLevel` comes from the rules note (`Rules.md`) and is 10 when the note does not set it. No bonus for levels reached before M10 ships.
  - The purse, `<Dromos folder>/Purse.md`, a table `| date | kind | what | gold | level | offer |` that only Dromos writes: one row for each purchase (`purchase`, negative gold, with the offer's `id` for an offer) and each bonus (`bonus`, with its level), written when Habitica confirms. Before paying a bonus Dromos reads the purse again, and a level with a `bonus` row is never paid again. A failed payment writes nothing and is tried again on the next sync.
  - The user hears of the bonus ("+30 gold for reaching level 3") as Dromos announces other game news.
- **S4 The Shop screen.** "una tienda"; and the plan's "una tabla nueva en el cartel, Tienda".
  - A sixth plank, **Shop** (Spanish **Tienda**), after Library and before Settings; the signpost hangs three planks a side; the current one burnt in, as today. The Shop opens with its header card ("Shop"), the gold, the Habitica rewards, Esdras's offers, and the last purchases from the purse.
  - Copy in English and Spanish; light and dark themes; readable at 360 px; every button and amount named in words for screen readers.
- **S5 Release.** Publish the version and check it on desktop and Android, with the user's go-ahead.

## Tasks

| ID | Specs | Task | Route | Status | Commit |
|----|-------|------|-------|--------|--------|
| T1 | S1, S4 | The gold and the Habitica rewards in a Shop screen behind a sixth plank, with buying | delegated, writer G (context backstop) | pending | |
| T2 | S2 | Esdras's offers from `Shop.md`, bought through Habitica, recorded in the purse | delegated, writer G (depends on T1, T3's purse) | pending | |
| T3 | S3 | The level bonus and the purse | delegated, writer G | pending | |
| T4 | S1-S4 | Independent verification (Risk: item 1, a purchase or a bonus changes the user's Habitica gold), seam check, live check, README, CHANGELOG, docs/habitica.md | verifier delegated; the rest inline | pending | |
| R1 | S5 | Release with the user's go-ahead | inline | pending | |

## Log

- **L1** (2026-11-11, user): "lo podriamos hacer ya? Yo tambien estaba pensando en realizar algo asi como una tienda donde estarian algunas recompensas que vienen directamente de habitica y que yo pueda comprar y tambien quizas comprar y podria ser tambien que esdras me venda algunas, es solo una idea, pero no la tengo materializada todavia", answering Claude's suggestion of level-up rewards.
- **L2** (2026-11-11, user): "con el tema del 3 no creo que sea por nivel, terminaria con muchos titulos, ahora mismo soy un corredor, pedo si paso al 3 ya me cambiarian el titulo, seria muy facil de esa manera, quizas estaria bien de otra parte / 4 creo que mejor el oro aparezca solo en la tienda, no quiero verlo en la placa del personaje, el oro viene y debe venir directamente de habitica, si se puede el tema del oro extra podria estar bien, porque nos ayudaria con el tema de la recompensas, pero si no podemos ver como lo podemos hacer de otra manera".
- **L3** (2026-11-11): verified in Habitica's source (`website/server/libs/user/index.js`): `PUT /api/v3/user` accepts every `stats` path except `stats.class` (`updatablePaths` includes `'stats'`, `restrictedPUTSubPaths` only `'stats.class'`), so `stats.gp` can be set. Titles left out of M10.
- **L4** (2026-11-11, user): "si asi me parece bien". ADR-019 and M10 written into the vault; Esdras told of his `Shop.md` part.
