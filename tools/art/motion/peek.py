#!/usr/bin/env python3
"""Renders loop fractions of a preset at full resolution and tiles one crop of each, to tune an effect.

    python -I tools/art/motion/peek.py PRESET.json OUT.png --art ART_DIR --box X0 Y0 X1 Y1 --at 0,0.25,0.5
        [--zoom 2] [--only sway,clouds] [--cols 4]

The box is in drawing units (960 across the painting). t = 0 is the painting itself, so `--at 0` crops the
painting, to read off a preset's coordinates.
"""
import argparse, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motion import add_art_arg, art_dir, build, cv2, load_preset, np, render_full, Image

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('preset'); ap.add_argument('out')
add_art_arg(ap)
ap.add_argument('--box', nargs=4, type=float, required=True, metavar=('X0', 'Y0', 'X1', 'Y1'))
ap.add_argument('--at', required=True, help='comma list of loop fractions')
ap.add_argument('--zoom', type=float, default=1.0)
ap.add_argument('--only', default=None, help='comma list of effect types to render')
ap.add_argument('--cols', type=int, default=None)
args = ap.parse_args()
x0, y0, x1, y1 = args.box; z = args.zoom; ts = [float(v) for v in args.at.split(',')]
only = set(args.only.split(',')) if args.only else None
cfg = load_preset(args.preset, art_dir(args.art)); base_img, ctx, effects = build(cfg, only)
tiles = []
for t in ts:
    f = render_full(ctx, effects, t)
    b = ctx.box(x0, y0, x1, y1)
    c = np.clip(np.rint(f[b[0]:b[1], b[2]:b[3]]), 0, 255).astype(np.uint8)
    c = cv2.resize(c, None, fx=z, fy=z, interpolation=cv2.INTER_AREA if z < 1 else cv2.INTER_CUBIC)
    cv2.putText(c, f't={t:.3f}', (6, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    tiles.append(c)
cols = args.cols or len(tiles)
rows = [np.hstack(tiles[i:i + cols] + [np.zeros_like(tiles[0])] * (cols - len(tiles[i:i + cols]))) for i in range(0, len(tiles), cols)]
Image.fromarray(np.vstack(rows)).save(args.out)
print('wrote', args.out)
