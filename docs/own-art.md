# Own art

Dromos can show paintings you keep in your vault behind some scenes, one for the light theme and one for the dark theme, instead of their drawing. This page says where the files go and how to make them.

The first scenes are the Library's **wall** (behind the alcoves) and **desk** (behind the scrolls being read), and the **archive** room. The shelf and the book and resource cards keep their drawing: the shelf writes text straight on its background, and a card leaves almost none of a painting visible.

## Where the files go

- In your Dromos folder (the plugin's vault folder setting, `Dromos` by default), in `Arte/`: `Dromos/Arte/<scene>-light.<ext>` and `Dromos/Arte/<scene>-dark.<ext>`, with `<scene>` one of `wall`, `desk`, `archive`, and `<ext>` one of `webp`, `png`, `jpg` (`jpeg` works too). The case of the name does not matter. If one painting has several files, WebP wins, then PNG, then JPG.
- A theme without its file draws the scene as always, even when the other theme has one.
- While a painting is there, it replaces the scene's drawing: the lamp, the ink pot, and the archive's window and worktable come from the painting, which is why the prompts ask for them. Text and buttons stay on their parchment panels.
- Dromos looks for the files when the Library opens and on **Sync**, so a painting you add shows after the next **Sync**. Obsidian serves them from the vault (`Vault.getResourcePath`): they sync to your phone with the vault, and the plugin carries none.

## Making the images

Paste the shared style block first, then one scene prompt. Percentages are of the finished image: x from the left, y from the top. Dromos shows the image cropped to fill the scene and centred, so wide panes keep the full width and lose some of the top and bottom, while phones keep the full height and only a central strip. The archive is the exception: its painting is anchored to the bottom, so the worktable stays on wide panes and the top of the wall is what they lose. The **focal area** of each prompt is the part every pane keeps.

If the generator cannot make the exact ratio, make the closest one it offers, extend the sides by outpainting, and resize to the given size. Export as WebP at about quality 80 and keep each file under about 600 KB: the files sync to your phone with the vault. A generator's JPEG converts with `cwebp -q 80 wall-dark.jpeg -o wall-dark.webp`; the first paintings went from about 2 MB to about 50 KB each with no visible loss.

### Shared style block

```text
STYLE (Dromos). A background painting for a calm role-playing game of one person's real life, set in an ancient library and scriptorium of the Mediterranean and Near East in the age of papyrus: dressed limestone, plaster, cedar and olive wood, papyrus, clay, wax tablets, bronze and clay oil lamps. Warm, painterly and restrained, like a quiet museum illustration or a gouache background for an animated film: soft brushwork, gentle light, subtle surface texture. Never cartoonish, never childlike, never glossy, never photographic, never fantasy-epic.
Mood: serene, unhurried, a place visited every day. Low contrast and soft edges everywhere; no single bright spot except where the scene prompt asks for one.
Palette, use only these families. Light theme (daylight): paper #FAF5EA, parchment #F3E9D2, limestone #EADCBD, niche shade #E2D2B0, pale wood #D9BC8C and #C4A274, umber lines #8B5E3C, ochre #C9962B, olive #6E8B4E and #8FA66B, clay #B5593C, pale sky #CFE3E8 to #E6EFEB, warm cream light. Dark theme (night): paper #1B1713, parchment #262019, stone #2A231C, niche #211B16, wood #4A3826 and #362818, umber #A8825F, papyrus #CFBE9C, ochre #D4A64A, lamp flame #E8B04A with a flat warm halo, night sky #121629 to #283049, moon #E8DDB5, hills #34452F; warm and lamplit, never cold, never blue-black.
Absolutely no text, letters, numbers, glyphs, hieroglyphs, inscriptions, pseudo-writing, signatures, watermarks, logos or frames. No people, figures, faces or hands. No modern objects, no books with spines, no screens. No neon, no glow effects, no lens flare, no bloom, no hard shadows, no heavy vignette, no strong gradients.
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
