#!/usr/bin/env python3
"""Prepares the painted walker for Dromos: re-runnable, stage by stage.

  python3 -I tools/art/walker/prep.py WORK_DIR [--measure]

WORK_DIR is the folder walker/guides.cjs filled (pages/, walker-set.json), with the raw paintings in in/:
in/<stage>.(jpeg|jpg|png) for each stage painted, and in/objects.(jpeg|jpg|png) for the object sheet.

1. Keys out what changed: a raw stage painting newer than cut/<stage>.png is keyed from its green
   (keying/key_green.py); an object sheet newer than its cut objects is cut cell by cell from its magenta
   (keying/key_magenta.py) into cut/objects/. So a stage repainted later only needs its new raw image dropped
   into in/ and this script run again.
2. Measures the drawn figures in Chrome (measure.cjs -> measure.json), when missing or with --measure. Run it
   with --measure after the drawing changed, and after guides.cjs.
3. Maps each stage painting onto its drawn figure, in walker units with the feet at the origin: the painted
   feet's bottom on y 0, the painted staff's centre line on the drawn staff's (x 20), and one uniform scale
   from the painted hook's top (its centre line) to the feet, against the drawn staff's top. Then writes it
   into ONE fixed frame shared by every stage (WALKER_FRAME of WalkerFigure.tsx, read from walker-set.json),
   as a transparent WebP WALKER_PX_H pixels high: out/walker-<stage>.webp.
4. Maps each object painting's alpha box onto its drawn box around the object's own origin (one uniform
   scale, the geometric mean of the two axes, box centres aligned) and writes it into one fixed square frame
   (OBJECT_FRAME of SkillObject.tsx), OBJECT_PX pixels a side: out/object-<skill>.webp.
5. Reports each mapping's residual mismatch in report.json and on stdout. A painting that leaves its frame
   stops the script: widen the frame in the code, run guides.cjs again, then this script for every file.

Needs Pillow, Node (measure.cjs) and cwebp (CWEBP, else on PATH).
"""
import json
import math
import os
import statistics
import subprocess
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'lib'))
from binaries import cwebp  # noqa: E402

KEYING = os.path.join(HERE, '..', 'keying')

# Filled from WORK_DIR/walker-set.json, which guides.cjs writes from the code: the stage order and the shared
# frames (x, y, width, height), WALKER_FRAME of src/ui/atoms/avatar/WalkerFigure.tsx and OBJECT_FRAME of
# src/ui/atoms/avatar/SkillObject.tsx.
STAGES = []
WALKER_FRAME = None
OBJECT_FRAME = None
WALKER_PX_H = 480
OBJECT_PX = 160
OPAQUE = 96


def runs(row):
    """The opaque runs of one row of alpha bytes, as (start, end) pairs."""
    found, start = [], None
    for i, v in enumerate(row):
        if v > OPAQUE and start is None:
            start = i
        elif v <= OPAQUE and start is not None:
            found.append((start, i - 1))
            start = None
    if start is not None:
        found.append((start, len(row) - 1))
    return found


def newer(src, dst):
    return not os.path.exists(dst) or os.path.getmtime(src) > os.path.getmtime(dst)


def raw_of(d, name):
    for ext in ('jpeg', 'jpg', 'png'):
        path = f'{d}/in/{name}.{ext}'
        if os.path.exists(path):
            return path
    return None


def key(d, objects):
    os.makedirs(f'{d}/cut', exist_ok=True)
    for stage in STAGES:
        raw = raw_of(d, stage)
        if raw and newer(raw, f'{d}/cut/{stage}.png'):
            subprocess.run([sys.executable, '-I', f'{KEYING}/key_green.py', raw, f'{d}/cut/{stage}.png'], check=True)
            print('keyed', stage)
    raw = raw_of(d, 'objects')
    if raw and newer(raw, f'{d}/cut/objects/{objects[0]}.png'):
        os.makedirs(f'{d}/cut/objects', exist_ok=True)
        subprocess.run([sys.executable, '-I', f'{KEYING}/key_magenta.py', raw, f'{d}/walker-set.json', f'{d}/cut/objects'], check=True)
        print('cut objects')


