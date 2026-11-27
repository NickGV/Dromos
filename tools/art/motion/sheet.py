#!/usr/bin/env python3
"""Contact sheet and checks for a motion loop, from the encoded video itself.

    python -I tools/art/motion/sheet.py PRESET.json VIDEO.webm SHEET.png --art ART_DIR [--moves moves.npy]

Decodes every frame, then shows: frames at 0, 1/4, 1/2 and 3/4 of the loop cropped to the preset's
`sheet.crops` at 2x; the "what moves" heatmap (max abs difference from frame 0 over the loop) with the
keep-out shapes outlined; the seam (last frame against frame 0); and the numbers: frame 0 against the
painting at the same size, the seam against an ordinary frame step, and the motion inside the keep-outs.
With --moves (the map motion.py --moves saved), it also reports the motion before encoding inside the still
shapes, which should be 0, and inside the calm ones.
"""
import argparse, glob, json, os, shutil, subprocess, sys, tempfile
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motion import DECODE_VF, add_art_arg, art_dir, ffmpeg, fill, load_preset, shape_points

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('preset'); ap.add_argument('video'); ap.add_argument('sheet')
add_art_arg(ap)
ap.add_argument('--moves', default=None)
args = ap.parse_args()
cfg = load_preset(args.preset, art_dir(args.art))

tmp = tempfile.mkdtemp(dir=os.path.dirname(os.path.abspath(args.sheet)))
subprocess.check_call([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-i', args.video, '-vf', DECODE_VF, os.path.join(tmp, 'f%04d.png')])
frames = [np.asarray(Image.open(p).convert('RGB'), np.float32) for p in sorted(glob.glob(os.path.join(tmp, 'f*.png')))]
shutil.rmtree(tmp)
n = len(frames); H, W = frames[0].shape[:2]; s = W / 960
paint = np.asarray(Image.open(cfg['src']).convert('RGB').resize((W, H), Image.LANCZOS), np.float32)

# keep-out region at video size (the shapes themselves, no margin)
keep = np.zeros((H, W), np.uint8); calm = np.zeros((H, W), np.uint8)
for g in cfg.get('keepout', []):
    for sh in g['shapes']:
        fill(calm if g.get('strength', 1.0) < 1 else keep, shape_points(sh), s)
keep = keep > 127; calm = calm > 127

d0 = np.abs(frames[0] - paint)
seam = np.abs(frames[-1] - frames[0])
_sm = seam.max(2); _y, _x = np.unravel_index(_sm.argmax(), _sm.shape)
seam_at = f'at u ({_x / s:.0f}, {_y / s:.0f})'
steps = [np.abs(frames[i + 1] - frames[i]).mean() for i in range(n - 1)]
steps_max = [np.abs(frames[i + 1] - frames[i]).max(2)[~keep].max() for i in range(n - 1)]
heat = np.zeros((H, W), np.float32)
for f in frames:
    heat = np.maximum(heat, np.abs(f - frames[0]).max(2))
lines = [
    f'{os.path.basename(args.video)}  {W}x{H}  {n} frames  {os.path.getsize(args.video) // 1024} KB',
    f'frame 0 vs painting (same size): mean {d0.mean():.2f}  p99.9 {np.percentile(d0, 99.9):.0f}  max {d0.max():.0f}  (0-255 levels)',
    f'seam, last frame vs frame 0: mean {seam.mean():.3f}  max {seam.max():.0f} {seam_at};  ordinary frame step: mean {np.mean(steps):.3f} (range {min(steps):.3f}-{max(steps):.3f})  max {np.mean(steps_max):.0f} typical, {max(steps_max):.0f} largest',
]
if keep.any():
    lines.append(f'decoded heatmap inside the still shapes: mean {heat[keep].mean():.2f}  p99 {np.percentile(heat[keep], 99):.1f}  max {heat[keep].max():.0f}  (codec noise)')
if args.moves:
    mv = np.load(args.moves)
    if mv.shape == (H, W):
        if keep.any():
            lines.append(f'rendered motion (before encoding) inside the still shapes: max {mv[keep].max():.0f}  pixels moving {(mv[keep] > 0).sum()} of {keep.sum()}')
        if calm.any():
            lines.append(f'rendered motion inside the calm shapes (motion kept low): max {mv[calm].max():.0f}  mean {mv[calm].mean():.2f}  pixels moving {(mv[calm] > 0).sum()} of {calm.sum()}')
print('\n'.join(lines))

# ---- sheet
Z = 2
font = ImageFont.load_default(size=15) if hasattr(ImageFont, 'load_default') else None
rows = []
def label(img, text):
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)); d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 8 * len(text) + 10, 20), fill=(0, 0, 0)); d.text((5, 2), text, fill=(255, 255, 255), font=font)
    return np.asarray(im)
for name, (x0, y0, x1, y1) in cfg.get('sheet', {}).get('crops', {}).items():
    tiles = []
    for q, tag in ((0, '0'), (n // 4, '1/4'), (n // 2, '1/2'), (3 * n // 4, '3/4')):
        c = frames[q][int(y0 * s):int(y1 * s), int(x0 * s):int(x1 * s)]
        c = cv2.resize(c, None, fx=Z, fy=Z, interpolation=cv2.INTER_NEAREST)
        tiles.append(label(c, f'{name}  t={tag}'))
    rows.append(np.hstack([np.pad(t, ((0, 0), (0, 4), (0, 0)), constant_values=255) for t in tiles]))

# heatmap: painting darkened, motion in a warm ramp, keep-out shapes in magenta
ramp = np.clip(heat / 24.0, 0, 1)
hm = paint * 0.35
col = np.stack([255 * np.clip(ramp * 2, 0, 1), 255 * np.clip(ramp * 2 - 0.6, 0, 1), 60 * ramp], 2)
hm = hm * (1 - np.clip(ramp * 1.5, 0, 1)[..., None]) + col * np.clip(ramp * 1.5, 0, 1)[..., None]
hm8 = np.ascontiguousarray(np.clip(hm, 0, 255).astype(np.uint8))
for g in cfg.get('keepout', []):
    for sh in g['shapes']:
        cv2.polylines(hm8, [np.round(np.asarray(shape_points(sh)) * s).astype(np.int32)], True, (255, 0, 255), 1, cv2.LINE_AA)
rows.append(label(hm8, 'what moves: max |frame - frame 0| over the loop (full scale = 24 levels); magenta = still and calm areas'))
sd = np.clip(seam.max(2) * 8, 0, 255)
rows.append(label(frames[-1], 'seam: the last frame, which flows into frame 0'))
rows.append(label(np.repeat(sd[..., None], 3, 2), '|last frame - frame 0| x8 (codec noise refresh at the loop point plus one ordinary step of motion)'))
widest = max(r.shape[1] for r in rows)
rows = [np.pad(r, ((0, 6), (0, widest - r.shape[1]), (0, 0)), constant_values=255) for r in rows]
txt = Image.new('RGB', (widest, 22 * len(lines) + 10), (255, 255, 255)); d = ImageDraw.Draw(txt)
for i, l in enumerate(lines):
    d.text((8, 5 + 22 * i), l, fill=(0, 0, 0), font=font)
Image.fromarray(np.vstack([np.asarray(txt)] + rows).astype(np.uint8)).save(args.sheet)
print('sheet', args.sheet)
