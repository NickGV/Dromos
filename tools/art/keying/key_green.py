#!/usr/bin/env python3
"""Cuts a painted figure out of its flat green (#00FF00) background, for the walker's stages.

    python3 -I tools/art/keying/key_green.py RAW.jpeg OUT.png

Alpha comes from how much green exceeds the brighter of red and blue (fully opaque up to 30 levels of excess,
fully clear from 110), the green spill is clamped to the brighter of red and blue, and the result is cropped
to the figure and its staff. Prints the crop box and size. Needs Pillow.
"""
import sys

from PIL import Image, ImageChops

if len(sys.argv) != 3:
    sys.exit(__doc__)
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
r, g, b = im.split()
mx = ImageChops.lighter(r, b)
excess = ImageChops.subtract(g, mx)
lo, hi = 30, 110
alpha = excess.point(lambda v: 255 if v <= lo else 0 if v >= hi else round(255 * (hi - v) / (hi - lo)))
g2 = ImageChops.darker(g, mx)
cut = Image.merge('RGBA', (r, g2, b, alpha))
box = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
cut = cut.crop(box)
cut.save(out)
print('box', box, 'size', cut.size)