def webp(image, path):
    png = path[:-5] + '.png'
    image.save(png)
    subprocess.run([cwebp(), '-quiet', '-q', '85', '-alpha_q', '90', png, '-o', path], check=True)
    os.remove(png)


def place(painting, scale, origin, frame, k):
    """`painting` scaled by `scale` units per pixel, its pixel (0, 0) at `origin` in units, drawn into `frame` at `k` px per unit."""
    fx, fy, fw, fh = frame
    w, h = painting.size
    f = scale * k
    small = painting.convert('RGBa').resize((max(1, round(w * f)), max(1, round(h * f))), Image.LANCZOS).convert('RGBA')
    canvas = Image.new('RGBA', (round(fw * k), round(fh * k)), (0, 0, 0, 0))
    canvas.alpha_composite(small, (round((origin[0] - fx) * k), round((origin[1] - fy) * k)))
    return canvas


def inside(box, frame):
    fx, fy, fw, fh = frame
    return box[0] >= fx and box[1] >= fy and box[2] <= fx + fw and box[3] <= fy + fh


def stage(d, name, vector):
    painting = Image.open(f'{d}/cut/{name}.png').convert('RGBA')
    alpha = painting.getchannel('A')
    w, h = painting.size
    left, top, right, bottom = alpha.point(lambda v: 255 if v > OPAQUE else 0).getbbox()
    # The staff: the rightmost opaque run of the rows below the hand, where it stands alone.
    found = []
    for y in range(int(h * 0.6), int(h * 0.95), 3):
        row = runs(alpha.crop((0, y, w, y + 1)).tobytes())
        if row:
            start, end = row[-1]
            found.append(((start + end + 1) / 2, end - start + 1))
    staff_x = statistics.median(c for c, _ in found)
    staff_w = statistics.median(width for _, width in found)
    mask = alpha.point(lambda v: 255 if v > OPAQUE else 0)
    feet = mask.crop((0, 0, int(staff_x - 2 * staff_w), h)).getbbox()[3]
    tip = mask.crop((int(staff_x - staff_w), 0, int(staff_x + staff_w), h)).getbbox()[3]
    hook = top + staff_w / 2
    scale = -vector['staff']['y'] / (feet - hook)
    origin = (vector['staff']['x'] - staff_x * scale, -feet * scale)
    unit = lambda px, py: (origin[0] + px * scale, origin[1] + py * scale)
    box = (*unit(left, top), *unit(right, bottom))
    # The painted lantern: what hangs right of the staff at the top.
    lantern = mask.crop((int(staff_x + staff_w), top, w, top + int(h * 0.2))).getbbox()
    lamp = unit(staff_x + staff_w + (lantern[0] + lantern[2]) / 2, top + (lantern[1] + lantern[3]) / 2) if lantern else None
    vb = vector['box']
    report = {
        'units_per_px': round(scale, 5),
        'painted_box': [round(v, 2) for v in box],
        'vector_box': [vb['x'], vb['y'], round(vb['x'] + vb['width'], 3), round(vb['y'] + vb['height'], 3)],
        'left_mismatch': round(box[0] - vb['x'], 2),
        'right_mismatch': round(box[2] - (vb['x'] + vb['width']), 2),
        'staff_tip_mismatch': round(unit(0, tip)[1] - (vector['staff']['y'] + vector['staff']['height']), 2),
        'lantern_centre': [round(v, 2) for v in lamp] if lamp else None,
        'lantern_mismatch': [round(lamp[0] - vector['lamp']['x'], 2), round(lamp[1] - vector['lamp']['y'], 2)] if lamp else None,
    }
    if not inside(box, WALKER_FRAME):
        sys.exit(f'{name}: the painting {report["painted_box"]} leaves WALKER_FRAME {WALKER_FRAME}; widen it in WalkerFigure.tsx and run guides.cjs again')
    k = WALKER_PX_H / WALKER_FRAME[3]
    webp(place(painting, scale, origin, WALKER_FRAME, k), f'{d}/out/walker-{name}.webp')
    return report


