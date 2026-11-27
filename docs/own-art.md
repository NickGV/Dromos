# Own art

Dromos can show paintings you keep in your vault behind some scenes, one for the light theme and one for the dark theme, instead of their drawing. This page says where the files go and how to make them.

The first scenes are the Library's **wall** (behind the alcoves) and **desk** (behind the scrolls being read), and the **archive** room. The **shelf** (inside an alcove) has one too; on a painted shelf, its row titles and each scroll's state sit on parchment. The Shop's stall is the **shop** scene: its painting replaces the drawn stall, merchant included, and the gold stays on its plaque over it. Esdras's portrait in his letter is **esdras**: the painting fills the niche under its arch, and the frame and the new letter's wax seal stay. The countryside above every screen is the **landscape**, in four paintings for the times of day: the gate, the walker and the campfire are still drawn over it, and the **walker** can be your painting too, one per stage of life, with the skills' objects. The book and resource cards take no painting of their own: a card opens as a scroll lying on the reading desk, so it shows the **desk** paintings around its sheet.

## Where the files go

- In your Dromos folder (the plugin's vault folder setting, `Dromos` by default), in `Arte/`: `Dromos/Arte/<scene>-light.<ext>` and `Dromos/Arte/<scene>-dark.<ext>`, with `<scene>` one of `wall`, `desk`, `shelf`, `archive`, `shop`, `esdras`, `landscape`, and `<ext>` one of `webp`, `png`, `jpg` (`jpeg` works too). The case of the name does not matter. If one painting has several files, WebP wins, then PNG, then JPG.
- A theme without its file draws the scene as always, even when the other theme has one.
- At night, from 21:00 to 05:00, the light theme shows the dark painting and its loop of the Library's scenes (wall, desk, shelf, archive, and a book's or resource's card over the desk) and of the Shop's stall, as the landscape shows its night. The cards, plates, text and buttons keep the light theme. A scene with only a light painting keeps it at night. Esdras's portrait keeps to its theme.
- The landscape also takes `Dromos/Arte/landscape-dawn.<ext>` and `Dromos/Arte/landscape-dusk.<ext>`, for the light theme's dawn and dusk ([landscape](#landscape-the-countryside-above-every-screen)).
- The walker on the road takes `Dromos/Arte/walker-<stage>.<ext>`, one per stage of life, and `Dromos/Arte/object-<skill>.<ext>`, one per skill's object, by the same rules and with no theme in the name ([walker](#walker-the-painted-walker-on-the-road)).
- While a painting is there, it replaces the scene's drawing: the lamp, the ink pot, and the archive's window and worktable come from the painting, which is why the prompts ask for them. Text and buttons stay on their parchment panels.
- Dromos looks for the files when Home, the Library or the Shop opens and on **Sync**, so a painting you add shows after the next **Sync**. Obsidian serves them from the vault (`Vault.getResourcePath`): they sync to your phone with the vault, and the plugin carries none.

## Making the images

Paste the shared style block first, then one scene prompt. Percentages are of the finished image: x from the left, y from the top. Dromos shows the image cropped to fill the scene and centred, so wide panes keep the full width and lose some of the top and bottom, while phones keep the full height and only a central strip. The archive is the exception: its painting is anchored to the bottom, so the worktable stays on wide panes and the top of the wall is what they lose. The **focal area** of each prompt is the part every pane keeps.

If the generator cannot make the exact ratio, make the closest one it offers, extend the sides by outpainting, and resize to the given size. Export as WebP at about quality 80 and keep each file under about 600 KB: the files sync to your phone with the vault. A generator's JPEG converts with `cwebp -q 80 wall-dark.jpeg -o wall-dark.webp`; the first paintings went from about 2 MB to about 50 KB each with no visible loss.

The scripts that made the files below (the layout guides, the walker's cut-outs, the road check, the loops with motion and their CPU cost) are in the repository's [tools/art](../tools/art/README.md), which says how to run each one.

### Shared style block

```text
STYLE (Dromos). A background painting for a calm role-playing game of one person's real life, set in an ancient library and scriptorium of the Mediterranean and Near East in the age of papyrus: dressed limestone, plaster, cedar and olive wood, papyrus, clay, wax tablets, bronze and clay oil lamps. Warm, painterly and restrained, like a quiet museum illustration or a gouache background for an animated film: soft brushwork, gentle light, subtle surface texture. Never cartoonish, never childlike, never glossy, never photographic, never fantasy-epic.
Mood: serene, unhurried, a place visited every day. Low contrast and soft edges everywhere; no single bright spot except where the scene prompt asks for one.
Palette, use only these families. Light theme (daylight): paper #FAF5EA, parchment #F3E9D2, limestone #EADCBD, niche shade #E2D2B0, pale wood #D9BC8C and #C4A274, umber lines #8B5E3C, ochre #C9962B, olive #6E8B4E and #8FA66B, clay #B5593C, pale sky #CFE3E8 to #E6EFEB, warm cream light. Dark theme (night): paper #1B1713, parchment #262019, stone #2A231C, niche #211B16, wood #4A3826 and #362818, umber #A8825F, papyrus #CFBE9C, ochre #D4A64A, lamp flame #E8B04A with a flat warm halo, night sky #121629 to #283049, moon #E8DDB5, hills #34452F; warm and lamplit, never cold, never blue-black.
Absolutely no text, letters, numbers, glyphs, hieroglyphs, inscriptions, pseudo-writing, signatures, watermarks, logos or frames. The scene prompt gives positions as percentages and colours as hex codes: they say where things go and what colour they are, and are never painted as labels. No people, figures, faces or hands. No modern objects, no books with spines, no screens. No neon, no glow effects, no lens flare, no bloom, no hard shadows, no heavy vignette, no strong gradients.
This image sits behind interface panels: keep it quiet and even so text panels placed on top stay readable. Do not paint any shelves, niches, scrolls, buttons or boxes in the areas the scene prompt says will be covered.
```

---

### wall: the back wall of the reading room

Box: 1068 x 314 CSS px on the desktop pane (3.4:1), 784 x 527 at 840 px (1.5:1), 334 x 681 on a
phone (0.49:1), taller with more shelves. Opaque alcove cards cover most of it; the painting shows
in the gutters, in an empty column at the right of the first row, and across the lower right beside
the doorway card (desktop and 840). Phones show only thin gutters.

#### wall-dark

```text
SCENE: the back wall of an ancient reading room at night, seen straight on, flat frontal view with no perspective and no floor. Large courses of dressed limestone blocks in deep warm brown (#2A231C), the joints thin and faint (umber #A8825F at low opacity), the surface softly worn. No light from above: the upper wall fades into deep warm shadow. A low, warm lamplight glow rises from below, from an oil lamp standing off-frame in front of the wall, so the lower third is faintly warmed with amber (#E8B04A at very low strength) and strongest toward the lower right.
MUST NOT SHOW: niches, arches, alcoves, shelves, scrolls, boxes, doors, windows, furniture, the lamp itself. Those are drawn on top.
COMPOSITION: an even, repeating wall that reads well when cropped anywhere; no focal object. The only change across the image is the gentle glow, brightest at about x 60-95%, y 60-100%.
QUIET ZONE: everything above y 60% stays dark and even.
FORMAT: 3200 x 1600 px, aspect 2:1. Focal (always kept) area x 38-62%, y 21-79%: keep it plain stone.
```

#### wall-light

```text
SCENE: the back wall of an ancient reading room on a summer afternoon, seen straight on, flat frontal view with no perspective and no floor. Large courses of pale dressed limestone (#EADCBD) with thin soft joints (#8B5E3C at low opacity), a faint plaster texture. A soft diagonal shaft of warm cream daylight (#FFF6DE, translucent) falls from a high opening off-frame at the upper left and lands broad and diffuse on the lower right of the wall; the rest of the wall is in even, gentle half-shade.
MUST NOT SHOW: niches, arches, alcoves, shelves, scrolls, boxes, doors, the window itself, furniture. Those are drawn on top.
COMPOSITION: an even wall that reads well when cropped anywhere; the light shaft is the only accent, soft-edged, landing at about x 55-95%, y 55-100%.
QUIET ZONE: no bright edges and no dark patches anywhere; the light stays a gentle lift, not a spotlight.
FORMAT: 3200 x 1600 px, aspect 2:1. Focal (always kept) area x 38-62%, y 21-79%: plain stone, maybe the soft edge of the light.
```

### desk: the reading desk in front

Box: 1068 x 305 (3.5:1) on desktop, 784 x 305 (2.6:1) at 840, 334 x 477 (0.7:1) on a phone; 128 px
tall when nothing is being read, 551+ with four books. Opaque scroll cards cover the middle; the
painting shows as a 46 px band along the top, a 26 px band along the foot, and 16 px at the sides.
Today the top band holds the clay oil lamp at the top left (night only) and the ink pot with a quill
at the top right; under S3 they are gone unless painted.

#### desk-dark

```text
SCENE: the top of a long wooden reading desk at night, seen from slightly above, the planks running left to right across the whole image. Dark oiled cedar (#4A3826) with soft grain, the near front edge a darker band (#362818) along the bottom 6-8% of the image. Warm light from a small clay oil lamp: the lamp sits near the top left, small (about x 10-16%, y 6-18%), a tiny steady flame (#E8B04A) with a flat warm halo, no glow or flare; its light pools softly across the upper half of the desk and fades toward the right. A small clay ink pot with a reed pen near the top right (about x 84-90%, y 6-18%), in shadow.
MUST NOT SHOW: scrolls, papers, books, tablets or anything else on the middle of the desk; the scrolls being read are drawn on top. No walls, no shelves.
COMPOSITION: the middle band (y 20-88%) is plain wood, evenly lit, nothing on it. Objects only in the top band, small.
QUIET ZONE: x 20-80%, y 20-88%: plain, even, no knots or highlights.
FORMAT: 3600 x 1200 px, aspect 3:1. Focal (always kept) area x 38-62%, y 7-93%; the lamp and ink pot do not show on phones, which keep only x 38-62%.
```

#### desk-light

```text
SCENE: the top of a long wooden reading desk on a summer afternoon, seen from slightly above, the planks running left to right across the whole image. Pale olive and cedar wood (#D9BC8C) with fine soft grain, the near front edge a slightly darker band (#C4A274) along the bottom 6-8% of the image. Soft warm daylight from the upper left falls evenly across the desk; no lamp is lit. A small clay ink pot with a reed pen near the top right (about x 84-90%, y 6-18%); an unlit clay oil lamp may rest near the top left (about x 10-16%, y 6-18%).
MUST NOT SHOW: scrolls, papers, books, tablets or anything else on the middle of the desk; the scrolls being read are drawn on top. No walls, no shelves.
COMPOSITION: the middle band (y 20-88%) is plain wood, evenly lit, nothing on it. Objects only in the top band, small.
QUIET ZONE: x 20-80%, y 20-88%: plain, even, no knots, no strong sun patches.
FORMAT: 3600 x 1200 px, aspect 3:1. Focal (always kept) area x 38-62%, y 7-93%; the ink pot and lamp do not show on phones.
```

### archive: the archive room

Box: 1068 x 267 (4:1) on desktop, 784 x 267 (2.9:1) at 840, 334 x 210 (1.6:1) on a phone. Wide
panes: opaque pigeonhole boxes fill the upper right (from x 18%, 24% at 840, down to y 63%); the
painting shows as a left column (where the arched window is drawn today) and the foot (where the
worktable is drawn). Phones: the pigeonholes are a row of chips across the middle (y 46-67%); the
painting shows above and below them, from the central half of the image only. Under S3 the window
and the table are painted, not drawn.

#### archive-dark

```text
SCENE: a small archive room at night, seen straight on, wide panorama. At the far left, a tall round-arched window in a thick limestone wall, its two panes split by a wooden mullion, showing a night landscape: deep indigo sky (#121629 to #283049), a small moon and a few faint stars (#E8DDB5), dark rolling hills (#34452F) and one cypress. The rest of the back wall is plain, dark warm plaster (#2A231C), empty. Along the whole bottom, a long wooden worktable (#4A3826, front edge #362818) seen from slightly above, with a few low objects spaced along it: wax tablets in wooden frames with a stylus, a folded papyrus letter, loose sheets, a stack of tablets tied with a cord, and one short beeswax candle near the right with a small steady flame and a flat warm halo (#E8B04A), lighting the table softly.
MUST NOT SHOW: shelves, pigeonholes, racks, boxes or anything on the wall right of the window; that area is covered by drawn pigeonholes. No people.
LAYOUT: window at x 2-16%, y 15-55% (it must fit inside that, frame included). Wall from x 17% to the right edge and from the top down to y 58%: empty, even, quiet. Table top from y 60% to the bottom; keep its objects between y 66% and 86%, low and small, spread from x 5% to 95%; the table's front edge in the last 5%.
FORMAT: 3600 x 1200 px, aspect 3:1. Focal (always kept) area x 24-76%, y 13-87%: plain wall above, table below. The window shows on wide panes only; phones keep x 24-76%.
```

#### archive-light

```text
SCENE: a small archive room on a summer afternoon, seen straight on, wide panorama. At the far left, a tall round-arched window in a thick limestone wall, its two panes split by a wooden mullion, showing a daylight landscape: pale sky (#CFE3E8 to #E6EFEB), one soft outlined cloud, olive hills (#8FA66B, #6E8B4E) and one cypress. A soft shaft of warm cream daylight from the window falls diagonally down to the right onto the table. The rest of the back wall is plain, pale limestone plaster (#EADCBD), empty. Along the whole bottom, a long pale wooden worktable (#D9BC8C, front edge #C4A274) seen from slightly above, with a few low objects spaced along it: wax tablets (ochre wax #C9962B) in wooden frames with a stylus, a folded papyrus letter, loose sheets, a stack of tablets tied with a cord. No candle is lit.
MUST NOT SHOW: shelves, pigeonholes, racks, boxes or anything on the wall right of the window; that area is covered by drawn pigeonholes. No people.
LAYOUT: window at x 2-16%, y 15-55% (it must fit inside that, frame included). Wall from x 17% to the right edge and from the top down to y 58%: empty, even, quiet. Table top from y 60% to the bottom; keep its objects between y 66% and 86%, low and small, spread from x 5% to 95%; the table's front edge in the last 5%.
FORMAT: 3600 x 1200 px, aspect 3:1. Focal (always kept) area x 24-76%, y 13-87%: plain wall above, table below. The window shows on wide panes only; phones keep x 24-76%.
```

### shelf: inside an alcove

Box: 1068 x 822 CSS px on the desktop pane (1.3:1), 784 x 822 at 840 px (0.95:1), 334 x 687 on a
phone (0.49:1), shorter or taller with the books on it. Its top is rounded into an arch by Dromos,
its planks are drawn under each row of scrolls, and the rows move with the books, so the painting
is only the back of the niche: no planks, nothing on it. It shows almost everywhere (66-85%),
behind the scrolls, their hanging tags and the row titles, so it must stay very even. Dromos
anchors it to the top, so the top edge (the arch's shadow) always shows and short shelves lose
the bottom.

#### shelf-dark

```text
SCENE: the back wall inside a deep arched niche of an ancient library at night, seen straight on, flat frontal view with no perspective, no floor and no shelves. Smooth, softly worn plaster over stone in deep warm brown (#211B16 to #2A231C), with a very faint fine grain. Along the top edge, a soft shadow cast by the arch: the top 6-10% slightly darker, fading down evenly across the whole width. A faint warm lamplight (#E8B04A at very low strength) reaches in from the lower left and fades out before the middle.
MUST NOT SHOW: shelves, planks, boards, ledges, scrolls, books, tablets, boxes, jars, tags, the arch itself, the niche's edges, cracks, stains, or any frame. Planks, scrolls and labels are drawn on top in rows whose positions change.
COMPOSITION: an even, almost uniform surface that reads well when cropped anywhere and at any height; no focal object and no horizontal lines that could look like shelves.
QUIET ZONE: everywhere. Titles and labels sit on top: keep the contrast very low and no detail sharper than the plaster grain.
FORMAT: 2400 x 2400 px, aspect 1:1. Anchored to the top: the top edge always shows; phones keep only the central half of the width (x 26-74%), and wide panes the top three quarters.
```

#### shelf-light

```text
SCENE: the back wall inside a deep arched niche of an ancient library on a summer afternoon, seen straight on, flat frontal view with no perspective, no floor and no shelves. Smooth pale limestone plaster (#EADCBD, the niche's shade #E2D2B0), with a very faint fine grain. Along the top edge, a soft shadow cast by the arch: the top 6-10% slightly darker (#E2D2B0 to #D9C9A6), fading down evenly across the whole width. Gentle, even half-shade below; at most a very soft lift of warm cream daylight (#FFF6DE, translucent) from the upper left.
MUST NOT SHOW: shelves, planks, boards, ledges, scrolls, books, tablets, boxes, jars, tags, the arch itself, the niche's edges, cracks, stains, light shafts with hard edges, or any frame. Planks, scrolls and labels are drawn on top in rows whose positions change.
COMPOSITION: an even, almost flat surface that reads well when cropped anywhere and at any height; no focal object and no horizontal lines that could look like shelves.
QUIET ZONE: everywhere. Dark text sits on top: keep it light and nearly flat, no patch darker than #D9C9A6 below the top band.
FORMAT: 2400 x 2400 px, aspect 1:1. Anchored to the top: the top edge always shows; phones keep only the central half of the width (x 26-74%), and wide panes the top three quarters.
```

### shop: the Shop's stall

Box: 1128 x 291 CSS px on the desktop pane (3.9:1), 808 x 229 at 840 px (3.5:1), 358 x 171 on a
phone (2.1:1). Nothing covers it but the gold plaque, which Dromos hangs at the upper right: image
x 87-99%, y 25-45% on wide panes, so keep that corner plain shade; on a phone it covers x 64-77% at
the same height, over the right lamp, which the left one makes up for. Dromos anchors the painting to the
bottom, as the drawing is, so the counter always shows: wide panes lose the top 7%, and phones keep
only the central strip (x 21-79%), where the merchant stands. The light painting shows in the light theme
by day, and the dark one in the dark theme and at night (21:00 to 05:00) in the light theme.

This scene has one person, the merchant, and it is the only exception to the style block's "No
people": he is part of the stall, as in the drawing.

#### shop-dark

```text
SCENE: a market stall of the ancient Mediterranean at night, seen from the customer's side of its counter, straight on, wide panorama. This scene is the one exception to the style block's "No people": it shows one person, the merchant, and nobody else. A striped linen awning (#B4A584 and dyed red-brown #84432F, muted by the night) runs across the whole top, its scalloped edge ending at y 20%. Two wooden posts hold it up at x 22% and x 77%. Between the posts, behind the stall, the night market: a few closed stalls and low limestone buildings with a small columned temple, a palm and a cypress, under a night sky (#121629 to #283049) with a small moon (#E8DDB5) and a few faint stars. In the stall's shaded sides, left of the left post and right of the right post (there only below y 45%), simple wooden shelves of wares: clay jars, baskets of figs and dates, a fold of purple cloth, a few bronze pieces. Two small clay oil lamps hang from the awning at x 32% and x 68%, each with a small steady flame and a flat warm halo (#E8B04A) that lights the stall softly. Behind the counter, at the centre (x 42-58%), the merchant: an older man in a plain striped robe and a light head cloth, standing calmly with one open hand, welcoming; his face simple and kind, painted softly at the scale of the scene. Along the whole bottom, the wooden counter (#4A3826, front edge #362818) seen from slightly above, with a small bronze balance left of the merchant, a small heap of gold coins and a leather pouch right of him.
MUST NOT SHOW: any sign, plaque, banner or board, above all at the upper right; Dromos hangs the gold plaque there. No other people. No text or marks on the wares.
LAYOUT: awning from the top down to y 20%. Market and sky between the posts from y 20% to y 80%. Merchant from y 30% to the counter. Counter top from y 82% to the bottom; its front edge in the last 6%. Quiet patch, plain shade with no ware or object: x 87-99%, y 25-45%.
FORMAT: 3600 x 1000 px, aspect 3.6:1. Focal (always kept) area x 21-79%, y 7-100%: the merchant, the lamps, the market behind him and the counter.
```

#### shop-light

```text
SCENE: a market stall of the ancient Mediterranean on a summer afternoon, seen from the customer's side of its counter, straight on, wide panorama. This scene is the one exception to the style block's "No people": it shows one person, the merchant, and nobody else. A striped linen awning (#FAF5EA and clay red #B5593C) runs across the whole top, its scalloped edge ending at y 20%, casting a soft cool shade over the stall. Two wooden posts hold it up at x 22% and x 77%. Between the posts, behind the stall, the sunlit market: a few stalls and low limestone buildings with a small columned temple, a palm and a cypress, olive hills (#8FA66B, #6E8B4E), and a pale sky (#CFE3E8 to #E6EFEB) with one soft outlined cloud. In the stall's shaded sides, left of the left post and right of the right post (there only below y 45%), simple wooden shelves of wares: clay jars (#C47A4E), baskets of figs and dates, a fold of purple cloth, a few bronze pieces. Two small clay oil lamps hang unlit from the awning at x 32% and x 68%. Behind the counter, at the centre (x 42-58%), the merchant: an older man in a plain striped robe and a light head cloth, standing calmly with one open hand, welcoming; his face simple and kind, painted softly at the scale of the scene. Warm cream sunlight falls across the counter from the front. Along the whole bottom, the pale wooden counter (#D9BC8C, front edge #C4A274) seen from slightly above, with a small bronze balance left of the merchant, a small heap of gold coins and a leather pouch right of him.
MUST NOT SHOW: any sign, plaque, banner or board, above all at the upper right; Dromos hangs the gold plaque there. No other people. No text or marks on the wares.
LAYOUT: awning from the top down to y 20%. Market and sky between the posts from y 20% to y 80%. Merchant from y 30% to the counter. Counter top from y 82% to the bottom; its front edge in the last 6%. Quiet patch, plain shade with no ware or object: x 87-99%, y 25-45%.
FORMAT: 3600 x 1000 px, aspect 3.6:1. Focal (always kept) area x 21-79%, y 7-100%: the merchant, the market behind him and the counter.
```

### esdras: Esdras's portrait in his letter

Box: 64 x 79 CSS px on wide panes, 48 x 59 on a phone, a 4:5 portrait under a round arch: the arch
cuts the top corners, and a frame and a molding run along it. A new letter's small wax seal covers
the lower right corner. Nothing in the image is read, so it only needs to read at that size: one
face, simple shapes, soft light. It never moves: Home is always on screen, so a video beside the
portrait is ignored.

This scene is a portrait, the other exception to the style block's "No people": it shows Esdras, and
nobody else.

#### esdras-dark

```text
SCENE: a head-and-shoulders portrait of Esdras, a scribe of the ancient Near East, at night, facing the viewer, calm and kind, as a small painted panel portrait. This scene is an exception to the style block's "No people": it shows one person, Esdras, and nobody else. A linen shawl with thin indigo stripes over his head frames his face; dark brows, a short dark beard going grey, an indigo robe; in his right hand, raised near his shoulder, a reed pen. Behind him a plain dark plaster wall (#2A231C), warmly lit from the lower left by an oil lamp just out of the picture (#E8B04A, a flat warm light on his face and shawl, never a glow).
MUST NOT SHOW: any lettering, scroll text or labels; other people; hands other than the one holding the pen; a frame or an arch (Dromos draws the arch and the frame).
LAYOUT: his eyes at about a third from the top, his face in the middle third of the width, his shoulders reaching the bottom edge; the top corners plain wall, since the arch cuts them.
FORMAT: 1000 x 1240 px, aspect 4:5. Focal (always kept) area: the face and the shawl around it.
```

#### esdras-light

```text
SCENE: a head-and-shoulders portrait of Esdras, a scribe of the ancient Near East, on a summer afternoon, facing the viewer, calm and kind, as a small painted panel portrait. This scene is an exception to the style block's "No people": it shows one person, Esdras, and nobody else. A linen shawl with thin indigo stripes over his head frames his face; dark brows, a short dark beard going grey, an indigo robe; in his right hand, raised near his shoulder, a reed pen. Behind him a plain pale limestone wall (#EADCBD), in soft warm daylight from the upper left (#FFF6DE), gentle shadows.
MUST NOT SHOW: any lettering, scroll text or labels; other people; hands other than the one holding the pen; a frame or an arch (Dromos draws the arch and the frame).
LAYOUT: his eyes at about a third from the top, his face in the middle third of the width, his shoulders reaching the bottom edge; the top corners plain wall, since the arch cuts them.
FORMAT: 1000 x 1240 px, aspect 4:5. Focal (always kept) area: the face and the shawl around it.
```

Export it small: 400 x 496 px WebP at about quality 80 (some 20-40 KB), which is sharp at the size
Dromos shows it on any screen.

### landscape: the countryside above every screen

Box: the scene at the top of every screen, 1184 x 320 CSS px on the desktop pane, 864 x 300 at 840 px,
384 x 220 on a phone and 2584 x 380 on a 2560 px pane. The painting is laid in the drawing's own
960 x 300 frame (3.2:1) and anchored to its bottom, as the drawing is: wide panes lose the top of
the sky (a 2560 px pane keeps only y 47-100%), and phones keep only the right part (x 44-100%), where
the road, the gate and the signpost are. That is the focal area. Over the painting Dromos still draws
what carries meaning: the gate at the road's end with its level plaque, the walker on the road, the
campfire of a complete day beside it, the signpost, the character's plaque and the level-up ribbon.
The painting must keep the road exactly where the drawing has it, so the walker walks on it and
passes under the gate, and it must paint no gate, walker or fire of its own. Under a painting the
drawn landscape and its animations are not drawn at all. The drawn figures take the painting's light
of the hour: the walker, the gate and the campfire are lit on the left and shaded on the right in the
light of dawn, day, dusk or night (the dark theme's is always night), under a fine line in a darker
shade of their own colours, and the walker's lantern is lit at night.

Four paintings tell the shepherd's day:

- `landscape-light`, the day: the light theme from 08:00 to 18:00, and at any hour whose own painting is missing.
- `landscape-dawn`, from 05:00 to 08:00 in the light theme: the shepherd sets out with his sheep.
- `landscape-dusk`, from 18:00 to 21:00 in the light theme: he heads home.
- `landscape-dark`, the night: the light theme from 21:00 to 05:00, and the dark theme at every hour, as the drawing keeps its night there. The shepherd is at home and the sheep are in their fold.

Without `landscape-light` the light theme keeps the drawing at every hour, and without
`landscape-dark` the dark theme does. Each of the four can have its own loop beside it
(`landscape-dawn.webm`, and so on), which plays over it while that painting shows (see
[Videos](#videos)).

The day and night paintings come from layout guides: the drawing itself, rendered at 3840 x 1200
without the gate, the walker and the campfire, which you attach to the prompt so the generator keeps
the hills, the road and the village where they are. A painting placed by text alone does not keep the
road under the walker. The guides are [landscape-guide-light.png](own-art/landscape-guide-light.png)
and [landscape-guide-dark.png](own-art/landscape-guide-dark.png). Dawn, dusk and the final night are
edits of those two paintings that change only the light and the shepherd's day.

How the four paintings were made:

1. landscape-light (day): new Gemini chat, attach `landscape-guide-light.png`, paste the shared style block, then the prompt below.
2. landscape-dark (base night): the same with `landscape-guide-dark.png` and its prompt.
3. landscape-dawn and landscape-dusk: each in a new chat, attach the day painting (the original, never an edited one), paste the edit prompt alone, without the style block (the attached painting carries the style, and the block's "library interior, no people" would clash).
4. Final landscape-dark (the shepherd at home): a new chat, attach the base night painting, paste the night edit prompt alone.
5. If the generator changes anything not asked (the road, the hills, the village), ask: "Try again: change only what CHANGE lists and keep everything else exactly as in the attached image." Or regenerate.
6. Edit prompts carry no hex codes or percentages: Gemini painted them as labels on the Shop's paintings.
7. Check each painting for a painted gate or arch anywhere near a path: the night edit painted a small iron gate at the far path's start, removed by hand. Dromos draws the only gate.

Export: 3712 × 1160 (exactly 3.2:1, the drawing's 960 × 300), `cwebp -q 80`, about 50-70 KB each.

Before you keep a painting, check it:

- **The road:** lay the layout guide over it at half opacity in any image editor, stretched to the
  painting's size. The painted road must stay under the drawn one along its whole length, and the gate's foot (where the road ends at
  the top of the middle hill) and the campfire's spot (the grass left of the road's bend) must stay
  plain.
- **No gate and no labels:** no gate, arch or posts anywhere near a path, and no lettering, numbers
  or labels anywhere.

#### landscape-light (with landscape-guide-light.png, after the style block)

```text
SCENE: the countryside around the library, outdoors, on a summer afternoon, seen from a low hill. This scene is an exception to the style block's library interior and to its "No people": it shows the land outside, and one small shepherd on the far hill, as in the attached image, and nobody else.
LAYOUT: the attached image is the exact layout. Repaint it as a painting in the style above, keeping every shape where it is and at its size: the line of each hill, the road's width and every bend, the village of three houses, the windmill, the round tree, the two pairs of cypresses, the far ridge, the sun, the three clouds, the shepherd with his sheep and the lion lying at peace beside a lamb, the three sheep further right, the flowers and tufts along the road. Do not move, add or remove anything; only the way it is painted changes. Paint no outlines: the drawing's brown lines are not part of the painting.
LIGHT: soft warm afternoon light from the upper left (#FFF6DE); the sky from #CFE3E8 at the top to #E6EFEB at the horizon; the far ridge pale blue-grey in the haze; the hills olive (#8FA66B, #6E8B4E), the nearest one the darkest; the road pale dust (#EADCBD); the houses limestone (#EADCBD).
MUST NOT SHOW: a gate, an arch or posts where the road ends at the top of the middle hill (Dromos draws a gate there); a traveller, a walker or a fire on or beside the road (Dromos draws them); any lettering or labels.
FORMAT: 3840 x 1200 px, aspect 3.2:1, the same as the attached image. Focal (always kept) area: x 44-100%, y 47-100%; wide panes lose the top of the sky and phones keep only the right half.
```

#### landscape-dark, base night (with landscape-guide-dark.png, after the style block)

```text
SCENE: the same countryside around the library on a calm, warm moonlit night, seen from a low hill. This scene is an exception to the style block's library interior and to its "No people": it shows the land outside, and one small shepherd on the far hill, as in the attached image, and nobody else.
LAYOUT: the attached image is the exact layout. Repaint it as a painting in the style above, keeping every shape where it is and at its size: the line of each hill, the road's width and every bend, the village of three houses, the windmill, the round tree, the two pairs of cypresses, the far ridge, the moon, the three clouds, the shepherd with his sheep and the lion lying at peace beside a lamb, the three sheep further right, the flowers and tufts along the road. Do not move, add or remove anything; only the way it is painted changes. Paint no outlines: the drawing's lines are not part of the painting.
LIGHT: night sky from #121629 at the top to #283049 at the horizon, a few small faint stars; a full moon (#E8DDB5) where the attached image has it, with a soft flat halo; the clouds dim blue-grey; the hills dark green (#34452F), darkest in front; the road dim warm earth (#5A4A3A); the houses' small windows lit with warm lamplight (#E8B04A, flat, never a glow); a few fireflies over the road as tiny warm dots. Warm and quiet, never cold, never blue-black.
MUST NOT SHOW: a gate, an arch or posts where the road ends at the top of the middle hill (Dromos draws a gate there); a traveller, a walker or a fire on or beside the road (Dromos draws them); any lettering or labels.
FORMAT: 3840 x 1200 px, aspect 3.2:1, the same as the attached image. Focal (always kept) area: x 44-100%, y 47-100%; wide panes lose the top of the sky and phones keep only the right half.
```

#### landscape-dawn (edit of the day painting, prompt alone)

```text
EDIT: Edit the attached painting. Keep everything exactly as it is except what CHANGE lists: the same size and framing, every hill line, the road's width and every bend, the village of three houses, the windmill, the round tree, the four cypresses, the far ridge, the places of the clouds, the flowers and tufts, and the same soft painterly style and brushwork.
CHANGE: it is early dawn, just after sunrise.
- Light: the sun has just risen, low and pale gold, above the hills on the left. Soft warm light comes from the left and casts long, thin shadows to the right.
- Sky: pale rose and peach at the horizon, fading to a soft clear blue at the top. The clouds are lit pink and gold from below.
- Land: thin white morning mist lies in the hollows between the hills and over the far ridge. The grass is cool and dewy, still a little blue in the shade.
- Village: one small window glows with warm lamplight. Thin smoke rises straight up from the chimneys.
- Shepherd: on the same spot of the far hill, the shepherd is setting out for the day. He walks with his staff toward the right, and his sheep follow him. The lion lies beside the lamb, awake, its head raised to the morning.
MUST NOT SHOW: anything new on the road, or where it ends at the top of the middle hill (a gate stands there); a traveller, a walker or a fire on or beside the road (the grass to the left of the road's bend stays plain); any lettering, numbers or labels.
```

#### landscape-dusk (edit of the day painting, prompt alone)

```text
EDIT: Edit the attached painting. Keep everything exactly as it is except what CHANGE lists: the same size and framing, every hill line, the road's width and every bend, the village of three houses, the windmill, the round tree, the four cypresses, the far ridge, the places of the clouds, the flowers and tufts, and the same soft painterly style and brushwork.
CHANGE: it is the golden hour before sunset.
- Light: the sun is low, large and deep gold, above the hills on the left. Warm amber light comes from the left. The hilltops glow gold, and the hollows fall into soft violet shade, with long shadows to the right.
- Sky: apricot and rose at the horizon, fading to a soft lavender at the top. The clouds are lit gold and pink.
- Village: every window begins to glow with warm lamplight. Smoke rises from the chimneys for supper.
- Shepherd: on the same spot of the far hill, the shepherd is heading home. He walks with his staff toward the village on the left, and his sheep follow him. The three sheep on the right turn toward the village too. The lion lies beside the lamb, calm in the warm light.
- A few small birds fly home, far off across the sky.
MUST NOT SHOW: anything new on the road, or where it ends at the top of the middle hill (a gate stands there); a traveller, a walker or a fire on or beside the road (the grass to the left of the road's bend stays plain); any lettering, numbers or labels.
```

#### landscape-dark, final: the shepherd at home (edit of the base night painting, prompt alone)

```text
EDIT: Edit the attached painting. Keep everything exactly as it is except what CHANGE lists: the same size and framing, every hill line, the road's width and every bend, the village of three houses, the windmill, the round tree, the four cypresses, the far ridge, the moon, the stars, the clouds, the fireflies, the flowers and tufts, and the same soft painterly style and brushwork.
CHANGE: it is late at night, and the shepherd has gone home.
- The shepherd is no longer on the hill; the grass where he stood is plain. He is inside the middle house. Its door stands ajar, and warm lamplight spills onto the step. His shepherd's crook leans against the wall beside the door. All three houses have small lit windows.
- The sheep are no longer in the pasture, neither the one beside the shepherd nor the three on the right. They sleep in a small, low, round sheepfold of dry stone, beside the village on its left, between the houses and the round tree.
- The lion stays where it is, now asleep and curled up. The lamb sleeps against it: a quiet picture of peace under the moon.
MUST NOT SHOW: anything new on the road, or where it ends at the top of the middle hill (a gate stands there); a traveller, a walker or a fire on or beside the road (the grass to the left of the road's bend stays plain); any lettering, numbers or labels.
```

### walker: the painted walker on the road

The walker on the road can be your painting too, over the painted landscape: one
painting for each of the twelve stages of life and one for each of the fourteen objects the skills
give. Dromos places them where the drawn walker and his drawn objects would be, so the painted walker
walks on the painted road, bobs as he walks, breathes as he stands and keeps his cast shadow.

- **Files**, in `Dromos/Arte/` like every painting, by the same naming rules but with no theme:
  `walker-<stage>.<ext>` for `runner`, `wayfarer`, `pilgrim`, `apprentice`, `disciple`, `traveller`,
  `student`, `scholar`, `mentor`, `counsellor`, `elder` and `sage`, and `object-<skill>.<ext>` for each
  skill's object (table below). They are read with the other paintings, when Home opens and on **Sync**.
- **Where he shows:** only where the scene shows its theme's landscape painting. Elsewhere, and in a theme
  without a landscape painting, the drawn walker shows, exactly as before.
- **What is missing stays drawn:** a stage without its painting keeps the drawn walker, in the
  painting's light (the walker described above), with his drawn objects. On a painted walker, an object
  without its painting is drawn at its spot.
- **The light of the hour:** paint him in soft daylight. By day he shows as painted; at dawn, at dusk and
  at night (always night in the dark theme) Dromos tints him with the hour's light, and at night it
  lays the lantern's warm glow over the painted lantern.
- **Layers:** the shield on his back lies under the painting; every other object lies over it.

The files Dromos reads are not the raw paintings but cut-outs laid in fixed frames, so the code needs no
numbers per painting:

- **A stage** is a transparent WebP of 320 × 480 px showing the frame x -20 to 32, y -74 to 4 of the
  walker's own units, with his feet at the origin: 6.15 px per unit, the origin at (123.1, 455.4) px. The
  painting is scaled uniformly so that its feet's bottom sits on y 0, the middle of its staff on x 20,
  and the middle of its staff's hook on y -66.4 (-70.4 for the bowed elder and sage), where the drawn
  walker's are.
- **An object** is a transparent WebP of 160 × 160 px showing the square -18 to 18 around the object's
  own origin: 4.44 px per unit. Its outline is scaled uniformly and centred on the drawn object's box:

| File | Object | Box x | Box y | Box width × height |
|---|---|---|---|---|
| `object-atleta` | the olive wreath | -15.59 | -6.17 | 32.67 × 15.22 |
| `object-centinela` | the round bronze shield | -12 | -12 | 24 × 24 |
| `object-cronista` | the open wax tablet | -7.6 | -5 | 18 × 12.4 |
| `object-cuidador` | the clay oil flask | -6 | -9 | 12.8 × 17.8 |
| `object-desarrollador` | the builder's square | -5.4 | -7.6 | 12.8 × 14.4 |
| `object-escriba` | the inkhorn and reed pen | -4.6 | -12.2 | 11 × 18.4 |
| `object-estudiante` | the owl brooch | -4.85 | -6.4 | 9.7 × 12.4 |
| `object-exegeta` | the scroll of the Law | -5.6 | -10.7 | 11.2 × 21.4 |
| `object-labiolector` | the hand mirror | -5.2 | -6.6 | 10.4 × 16.8 |
| `object-lector` | the paper scroll | -2.2 | -7.9 | 4.4 × 14.9 |
| `object-maestro` | the iron key | -2.8 | -6.6 | 6.2 × 16.2 |
| `object-mayordomo` | the leather purse | -5.28 | -5.3 | 10.56 × 12.5 |
| `object-mnemonista` | the blue fringes | -4.8 | -3 | 9.6 × 8.4 |
| `object-reposo` | the gold crescent | -5.4 | -3 | 10.8 × 8.4 |

How the set was made:

1. The pose guides are the drawn walker of each stage without objects, rendered at 1000 × 1500 (2:3):
   [runner](own-art/walker/guide-runner.png), [wayfarer](own-art/walker/guide-wayfarer.png),
   [pilgrim](own-art/walker/guide-pilgrim.png), [apprentice](own-art/walker/guide-apprentice.png),
   [disciple](own-art/walker/guide-disciple.png), [traveller](own-art/walker/guide-traveller.png),
   [student](own-art/walker/guide-student.png), [scholar](own-art/walker/guide-scholar.png),
   [mentor](own-art/walker/guide-mentor.png), [counsellor](own-art/walker/guide-counsellor.png),
   [elder](own-art/walker/guide-elder.png) and [sage](own-art/walker/guide-sage.png). The
   [objects guide](own-art/walker/objects-guide.png) has the fourteen objects in a 5 × 3 grid on mid
   grey, so the cream scrolls show, in the order of the table above.
2. The runner came first: painted in Gemini from his guide, with the day landscape painting as the style
   reference. His painting is the identity and style reference for everything else.
3. Each other stage: a new Gemini chat; attach the stage's guide first, then the runner's painting, and
   paste the stage's prompt alone, without the shared style block.
4. The objects: attach the objects guide first, then the runner's painting, and paste the objects
   prompt. Its background is magenta, not green, because the olive wreath is green.
5. Cut-outs: each stage is keyed out of its flat green (alpha from how much green exceeds red and blue,
   the green spill clamped), and the object sheet is cut cell by cell in the guide's order and keyed
   out of its magenta (alpha from how much red and blue exceed green, the spill capped). Each is laid in
   its frame as above and exported with `cwebp -q 85 -alpha_q 90`: about 25 KB per stage and 1-5 KB per
   object.

Before you keep a painting, check it:

- **The guide's clothes and gear:** the objects sit at the drawn figure's spots, so a painting must carry
  what its guide carries. From the runner to the traveller he wears a satchel at the front hip on a
  strap from the far shoulder, and from the student on a case of scrolls; without them the paper scroll,
  the inkhorn and the mirror float.
- **No green on the figure and nothing touching the frame:** the whole staff and its lantern inside the
  picture, the feet with a small margin below them.

#### walker-runner

The runner's painting is the reference above; it has no prompt of its own here.

#### walker-wayfarer (with guide-wayfarer.png, then the runner's painting)

```text
SUBJECT: the same person as in the SECOND attached image (the same face, features, skin and build), years later on the road of his life. Full body, standing, seen three-quarters from the left and facing right, exactly as in the FIRST attached image: the same pose, proportions, clothes and colours, his right arm forward holding the staff with the small lantern hanging from its hooked top. About 16 years old. As in the second image, plus a round leather waterskin hanging at his hip on a cord that crosses the satchel's strap. He carries nothing else.
STYLE: paint him exactly like the SECOND attached image: the same soft painterly gouache, gentle brushwork, warm muted palette and soft daylight from the upper left (his left side lit, his right side in soft shade). Paint no outlines: the guide's dark lines are not part of the painting.
BACKGROUND: one flat, uniform, pure green colour (#00FF00) filling the whole image, with no gradient, no ground, no cast shadow and no texture. Keep the figure's edges clean against it, and use no green anywhere on the figure.
COMPOSITION: the whole figure and the whole staff inside the frame, centred, his feet near the bottom edge with a small margin. Vertical format, 2:3. The figure fills about 90% of the height.
MUST NOT SHOW: any other person or animal, any landscape, ground or shadow, any frame, lettering or labels.
```

#### walker-pilgrim (with guide-pilgrim.png, then the runner's painting)

```text
SUBJECT: the same person as in the SECOND attached image (the same face, features, skin and build), years later on the road of his life. Full body, standing, seen three-quarters from the left and facing right, exactly as in the FIRST attached image: the same pose, proportions, clothes and colours, his right arm forward holding the staff with the small lantern hanging from its hooked top. About 18 years old. His dark hair longer, tied back in a small knot; no beard. A wider rust-red cloak, mended with a few patches, open over both shoulders; the waterskin at his hip on its cord. He carries nothing else.
STYLE: paint him exactly like the SECOND attached image: the same soft painterly gouache, gentle brushwork, warm muted palette and soft daylight from the upper left (his left side lit, his right side in soft shade). Paint no outlines: the guide's dark lines are not part of the painting.
BACKGROUND: one flat, uniform, pure green colour (#00FF00) filling the whole image, with no gradient, no ground, no cast shadow and no texture. Keep the figure's edges clean against it, and use no green anywhere on the figure.
COMPOSITION: the whole figure and the whole staff inside the frame, centred, his feet near the bottom edge with a small margin. Vertical format, 2:3. The figure fills about 90% of the height.
MUST NOT SHOW: any other person or animal, any landscape, ground or shadow, any frame, lettering or labels.
```

#### walker-apprentice (with guide-apprentice.png, then the runner's painting)

```text
SUBJECT: the same person as in the SECOND attached image (the same face, features, skin and build), years later on the road of his life. Full body, standing, seen three-quarters from the left and facing right, exactly as in the FIRST attached image: the same pose, proportions, clothes and colours, his right arm forward holding the staff with the small lantern hanging from its hooked top. About 20 years old. Short dark hair, combed; no beard. The rust-red mantle worn neatly over both shoulders; two narrow dyed red stripes running down the front of his cream tunic. No waterskin. He carries nothing else.
STYLE: paint him exactly like the SECOND attached image: the same soft painterly gouache, gentle brushwork, warm muted palette and soft daylight from the upper left (his left side lit, his right side in soft shade). Paint no outlines: the guide's dark lines are not part of the painting.
BACKGROUND: one flat, uniform, pure green colour (#00FF00) filling the whole image, with no gradient, no ground, no cast shadow and no texture. Keep the figure's edges clean against it, and use no green anywhere on the figure.
COMPOSITION: the whole figure and the whole staff inside the frame, centred, his feet near the bottom edge with a small margin. Vertical format, 2:3. The figure fills about 90% of the height.
MUST NOT SHOW: any other person or animal, any landscape, ground or shadow, any frame, lettering or labels.
```

#### walker-disciple (with guide-disciple.png, then the runner's painting)

```text
SUBJECT: the same person as in the SECOND attached image (the same face, features, skin and build), years later on the road of his life. Full body, standing, seen three-quarters from the left and facing right, exactly as in the FIRST attached image: the same pose, proportions, clothes and colours, his right arm forward holding the staff with the small lantern hanging from its hooked top. About 22 years old. Combed dark hair and the first soft down of a beard along his jaw. The rust-red mantle folded over one shoulder; the two red stripes down his tunic. He carries nothing else.
STYLE: paint him exactly like the SECOND attached image: the same soft painterly gouache, gentle brushwork, warm muted palette and soft daylight from the upper left (his left side lit, his right side in soft shade). Paint no outlines: the guide's dark lines are not part of the painting.
BACKGROUND: one flat, uniform, pure green colour (#00FF00) filling the whole image, with no gradient, no ground, no cast shadow and no texture. Keep the figure's edges clean against it, and use no green anywhere on the figure.
COMPOSITION: the whole figure and the whole staff inside the frame, centred, his feet near the bottom edge with a small margin. Vertical format, 2:3. The figure fills about 90% of the height.
MUST NOT SHOW: any other person or animal, any landscape, ground or shadow, any frame, lettering or labels.
```

#### walker-traveller (with guide-traveller.png, then the runner's painting)

```text
SUBJECT: the same person as in the SECOND attached image (the same face, features, skin and build), years later on the road of his life. Full body, standing, seen three-quarters from the left and facing right, exactly as in the FIRST attached image: the same pose, proportions, clothes and colours, his right arm forward holding the staff with the small lantern hanging from its hooked top. About 26 years old. Combed dark hair and a short dark beard. A wide-brimmed straw-coloured traveller's hat; a short rust-red traveller's cloak pinned at the shoulder with a round bronze brooch, with an ochre border at its hem; the two red stripes down his tunic; a thicker staff with knots, its lantern hanging from the hook. He carries nothing else.
STYLE: paint him exactly like the SECOND attached image: the same soft painterly gouache, gentle brushwork, warm muted palette and soft daylight from the upper left (his left side lit, his right side in soft shade). Paint no outlines: the guide's dark lines are not part of the painting.
BACKGROUND: one flat, uniform, pure green colour (#00FF00) filling the whole image, with no gradient, no ground, no cast shadow and no texture. Keep the figure's edges clean against it, and use no green anywhere on the figure.
COMPOSITION: the whole figure and the whole staff inside the frame, centred, his feet near the bottom edge with a small margin. Vertical format, 2:3. The figure fills about 90% of the height.
MUST NOT SHOW: any other person or animal, any landscape, ground or shadow, any frame, lettering or labels.
```

#### walker-student (with guide-student.png, then the runner's painting)

```text
SUBJECT: the same person as in the SECOND attached image (the same face, features, skin and build), years later on the road of his life. Full body, standing, seen three-quarters from the left and facing right, exactly as in the FIRST attached image: the same pose, proportions, clothes and colours, his right arm forward holding the staff with the small lantern hanging from its hooked top. About 30 years old. Neat short dark hair and a short dark beard. A large rust-red himation wrapped around his body and over his shoulder; his cream tunic down to the ankles with the two red stripes; a tall cylindrical leather case of scrolls hanging at his side in place of the satchel; the thicker knotted staff with its lantern. He carries nothing else.
STYLE: paint him exactly like the SECOND attached image: the same soft painterly gouache, gentle brushwork, warm muted palette and soft daylight from the upper left (his left side lit, his right side in soft shade). Paint no outlines: the guide's dark lines are not part of the painting.
BACKGROUND: one flat, uniform, pure green colour (#00FF00) filling the whole image, with no gradient, no ground, no cast shadow and no texture. Keep the figure's edges clean against it, and use no green anywhere on the figure.
COMPOSITION: the whole figure and the whole staff inside the frame, centred, his feet near the bottom edge with a small margin. Vertical format, 2:3. The figure fills about 90% of the height.
MUST NOT SHOW: any other person or animal, any landscape, ground or shadow, any frame, lettering or labels.
```

#### walker-scholar (with guide-scholar.png, then the runner's painting)

```text
SUBJECT: the same person as in the SECOND attached image (the same face, features, skin and build), years later on the road of his life. Full body, standing, seen three-quarters from the left and facing right, exactly as in the FIRST attached image: the same pose, proportions, clothes and colours, his right arm forward holding the staff with the small lantern hanging from its hooked top. About 35 years old. Neat short dark hair and a well-trimmed dark beard. The large rust-red himation wrapped around his body and over his shoulder; the ankle-length tunic with its two red stripes; the cylindrical leather case of scrolls at his side; the thicker knotted staff with its lantern. He carries nothing else.
STYLE: paint him exactly like the SECOND attached image: the same soft painterly gouache, gentle brushwork, warm muted palette and soft daylight from the upper left (his left side lit, his right side in soft shade). Paint no outlines: the guide's dark lines are not part of the painting.
BACKGROUND: one flat, uniform, pure green colour (#00FF00) filling the whole image, with no gradient, no ground, no cast shadow and no texture. Keep the figure's edges clean against it, and use no green anywhere on the figure.
COMPOSITION: the whole figure and the whole staff inside the frame, centred, his feet near the bottom edge with a small margin. Vertical format, 2:3. The figure fills about 90% of the height.
MUST NOT SHOW: any other person or animal, any landscape, ground or shadow, any frame, lettering or labels.
```

#### walker-mentor (with guide-mentor.png, then the runner's painting)

```text
SUBJECT: the same person as in the SECOND attached image (the same face, features, skin and build), years later on the road of his life. Full body, standing, seen three-quarters from the left and facing right, exactly as in the FIRST attached image: the same pose, proportions, clothes and colours, his right arm forward holding the staff with the small lantern hanging from its hooked top. About 42 years old. Neat dark hair, a full dark beard and one faint line on his brow. A longer rust-red himation with an ochre border at its hem; the ankle-length tunic with its two red stripes; the case of scrolls at his side; the thicker knotted staff with its lantern. He carries nothing else.
STYLE: paint him exactly like the SECOND attached image: the same soft painterly gouache, gentle brushwork, warm muted palette and soft daylight from the upper left (his left side lit, his right side in soft shade). Paint no outlines: the guide's dark lines are not part of the painting.
BACKGROUND: one flat, uniform, pure green colour (#00FF00) filling the whole image, with no gradient, no ground, no cast shadow and no texture. Keep the figure's edges clean against it, and use no green anywhere on the figure.
COMPOSITION: the whole figure and the whole staff inside the frame, centred, his feet near the bottom edge with a small margin. Vertical format, 2:3. The figure fills about 90% of the height.
MUST NOT SHOW: any other person or animal, any landscape, ground or shadow, any frame, lettering or labels.
```

#### walker-counsellor (with guide-counsellor.png, then the runner's painting)

```text
SUBJECT: the same person as in the SECOND attached image (the same face, features, skin and build), years later on the road of his life. Full body, standing, seen three-quarters from the left and facing right, exactly as in the FIRST attached image: the same pose, proportions, clothes and colours, his right arm forward holding the staff with the small lantern hanging from its hooked top. About 50 years old. Dark hair going grey at the temples, a full beard streaked with grey, one line on his brow. The long rust-red himation with its ochre border; the ankle-length tunic with its two red stripes; the case of scrolls at his side; the thicker knotted staff with its lantern. He carries nothing else.
STYLE: paint him exactly like the SECOND attached image: the same soft painterly gouache, gentle brushwork, warm muted palette and soft daylight from the upper left (his left side lit, his right side in soft shade). Paint no outlines: the guide's dark lines are not part of the painting.
BACKGROUND: one flat, uniform, pure green colour (#00FF00) filling the whole image, with no gradient, no ground, no cast shadow and no texture. Keep the figure's edges clean against it, and use no green anywhere on the figure.
COMPOSITION: the whole figure and the whole staff inside the frame, centred, his feet near the bottom edge with a small margin. Vertical format, 2:3. The figure fills about 90% of the height.
MUST NOT SHOW: any other person or animal, any landscape, ground or shadow, any frame, lettering or labels.
```

#### walker-elder (with guide-elder.png, then the runner's painting)

```text
SUBJECT: the same person as in the SECOND attached image (the same face, features, skin and build), years later on the road of his life. Full body, standing, seen three-quarters from the left and facing right, exactly as in the FIRST attached image: the same pose, proportions, clothes and colours, his right arm forward holding the staff with the small lantern hanging from its hooked top. About 65 years old. Thinning grey hair, a grey beard, two lines on his brow. He stands a little bowed, so the staff rises higher than his head, as in the first image. The long rust-red himation with its ochre border; the ankle-length tunic with its two red stripes; the case of scrolls at his side; the thicker knotted staff with its lantern. He carries nothing else.
STYLE: paint him exactly like the SECOND attached image: the same soft painterly gouache, gentle brushwork, warm muted palette and soft daylight from the upper left (his left side lit, his right side in soft shade). Paint no outlines: the guide's dark lines are not part of the painting.
BACKGROUND: one flat, uniform, pure green colour (#00FF00) filling the whole image, with no gradient, no ground, no cast shadow and no texture. Keep the figure's edges clean against it, and use no green anywhere on the figure.
COMPOSITION: the whole figure and the whole staff inside the frame, centred, his feet near the bottom edge with a small margin. Vertical format, 2:3. The figure fills about 90% of the height.
MUST NOT SHOW: any other person or animal, any landscape, ground or shadow, any frame, lettering or labels.
```

#### walker-sage (with guide-sage.png, then the runner's painting)

```text
SUBJECT: the same person as in the SECOND attached image (the same face, features, skin and build), years later on the road of his life. Full body, standing, seen three-quarters from the left and facing right, exactly as in the FIRST attached image: the same pose, proportions, clothes and colours, his right arm forward holding the staff with the small lantern hanging from its hooked top. About 80 years old. White hair and a long white beard, two lines on his brow, a calm and kind face. He stands a little bowed, so the staff rises higher than his head, as in the first image. A long rust-red mantle with an ochre border wrapped around him; the ankle-length cream tunic; the case of scrolls at his side; the thicker knotted staff with its lantern. He carries nothing else.
STYLE: paint him exactly like the SECOND attached image: the same soft painterly gouache, gentle brushwork, warm muted palette and soft daylight from the upper left (his left side lit, his right side in soft shade). Paint no outlines: the guide's dark lines are not part of the painting.
BACKGROUND: one flat, uniform, pure green colour (#00FF00) filling the whole image, with no gradient, no ground, no cast shadow and no texture. Keep the figure's edges clean against it, and use no green anywhere on the figure.
COMPOSITION: the whole figure and the whole staff inside the frame, centred, his feet near the bottom edge with a small margin. Vertical format, 2:3. The figure fills about 90% of the height.
MUST NOT SHOW: any other person or animal, any landscape, ground or shadow, any frame, lettering or labels.
```

#### The fourteen objects (with objects-guide.png, then the runner's painting)

```text
SUBJECT: fourteen small objects for a game character, painted as separate items, each exactly where the FIRST attached image places it, at the same size, in the same order and orientation: an olive wreath; a round bronze shield; an open wax tablet of two wooden leaves with a stylus; a round clay oil flask with a sprig of herbs at its neck; a bronze builder's square; a bronze inkhorn with a reed pen; a bronze owl brooch; the scroll of the Law, two cream rolls on wooden rods with knobs; a bronze hand mirror; a cream paper scroll with an ochre tie; an iron key; a leather purse with two gold coins at its mouth; two knotted blue fringes; a gold crescent with its horns up. Keep each object's shape and colours from the guide.
STYLE: paint them like the SECOND attached image: the same soft painterly gouache, gentle brushwork, warm muted palette and soft daylight from the upper left. Paint no outlines.
BACKGROUND: one flat, uniform, pure magenta colour (#FF00FF) filling the whole image, with no gradient, no shadows, no table or surface. Leave clear magenta space between the objects; no object touches another. Use no magenta or pink on any object.
MUST NOT SHOW: any person, hand or figure, any lettering, numbers, labels or grid lines.
FORMAT: landscape, with the same proportions as the FIRST attached image.
```

## Videos

A painted scene can also play a short loop over its painting: `<scene>-<theme>.webm` (or `.mp4`) beside the painting, for example `Dromos/Arte/archive-dark.webm` next to `archive-dark.webp`.

- A video plays only over its own theme's painting. Without that painting it is ignored, and the painting is what shows until the first frame, whenever the video cannot play, and on any device that does not have the file yet.
- It is muted and loops. It plays only while you can see it: it pauses when you scroll it away, switch tabs, switch theme or hide the window, and it never plays when your system asks to reduce motion.
- The cards play the desk's video, since they lie on the desk. Esdras's portrait never plays one.
- Each of the landscape's four paintings can have its own loop: `landscape-light`, `landscape-dark`, `landscape-dawn` and `landscape-dusk`, each `.webm` (or `.mp4`) beside its painting. The loop that plays is the one beside the painting shown at that hour: where the day painting stands in for a missing dawn, dusk or night painting, the day painting's loop plays. The landscape is on every screen, so its loops play more than any other.
- Keep it short and light: a 2-4 second loop, WebM, about 1800 px wide, under about 2 MB. Obsidian Sync's Standard plan refuses files over 5 MB, and the phone gets the video only when **Videos** is on in Sync's selective sync; until then it shows the painting.

### Making the videos

Give the generator the painting as the first frame (image-to-video), paste the motion block, then one scene's line.

```text
MOTION (Dromos). Animate this painting as a seamless 4-second loop: the last frame must match the first. The camera does not move: no pan, no zoom, no parallax. Only the motion described below happens; everything else stays perfectly still, in the same painterly style, colours and light. No people, no hands, no text, no new objects. Slow and calm, nothing sudden.
```

- **archive-dark**: The candle flame flickers gently and its warm halo on the table breathes softly. In the window, two or three stars twinkle faintly.
- **desk-dark**: The oil lamp's small flame flickers gently, and the warm light it casts across the desk breathes softly.
- **wall-dark**: The warm lamplight on the lower right of the wall breathes very softly, as from a flame just out of the picture.
- **shelf-dark**: The warm glow at the lower left breathes very softly, as from a lamp just out of the picture.
- **archive-light**: Fine dust drifts slowly through the shaft of sunlight; outside the window the cypress sways very slightly and the cloud drifts.
- **desk-light**: Fine dust drifts slowly in the afternoon light above the desk.
- **wall-light**: Fine dust drifts slowly through the shaft of sunlight.
- **shelf-light**: Fine dust drifts very slowly in the soft light.
- **shop-dark**: The two hanging lamps' small flames flicker gently, and their warm light on the stall breathes softly.
- **shop-light**: The awning's shade stirs very slightly, as from a light breeze; the sunlight on the counter breathes softly.
