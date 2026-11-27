#!/usr/bin/env python3
"""Lends the runner's own satchel and strap to another stage painted in the same pose and on the same canvas.

    python3 -I tools/art/walker/satchel.py RUNNER.jpeg TARGET.jpeg OUT.jpeg

Gemini kept dropping the satchel that the guides of the pilgrim to the traveller carry. Every stage painting
shares one canvas and pose (1696 x 2528), so the brown leather pixels (not the red cloak, not the gold sash,
not the cream tunic) inside bands fitted to the strap and the satchel are cut from the runner, feathered, and
laid over the target. The bands are fractions of the canvas, fitted to the runner painting; check OUT and its
mask (OUT.mask.png) before keying, since a different pose or canvas needs the bands refitted. Write OUT as
in/<stage>.jpeg of the walker's work folder and run prep.py again. Needs Pillow.
"""
import sys
from PIL import Image, ImageDraw, ImageFilter
if len(sys.argv) != 4:
    sys.exit(__doc__)
runner, target, out = sys.argv[1:4]
R = Image.open(runner).convert('RGB')
T = Image.open(target).convert('RGB')
if T.size != R.size:
    sys.exit(f'the target is {T.size[0]} x {T.size[1]} and the runner {R.size[0]} x {R.size[1]}: both must share one canvas')
W, H = R.size
band = Image.new('L', R.size, 0)
d = ImageDraw.Draw(band)
# strap from the left shoulder down across the chest, then the satchel at the right hip (fractions of the canvas)
d.polygon([(0.215 * W, 0.235 * H), (0.265 * W, 0.235 * H), (0.50 * W, 0.525 * H), (0.43 * W, 0.525 * H)], fill=255)
d.rectangle((0.445 * W, 0.505 * H, 0.645 * W, 0.665 * H), fill=255)
d.polygon([(0.505 * W, 0.40 * H), (0.55 * W, 0.40 * H), (0.565 * W, 0.525 * H), (0.52 * W, 0.525 * H)], fill=255)
px = R.load()
leather = Image.new('L', R.size, 0)
lp = leather.load()
bp = band.load()
for y in range(int(0.22 * H), int(0.72 * H)):
    for x in range(int(0.20 * W), int(0.68 * W)):
        if not bp[x, y]:
            continue
        r, g, b = px[x, y]
        lum = 0.299 * r + 0.587 * g + 0.114 * b
        if r - g < 62 and lum < 152 and r - b > 30 and b > 0.36 * r and not (g > 150 and b < 90):
            lp[x, y] = 255
leather = leather.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.6))
Image.composite(R, T, leather).save(out, quality=95)
leather.save(out + '.mask.png')