def thing(d, name, vector):
    painting = Image.open(f'{d}/cut/objects/{name}.png').convert('RGBA')
    left, top, right, bottom = painting.getchannel('A').point(lambda v: 255 if v > 32 else 0).getbbox()
    pw, ph = right - left, bottom - top
    scale = math.sqrt((vector['width'] / pw) * (vector['height'] / ph))
    cx, cy = vector['x'] + vector['width'] / 2, vector['y'] + vector['height'] / 2
    origin = (cx - (left + pw / 2) * scale, cy - (top + ph / 2) * scale)
    box = (origin[0] + left * scale, origin[1] + top * scale, origin[0] + right * scale, origin[1] + bottom * scale)
    report = {
        'units_per_px': round(scale, 5),
        'painted_box': [round(v, 2) for v in box],
        'vector_box': [vector['x'], vector['y'], round(vector['x'] + vector['width'], 3), round(vector['y'] + vector['height'], 3)],
        'width_mismatch': round(pw * scale - vector['width'], 2),
        'height_mismatch': round(ph * scale - vector['height'], 2),
    }
    if not inside(box, OBJECT_FRAME):
        sys.exit(f'{name}: the painting {report["painted_box"]} leaves OBJECT_FRAME {OBJECT_FRAME}; widen it in SkillObject.tsx and run guides.cjs again')
    webp(place(painting, scale, origin, OBJECT_FRAME, OBJECT_PX / OBJECT_FRAME[2]), f'{d}/out/object-{name}.webp')
    return report


def main():
    global STAGES, WALKER_FRAME, OBJECT_FRAME
    args = [a for a in sys.argv[1:] if a != '--measure']
    if len(args) != 1:
        sys.exit(__doc__)
    d = os.path.abspath(args[0])
    set_file = f'{d}/walker-set.json'
    if not os.path.exists(set_file):
        sys.exit(f'{set_file} is missing: run walker/guides.cjs on this folder first.')
    with open(set_file) as f:
        walker_set = json.load(f)
    STAGES = walker_set['stages']
    WALKER_FRAME = tuple(walker_set['walker_frame'])
    OBJECT_FRAME = tuple(walker_set['object_frame'])
    objects = walker_set['objects']
    os.makedirs(f'{d}/out', exist_ok=True)
    key(d, objects)
    if '--measure' in sys.argv or not os.path.exists(f'{d}/measure.json'):
        subprocess.run(['node', f'{HERE}/measure.cjs', d], check=True, stdout=subprocess.DEVNULL)
    with open(f'{d}/measure.json') as f:
        measured = json.load(f)
    report = {'walker_frame': WALKER_FRAME, 'object_frame': OBJECT_FRAME, 'stages': {}, 'objects': {}}
    for name in STAGES:
        if os.path.exists(f'{d}/cut/{name}.png'):
            report['stages'][name] = stage(d, name, measured['stages'][name])
    for name in objects:
        if os.path.exists(f'{d}/cut/objects/{name}.png'):
            report['objects'][name] = thing(d, name, measured['objects'][name])
    with open(f'{d}/report.json', 'w') as f:
        json.dump(report, f, indent=1)
    if report['stages']:
        boxes = [r['painted_box'] for r in report['stages'].values()]
        union = [min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes)]
        print('walker frame', WALKER_FRAME, 'paintings span', union)
        print(f'{"stage":<11} {"units/px":>8} {"left":>6} {"right":>6} {"tip":>6} {"lantern dx,dy":>14}')
        for name, r in report['stages'].items():
            lm = r['lantern_mismatch'] or ['-', '-']
            print(f'{name:<11} {r["units_per_px"]:>8} {r["left_mismatch"]:>6} {r["right_mismatch"]:>6} {r["staff_tip_mismatch"]:>6} {lm[0]:>6},{lm[1]:>6}')
    if report['objects']:
        boxes = [r['painted_box'] for r in report['objects'].values()]
        ounion = [min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes)]
        print('object frame', OBJECT_FRAME, 'paintings span', [round(v, 2) for v in ounion])
        for name, r in report['objects'].items():
            print(f'{name:<13} w {r["width_mismatch"]:>6} h {r["height_mismatch"]:>6}')
    if not report['stages'] and not report['objects']:
        print('nothing to prepare: put raw paintings in', f'{d}/in')


if __name__ == '__main__':
    main()
