#!/usr/bin/env python3
"""Lays a preset's masks over its painting, to check a new or changed preset before rendering it.

    python -I tools/art/motion/masks.py PRESET.json OUT.png --art ART_DIR

The painting is darkened where motion is not allowed (keep-outs and their margins), keep-out shapes are
outlined in magenta, and the effects' regions are tinted: clouds and sways red, smoke green, the breeze blue,
the sails yellow, and the fireflies' paths as yellow ellipses. Written 1856 px wide.
"""
import argparse, sys, os, numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motion import add_art_arg, art_dir, load_preset, build, shape_points
ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('preset'); ap.add_argument('out')
add_art_arg(ap)
args = ap.parse_args()
cfg = load_preset(args.preset, art_dir(args.art)); out = args.out
base_img, ctx, effects = build(cfg)
img = ctx.base.copy()
img *= (0.45 + 0.55 * ctx.allowed)[..., None]
red = np.zeros_like(img); red[..., 0] = 255
for e in effects:
    for d in getattr(e, 'items', []) if isinstance(getattr(e, 'items', None), list) else []:
        if isinstance(d, dict) and 'm' in d and 'b' in d:
            y0, y1, x0, x1 = d['b']; m = d['m'] if d['m'].ndim == 2 else d['m'][..., 0]
            img[y0:y1, x0:x1] += (np.array([255, 60, 60]) - img[y0:y1, x0:x1]) * (0.5 * m)[..., None]
    for d in getattr(e, 'plumes', []):
        y0, y1, x0, x1 = d['b']; img[y0:y1, x0:x1] += (np.array([60, 255, 60]) - img[y0:y1, x0:x1]) * (0.5 * d['a'])[..., None]
    if type(e).__name__ == 'Breeze':
        y0, y1, x0, x1 = e.b; img[y0:y1, x0:x1] += (np.array([60, 120, 255]) - img[y0:y1, x0:x1]) * (0.35 * e.m)[..., None]
    if type(e).__name__ == 'Sails':
        y0, y1, x0, x1 = e.b; img[y0:y1, x0:x1] += (np.array([255, 255, 0]) - img[y0:y1, x0:x1]) * (0.5 * e.alpha)[..., None]
    if type(e).__name__ == 'Fireflies':
        for it in e.items:
            cx, cy = it['c']; ax, ay = it['a']
            cv2.ellipse(img, (int(cx * ctx.s), int(cy * ctx.s)), (int(ax * ctx.s), int(ay * ctx.s)), 0, 0, 360, (255, 220, 0), 3)
for g in cfg.get('keepout', []):
    for sh in g['shapes']:
        p = np.round(np.asarray(shape_points(sh)) * ctx.s).astype(np.int32)
        cv2.polylines(img, [p], True, (255, 0, 255), 3)
cv2.imwrite(out, cv2.resize(np.clip(img, 0, 255).astype(np.uint8), (1856, round(1856 * ctx.H / ctx.W)), interpolation=cv2.INTER_AREA)[:, :, ::-1])
print('wrote', out)
