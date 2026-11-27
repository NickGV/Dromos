#!/usr/bin/env python3
"""Motion (not light) under the calm areas, such as the Library's text panels.

    python -I tools/art/motion/calm.py PRESET.json... --art ART_DIR

Renders every third frame with only the effects that move things (motes, flames, sways, clouds, stars,
flicker) and reports the largest change inside the calm shapes (keep-out groups with a `strength` below 1), at
the video's size. Light that only breathes (glow) is left out on purpose and reported apart.
"""
import argparse, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motion import *
ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('presets', nargs='+')
add_art_arg(ap)
args = ap.parse_args()
art = art_dir(args.art)
for preset in args.presets:
    cfg = load_preset(preset, art); name = cfg['name']
    if not any(g.get('strength', 1.0) < 1 for g in cfg.get('keepout', [])):
        print(f'{name:14s} no calm shapes (no keep-out group with a strength below 1)'); continue
    W = cfg['width']; res = {}
    for label, types in (('motion', {'fireflies', 'sway', 'clouds', 'glint', 'flicker', 'smoke', 'wave', 'breeze', 'sails', 'mist', 'birds'}), ('light', {'glow'})):
        base_img, ctx, effects = build(cfg, types)
        if not effects:
            res[label] = None; continue
        H = round(W * ctx.H / ctx.W); n = round(cfg['fps'] * cfg['seconds'])
        calm = np.zeros((ctx.H, ctx.W), np.uint8)
        for g in cfg.get('keepout', []):
            if g.get('strength', 1.0) < 1:
                for sh in g['shapes']: fill(calm, shape_points(sh), ctx.s)
        calm = cv2.resize(calm, (W, H), interpolation=cv2.INTER_NEAREST) > 127
        mx = np.zeros((H, W), np.float32)
        for i in range(1, n, 3):
            d = cv2.resize(np.abs(render_full(ctx, effects, i / n) - ctx.base).max(2), (W, H), interpolation=cv2.INTER_AREA)
            mx = np.maximum(mx, d)
        res[label] = (float(mx[calm].max()), float(mx[calm].mean()), float(mx[~calm].max()) if (~calm).any() else 0.0)
    m, l = res['motion'], res['light']
    if m is None:
        m = (0.0, 0.0, 0.0)
    print(f"{name:14s} motion under calm: max {m[0]:5.1f} mean {m[1]:.2f} (elsewhere max {m[2]:5.1f})" + (f"   light under calm: max {l[0]:5.1f} mean {l[1]:.2f}" if l else ''))
