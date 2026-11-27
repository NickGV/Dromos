#!/usr/bin/env python3
"""Cuts a painted sheet of objects on flat magenta (#FF00FF) into one PNG per object, cell by cell.

    python3 -I tools/art/keying/key_magenta.py SHEET.jpeg NAMES.json OUTDIR [--grid 5x3]

NAMES.json lists the objects in the sheet's order, left to right and top to bottom: a JSON list, or an object
with an `objects` list (the walker-set.json that walker/guides.cjs writes). The sheet is split into the grid's
equal cells (5 x 3 by default, the objects guide's); each cell is keyed and cropped to its object and saved as
OUTDIR/<name>.png.

Alpha comes from how much the lower of red and blue exceeds green (magenta is red and blue with no green; fully
opaque up to 60 levels, fully clear from 160). The background is magenta because the olive wreath is green. On
the edges the magenta spill is capped: red and blue may exceed green by at most 40 levels. Needs Pillow.
"""
import argparse
import json
import os
import sys

from PIL import Image, ImageChops

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('sheet')
ap.add_argument('names')
ap.add_argument('outdir')
ap.add_argument('--grid', default='5x3', help='columns x rows (default 5x3)')
args = ap.parse_args()
src, order_file, outdir = args.sheet, args.names, args.outdir
cols, rows = (int(v) for v in args.grid.split('x'))
with open(order_file) as f:
    order = json.load(f)
if isinstance(order, dict):
    order = order['objects']
if len(order) > cols * rows:
    sys.exit(f'{len(order)} names do not fit a {cols} x {rows} grid')
os.makedirs(outdir, exist_ok=True)
im = Image.open(src).convert('RGB')
r, g, b = im.split()
mn = ImageChops.darker(r, b)
excess = ImageChops.subtract(mn, g)
lo, hi = 60, 160
alpha = excess.point(lambda v: 255 if v <= lo else 0 if v >= hi else round(255 * (hi - v) / (hi - lo)))
# Spill: where magenta tints an edge, red and blue may not exceed green by much.
cap = ImageChops.add(g, Image.new('L', im.size, 40))
r2, b2 = ImageChops.darker(r, cap), ImageChops.darker(b, cap)
edge = alpha.point(lambda v: 255 if 0 < v < 250 else 0)
r, b = Image.composite(r2, r, edge), Image.composite(b2, b, edge)
cut = Image.merge('RGBA', (r, g, b, alpha))
W, H = im.size
for i, name in enumerate(order):
    col, row = i % cols, i // cols
    cell = (round(col * W / cols), round(row * H / rows), round((col + 1) * W / cols), round((row + 1) * H / rows))
    piece = cut.crop(cell)
    box = piece.getchannel('A').point(lambda v: 255 if v > 32 else 0).getbbox()
    if box is None:
        sys.exit(f'{name}: cell {cell} holds nothing but magenta')
    piece.crop(box).save(os.path.join(outdir, f'{name}.png'))
    print(name, piece.crop(box).size)
