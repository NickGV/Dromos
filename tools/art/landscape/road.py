#!/usr/bin/env python3
"""Checks a landscape painting against the game's road: draws the drawing's road and its landmarks over it.

    python3 -I tools/art/landscape/road.py PAINTING OUT.png [--guide GUIDE.png] [--full]

The painting is stretched to 3840 x 1200 (the drawing's 960 x 300 at 4x, as Dromos lays it) and the road's
outline is drawn in red, with magenta circles at the gate's foot, the campfire's spot, the windmill, the
shepherd and the lion. With --guide (landscape/guides.cjs's landscape-guide-<theme>.png), OUT-blend.png also
shows the painting and the guide at half opacity each. The output is cropped to the road's part of the scene
unless --full.

Keep a painting when the painted road stays under the red outline along its whole length, and the gate's foot
and the campfire's spot are plain grass. The road, the gate and the campfire are read from the plugin's source
(Landscape.tsx, walkerView.ts, Campfire.tsx), so the check follows the drawing. Needs Pillow.
"""
import argparse
import os
import re
import sys

from PIL import Image, ImageDraw

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'src')
K = 4                                  # px per drawing unit at 3840 x 1200
CROP = (1100, 560, 3000, 1200)         # the road's part of the scene, at 4x
# Hints for the eye, where the drawing has them (units of the 960 x 300 view box).
HINTS = {'mill': (412, 184), 'shepherd': (473, 193), 'lion': (504, 195)}


def source(rel, pattern, what):
    path = os.path.join(SRC, rel)
    with open(path, encoding='utf8') as f:
        m = re.search(pattern, f.read())
    if not m:
        sys.exit(f'{what} not found in src/{rel}: the drawing changed shape; update the pattern in road.py')
    return m.groups()


def path_points(d, steps=40):
    """Points of an SVG path made of absolute M, L and C commands, closed by Z or z."""
    tokens = re.findall(r'[MLCZz]|-?\d*\.?\d+', d)
    pts, i, cmd, cur, start = [], 0, None, None, None
    while i < len(tokens):
        tk = tokens[i]
        if tk in 'MLCZz':
            cmd = tk.upper()
            i += 1
            if cmd == 'Z':
                pts.append(start)
            continue
        if cmd == 'M':
            cur = start = (float(tokens[i]), float(tokens[i + 1]))
            i += 2
            pts.append(cur)
            cmd = 'L'
        elif cmd == 'L':
            cur = (float(tokens[i]), float(tokens[i + 1]))
            i += 2
            pts.append(cur)
        elif cmd == 'C':
            p1, p2, p3 = [(float(tokens[i + k]), float(tokens[i + k + 1])) for k in (0, 2, 4)]
            i += 6
            for k in range(1, steps + 1):
                u = k / steps
                a, b, c, e = (1 - u) ** 3, 3 * u * (1 - u) ** 2, 3 * u * u * (1 - u), u ** 3
                pts.append((a * cur[0] + b * p1[0] + c * p2[0] + e * p3[0], a * cur[1] + b * p1[1] + c * p2[1] + e * p3[1]))
            cur = p3
        else:
            sys.exit(f'unsupported path command {cmd} in the road')
    return pts


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('painting')
    ap.add_argument('out')
    ap.add_argument('--guide', help='the layout guide of the same theme, for a half-opacity blend')
    ap.add_argument('--full', action='store_true', help='keep the whole scene instead of the road\'s part')
    args = ap.parse_args()

    (road_d,) = source('ui/atoms/Landscape.tsx', r'className="dromos-scene-road" d="([^"]+)"', 'The road path')
    gate = tuple(float(v) for v in source('ui/presenters/walkerView.ts', r'GATE: ScenePoint = \{ x: (-?[\d.]+), y: (-?[\d.]+) \}', 'GATE'))
    fire = tuple(float(v) for v in source('ui/atoms/Campfire.tsx', r'CAMPFIRE = \{ x: (-?[\d.]+), y: (-?[\d.]+) \}', 'CAMPFIRE'))
    marks = {'gate': gate, 'fire': fire, **HINTS}
    road = path_points(road_d)

    painting = Image.open(args.painting).convert('RGB')
    print(f'painting {painting.width} x {painting.height} ({painting.width / painting.height:.3f}:1), drawing 3.2:1')
    base = painting.resize((960 * K, 300 * K), Image.LANCZOS)
    variants = [(args.out, base)]
    if args.guide:
        guide = Image.open(args.guide).convert('RGB').resize(base.size, Image.LANCZOS)
        stem, ext = os.path.splitext(args.out)
        variants.append((f'{stem}-blend{ext or ".png"}', Image.blend(base, guide, 0.5)))
    for out, im in variants:
        im = im.copy()
        draw = ImageDraw.Draw(im)
        draw.line([(x * K, y * K) for x, y in road], fill=(255, 0, 0), width=5)
        for name, (x, y) in marks.items():
            draw.ellipse([x * K - 14, y * K - 14, x * K + 14, y * K + 14], outline=(255, 0, 255), width=5)
            draw.text((x * K + 18, y * K - 30), name, fill=(255, 0, 255))
        (im if args.full else im.crop(CROP)).save(out)
        print('wrote', out)


if __name__ == '__main__':
    main()
