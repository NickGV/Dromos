#!/usr/bin/env python3
"""Seamless motion loop from a still painting: the scene loops beside Dromos's paintings.

    python -I tools/art/motion/motion.py PRESET.json --art ART_DIR (--out-dir DIR | --out FILE.webm)
        [--width 1600] [--fps 15] [--seconds 10] [--bitrate 1000k] [--crf 8] [--only clouds,sway]
        [--frames 0,0.25,0.5] [--keep-frames] [--moves moves.npy]

The preset's `src` names the painting inside ART_DIR (the vault's `Dromos/Arte`, or a copy of it); its `out`
names the video written into --out-dir. ART_DIR can also come from the DROMOS_ART environment variable.
Every other setting of the preset (width, fps, seconds, encode) can be overridden here.

Coordinates in a preset are drawing units (u): the painting maps to 960 u across, like the landscape's
960 x 300 view box. Every effect is periodic in t (0..1 over the loop) and exactly zero at t = 0, so frame 0 is
the painting and the last frame flows into the first. Keep-out shapes (road, gate, campfire, the walker's way,
figures, the text panels) get no motion: every effect is multiplied by the feathered `allowed` mask; a group
with a `strength` below 1 is calm rather than still.

Frames are rendered at the painting's own resolution and only the difference from the painting is downscaled
and added to the painting at the output size, so still areas are the painting's pixels.

Effects (see presets/*.json): smoke, clouds, sails, breeze, sway, glint (stars, painted fireflies), flicker
(lamplight), glow (sun, moon, lamps), fireflies (extra drifting lights or motes), birds, mist, wave (an awning's
hem).

--frames saves those loop fractions as PNGs at full resolution (no video), named after --out or the preset.
--moves saves the "what moves" map (max abs difference from the painting, output size) for sheet.py.

Needs numpy, OpenCV (opencv-python-headless) and Pillow, and an ffmpeg with libvpx (FFMPEG, else discovered).
"""
import argparse, io, json, math, os, re, subprocess, sys
import numpy as np, cv2
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from binaries import ffmpeg  # noqa: E402

DECODE_VF = 'scale=flags=accurate_rnd+full_chroma_int,format=rgb24'   # decode for checks without a rounding bias
TAU = 2 * math.pi
VIEW_W = 960


def smoothstep(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3 - 2 * x)


def osc(t, n, phase=0.0):
    """Periodic over the loop (n whole cycles) and zero at t = 0."""
    return math.sin(TAU * n * t + phase) - math.sin(phase)


# ---------------------------------------------------------------- geometry

def svg_path_points(d, steps=24):
    tokens = re.findall(r'[MLCZmlcz]|-?\d*\.?\d+', d)
    pts, i, cmd, cur, start = [], 0, None, None, None
    while i < len(tokens):
        tk = tokens[i]
        if tk.upper() in 'MLCZ':
            cmd = tk.upper(); i += 1
            if cmd == 'Z':
                pts.append(start)
            continue
        if cmd == 'M':
            cur = start = (float(tokens[i]), float(tokens[i + 1])); i += 2; pts.append(cur); cmd = 'L'
        elif cmd == 'L':
            cur = (float(tokens[i]), float(tokens[i + 1])); i += 2; pts.append(cur)
        elif cmd == 'C':
            p1, p2, p3 = [(float(tokens[i + k]), float(tokens[i + k + 1])) for k in (0, 2, 4)]; i += 6
            for k in range(1, steps + 1):
                u = k / steps; a, b, c, e = (1 - u) ** 3, 3 * u * (1 - u) ** 2, 3 * u * u * (1 - u), u ** 3
                pts.append((a * cur[0] + b * p1[0] + c * p2[0] + e * p3[0], a * cur[1] + b * p1[1] + c * p2[1] + e * p3[1]))
            cur = p3
        else:
            raise ValueError('unsupported path command ' + str(cmd))
    return pts


def shape_points(sh):
    if 'path' in sh:
        return svg_path_points(sh['path'])
    if 'poly' in sh:
        return sh['poly']
    if 'rect' in sh:
        x0, y0, x1, y1 = sh['rect']
        return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
    if 'circle' in sh:
        cx, cy, r = sh['circle']
        return [[cx + r * math.cos(a), cy + r * math.sin(a)] for a in np.linspace(0, TAU, 48, endpoint=False)]
    if 'ellipse' in sh:
        cx, cy, rx, ry = sh['ellipse']
        return [[cx + rx * math.cos(a), cy + ry * math.sin(a)] for a in np.linspace(0, TAU, 64, endpoint=False)]
    raise ValueError('unknown shape ' + json.dumps(sh))


def fill(mask, pts, s, value=255):
    p = np.round(np.asarray(pts, np.float64) * s * 16).astype(np.int32)
    cv2.fillPoly(mask, [p], value, lineType=cv2.LINE_AA, shift=4)


class Ctx:
    def __init__(self, base, cfg):
        self.base = base                       # float32 H x W x 3, the painting at full resolution
        self.H, self.W = base.shape[:2]
        self.s = self.W / VIEW_W               # px per unit
        self.cfg = cfg
        self.rng = np.random.default_rng(cfg.get('seed', 7))
        self.allowed = np.ones((self.H, self.W), np.float32)
        self.still = np.ones((self.H, self.W), np.float32)   # the still groups only, without the calm ones
        self.keep = np.zeros((self.H, self.W), np.uint8)
        for group in cfg.get('keepout', []):
            m = np.zeros((self.H, self.W), np.uint8)
            for sh in group['shapes']:
                fill(m, shape_points(sh), self.s)
            self.keep = np.maximum(self.keep, m)
            dist = cv2.distanceTransform((m < 128).astype(np.uint8), cv2.DIST_L2, 5) / self.s
            # strength < 1 makes a calm area rather than a still one (e.g. under the Shop's plaque)
            out = smoothstep((dist - group.get('margin', 6)) / group.get('feather', 8))
            self.allowed *= (1 - group.get('strength', 1.0) * (1 - out)).astype(np.float32)
            if group.get('strength', 1.0) >= 1:
                self.still *= out.astype(np.float32)
        self.pin = np.zeros((self.H, self.W), np.float32)   # features that must not be displaced (stars)

    def box(self, x0, y0, x1, y1):
        """Unit box -> clipped pixel slice (y0, y1, x0, x1)."""
        s = self.s
        return (max(0, int(math.floor(y0 * s))), min(self.H, int(math.ceil(y1 * s))),
                max(0, int(math.floor(x0 * s))), min(self.W, int(math.ceil(x1 * s))))

    def grid(self, b):
        y0, y1, x0, x1 = b
        X, Y = np.meshgrid(np.arange(x0, x1, dtype=np.float32), np.arange(y0, y1, dtype=np.float32))
        return X, Y

    def units(self, b):
        X, Y = self.grid(b)
        return (X + 0.5) / self.s, (Y + 0.5) / self.s


# ---------------------------------------------------------------- displacement effects
# A displacement effect adds into dx, dy (pixels the content moves) inside its own box.

class Clouds:
    def __init__(self, cfg, ctx):
        self.cfg, self.ctx, self.items = cfg, ctx, []
        mg = cfg.get('margin', 8)
        for it in cfg['items']:
            cx, cy = it['c']; rx, ry = it['r']
            b = ctx.box(cx - rx - mg - 2, cy - ry - mg - 2, cx + rx + mg + 2, cy + ry + mg + 2)
            core = np.zeros((b[1] - b[0], b[3] - b[2]), np.uint8)
            pts = np.asarray(shape_points({'ellipse': [cx, cy, rx, ry]})) - [b[2] / ctx.s, b[0] / ctx.s]
            fill(core, pts, ctx.s)
            dist = cv2.distanceTransform((core < 128).astype(np.uint8), cv2.DIST_L2, 5) / ctx.s
            m = smoothstep(1 - dist / mg).astype(np.float32)
            Xu, Yu = ctx.units(b)
            self.items.append(dict(b=b, m=m, Xu=Xu, it=it))

    def prepare(self):
        for d in self.items:
            y0, y1, x0, x1 = d['b']
            d['m'] = d['m'] * self.ctx.allowed[y0:y1, x0:x1] * (1 - self.ctx.pin[y0:y1, x0:x1])

    def displace(self, t, dx, dy):
        s, c = self.ctx.s, self.cfg
        lam, nb, bill = c.get('billow_wave', 40), c.get('billow_cycles', 1), c.get('billow', 0.6)
        for d in self.items:
            it = d['it']; y0, y1, x0, x1 = d['b']; ph = it.get('phase', 0.0)
            drift = it.get('drift', c.get('drift', 3)) * osc(t, it.get('cycles', 1), ph)
            psi = TAU * d['Xu'] / lam
            billow = bill * (np.sin(TAU * nb * t - psi + ph) - np.sin(-psi + ph))
            dx[y0:y1, x0:x1] += s * d['m'] * drift
            dy[y0:y1, x0:x1] += s * d['m'] * billow
        return [d['b'] for d in self.items]


def gust_env(xu, t, c):
    """A periodic train of gusts crossing left to right, one per loop by default."""
    span, start, p, n = c.get('span', 1400), c.get('start', -230), c.get('sharp', 20), c.get('gusts', 1)
    return ((1 + np.cos(TAU * (xu - start) / span - TAU * n * t)) / 2) ** p


class Breeze:
    def __init__(self, cfg, ctx):
        self.cfg, self.ctx = cfg, ctx
        y_top = cfg.get('ymin', 200)
        self.b = ctx.box(0, y_top - 2, VIEW_W, 300)
        Xu, Yu = ctx.units(self.b)
        self.Xu, self.Yu = Xu, Yu
        m = smoothstep((Yu - y_top) / cfg.get('feather', 14))
        for sh in cfg.get('exclude', []):          # extra still areas (figures, the fold)
            e = np.zeros((ctx.H, ctx.W), np.uint8); fill(e, shape_points(sh), ctx.s)
            e = cv2.GaussianBlur(e, (0, 0), 3 * ctx.s)[self.b[0]:self.b[1], self.b[2]:self.b[3]] / 255.0
            m = m * (1 - np.clip(e * 2, 0, 1))
        self.m0 = m.astype(np.float32)
        lam = cfg.get('flutter_wave', 12)
        self.psi = (TAU * (Xu / lam + 0.6 * Yu / lam)).astype(np.float32)

    def prepare(self):
        y0, y1, x0, x1 = self.b
        self.m = self.m0 * self.ctx.allowed[y0:y1, x0:x1]
        self.env0 = gust_env(self.Xu, 0, self.cfg).astype(np.float32)
        self.flut0 = self.env0 * np.sin(self.psi)

    def displace(self, t, dx, dy):
        c, s = self.cfg, self.ctx.s
        y0, y1, x0, x1 = self.b
        env = gust_env(self.Xu, t, c).astype(np.float32)
        lean = c.get('lean', 1.2) * (env - self.env0)
        flut = c.get('flutter', 0.5) * (env * np.sin(self.psi - TAU * c.get('flutter_cycles', 8) * t) - self.flut0)
        dx[y0:y1, x0:x1] += s * self.m * (lean + flut)
        dy[y0:y1, x0:x1] += s * self.m * 0.25 * np.abs(lean)
        return [self.b]

    def sheen(self, frame, t):
        a = self.cfg.get('sheen', 0)
        if not a:
            return
        y0, y1, x0, x1 = self.b
        env = gust_env(self.Xu, t, self.cfg) - self.env0
        frame[y0:y1, x0:x1] *= (1 + a * self.m * env)[..., None]


class Sway:
    """Trees lean from their foot, more toward the top, with the passing gust and a little on their own."""
    def __init__(self, cfg, ctx):
        self.cfg, self.ctx, self.items = cfg, ctx, []
        for it in cfg['items']:
            (bx, by), (tx, ty), w = it['base'], it['top'], it['width']
            mg = it.get('margin', w * 0.6 + 3)
            b = ctx.box(min(bx, tx) - w - mg, min(by, ty) - mg, max(bx, tx) + w + mg, max(by, ty) + mg)
            Xu, Yu = ctx.units(b)
            # `base` is the still end (a tree's foot, a cloth's fold, a flame's wick), `top` the free end, either way up
            span = abs(by - ty); hr = (by - Yu) / (by - ty)
            h = np.clip(hr, 0, 1.15)
            cxl = bx + (tx - bx) * np.clip(hr, 0, 1)
            side = smoothstep(1 - (np.abs(Xu - cxl) - w) / mg)
            top = smoothstep(1 - (hr - 1) * span / mg) * (hr >= 0)
            m = (side * top * h ** it.get('power', 1.6)).astype(np.float32)
            self.items.append(dict(b=b, m=m, it=it, x=bx))

    def prepare(self):
        for d in self.items:
            y0, y1, x0, x1 = d['b']
            d['m'] = d['m'] * self.ctx.allowed[y0:y1, x0:x1]

    def displace(self, t, dx, dy):
        c, s = self.cfg, self.ctx.s
        g = c.get('gust', {})
        for d in self.items:
            it = d['it']; y0, y1, x0, x1 = d['b']
            gust = float(gust_env(np.array(d['x']), t, g) - gust_env(np.array(d['x']), 0, g))
            idle = osc(t, it.get('idle_cycles', c.get('idle_cycles', 2)), it.get('phase', 0.0))
            if 'idle_cycles2' in it:      # a second, faster flutter (flames)
                idle += 0.5 * osc(t, it['idle_cycles2'], it.get('phase', 0.0) * 1.7 + 1.0)
            dx[y0:y1, x0:x1] += s * d['m'] * (it.get('amp', 0.8) * gust + it.get('idle', c.get('idle', 0.25)) * idle)
        return [d['b'] for d in self.items]


# ---------------------------------------------------------------- render effects
# A render effect changes the frame (float32) in place after the displacement warp.

class Smoke:
    """Chimney smoke: a wave travelling up the plume, growing with height, and a soft upward flow
    (two copies of the plume drifting up half a cycle apart, crossfaded, so the loop closes)."""
    def __init__(self, cfg, ctx):
        self.cfg, self.ctx, self.plumes = cfg, ctx, []
        for p in cfg['plumes']:
            path = np.asarray(p['path'], np.float64)
            w0, w1 = p.get('width', [3, 8])
            pad = w1 + 6
            b = ctx.box(path[:, 0].min() - pad, path[:, 1].min() - pad, path[:, 0].max() + pad, path[:, 1].max() + pad)
            Xu, Yu = ctx.units(b)
            seg_len = np.hypot(*np.diff(path, axis=0).T); total = seg_len.sum(); acc = np.concatenate([[0], np.cumsum(seg_len)])
            best_d = np.full(Xu.shape, 1e9, np.float64); best_h = np.zeros(Xu.shape)
            for k in range(len(path) - 1):
                a, e = path[k], path[k + 1]; v = e - a; L2 = (v ** 2).sum()
                u = np.clip(((Xu - a[0]) * v[0] + (Yu - a[1]) * v[1]) / L2, 0, 1)
                d = np.hypot(Xu - a[0] - u * v[0], Yu - a[1] - u * v[1])
                better = d < best_d
                best_d = np.where(better, d, best_d); best_h = np.where(better, (acc[k] + u * seg_len[k]) / total, best_h)
            w = w0 + (w1 - w0) * best_h
            m = smoothstep((1 - best_d / w) / 0.55)
            vis = p.get('visible', 1.0)               # fraction of the path that holds smoke; the rest is clear sky
            amp = smoothstep(best_h / max(1e-3, vis * 0.85)) ** 1.0
            X, Y = ctx.grid(b)
            self.plumes.append(dict(b=b, m=m.astype(np.float32), amp=amp.astype(np.float32), Yu=Yu, base_y=path[0, 1], X=X, Y=Y,
                                    phase=p.get('phase', 0.0), lean=p.get('lean', 1.0)))

    def prepare(self):
        for d in self.plumes:
            y0, y1, x0, x1 = d['b']
            d['m'] = d['m'] * self.ctx.allowed[y0:y1, x0:x1]
            d['a'] = d['m'] * d['amp']

    def render(self, frame, t):
        c, s = self.cfg, self.ctx.s
        lam = c.get('wave', 16)
        for d in self.plumes:
            y0, y1, x0, x1 = d['b']; ph = d['phase']
            psi = TAU * (d['base_y'] - d['Yu']) / lam
            sway = np.zeros_like(d['a'])
            for n, w in c.get('cycles', [[1, 1.0], [2, 0.5]]):
                sway += w * (np.sin(TAU * n * t - psi * n + ph) - np.sin(-psi * n + ph))
            sway += c.get('bend', 0.6) * osc(t, 1, ph + 0.7) * d['lean'] * (d['base_y'] - d['Yu']) / lam
            dx = s * c.get('sway', 1.5) * d['a'] * sway
            src = frame[y0:y1, x0:x1].copy()
            mx = d['X'] - x0 - dx
            rise, rc = c.get('rise', 0), c.get('rise_cycles', 2)
            if rise:
                v = s * rise * d['a']
                pa = ((t * rc + 0.5) % 1) - 0.5; wa = 1 - 2 * abs(pa); pb = ((t * rc) % 1) - 0.5
                la = cv2.remap(src, mx, d['Y'] - y0 + v * pa, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
                lb = cv2.remap(src, mx, d['Y'] - y0 + v * pb, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
                out = wa * la + (1 - wa) * lb
            else:
                out = cv2.remap(src, mx, d['Y'] - y0, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            sel = (d['a'] > 0)[..., None]
            frame[y0:y1, x0:x1] = np.where(sel, out, src)


class Sails:
    """Windmill sails turning: cut out, background inpainted, sails rotated about the hub. Four sails are
    only roughly alike, so the turn crossfades into the same sails a quarter turn back and the loop closes."""
    def __init__(self, cfg, ctx):
        self.cfg, self.ctx = cfg, ctx
        s = ctx.s
        hub = np.asarray(cfg['hub'], np.float64)
        tips = np.asarray(cfg['tips'], np.float64)
        R = np.hypot(*(tips - hub).T).max() + 4
        self.b = b = ctx.box(hub[0] - R, hub[1] - R, hub[0] + R, hub[1] + R)
        y0, y1, x0, x1 = b
        SS = 4
        off = np.array([x0 / s, y0 / s])
        back = cfg.get('back', 1.0); ext = cfg.get('extend', 0.6)
        offs = cfg.get('offset', [0] * len(tips))
        def blades(w, hub_r):
            big = np.zeros(((y1 - y0) * SS, (x1 - x0) * SS), np.uint8)
            for tip, o in zip(tips, offs):
                v = tip - hub; L = np.hypot(*v); e = v / L; n = np.array([-e[1], e[0]])
                c0 = hub - e * back + n * o; c1 = tip + e * ext + n * o
                quad = [c0 + n * w / 2, c1 + n * w / 2, c1 - n * w / 2, c0 - n * w / 2]
                fill(big, np.asarray(quad) - off, s * SS)
            fill(big, np.asarray(shape_points({'circle': [hub[0], hub[1], hub_r]})) - off, s * SS)
            return cv2.resize(big, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        # `width` bounds where a sail may be; `core` is the blade itself, always opaque. Between them the
        # matte decides, by how far a pixel is from what lies behind.
        alpha = blades(cfg.get('width', 4.2), cfg.get('hub_r', 2.4))
        core = blades(cfg['core'], cfg.get('core_hub_r', 0)) if isinstance(cfg.get('core'), (int, float)) else np.zeros_like(alpha)
        crop = ctx.base[y0:y1, x0:x1]
        crop8 = np.clip(crop, 0, 255).astype(np.uint8)
        hole = cv2.dilate((alpha > 0.02).astype(np.uint8), np.ones((3, 3), np.uint8), iterations=cfg.get('dilate', 2))
        # What lies behind the sails is filled layer by layer (the tower, then the hill, then the sky), each
        # from its own pixels only, so the tower's edge and the hill line stay sharp.
        owner = np.zeros(hole.shape, np.int32)          # 0 = the rest (sky)
        for k, sh in enumerate(cfg.get('behind', []), start=1):
            m = np.zeros(hole.shape, np.uint8); fill(m, np.asarray(shape_points(sh)) - off, s)
            owner[(m > 127) & (owner == 0)] = k
        r = cfg.get('inpaint_r', 6)
        bg = np.zeros_like(crop)
        behind = cfg.get('behind', [])
        for k in np.unique(owner):
            mine = owner == k
            if k > 0 and behind[k - 1].get('rows'):
                # a lit body such as the tower: shaded across, so each row is filled by a straight blend between
                # its nearest visible pixels on the left and on the right
                filled = crop.copy()
                left = mine & (hole > 0)                    # what still needs a value
                for yy in range(mine.shape[0]):
                    row = mine[yy]; known = row & (hole[yy] == 0); want = row & (hole[yy] > 0)
                    if want.any() and known.sum() >= max(2, int(row.sum() * 0.25)):
                        xs = np.where(known)[0]
                        for ch in range(3):
                            filled[yy, want, ch] = np.interp(np.where(want)[0], xs, crop[yy, xs, ch])
                        left[yy] = False
                if left.any():                              # rows the sails hide almost entirely: from the rows around
                    f8 = np.clip(filled, 0, 255).astype(np.uint8)
                    filled = np.where(left[..., None], cv2.inpaint(f8, (left | ~mine).astype(np.uint8), r, cv2.INPAINT_TELEA).astype(np.float32), filled)
                filled = cv2.GaussianBlur(filled, (0, 0), 0.6)
            else:
                filled = cv2.inpaint(crop8, np.maximum(hole, (~mine).astype(np.uint8)), r, cv2.INPAINT_TELEA).astype(np.float32)
            bg[mine] = filled[mine]
        self.bg = np.where(hole[..., None] > 0, bg, crop)
        # Keep only the pixels that differ from what is behind: the sails, not the sky caught in their boxes.
        diff = np.abs(crop - self.bg).sum(2)
        matte = smoothstep(diff / cfg.get('matte', 70))
        if cfg.get('core') == 'auto':
            core = self.fit_blades(matte, hub, tips, off, SS, blades)
        alpha = np.maximum(core, alpha * matte)
        self.alpha = alpha.astype(np.float32)
        self.pre = crop * alpha[..., None]
        self.hub_px = ((hub[0] * s - x0) - 0.5, (hub[1] * s - y0) - 0.5)
        # tips listed counter-clockwise as seen: p0 turns toward p1, p1 toward p2, ...
        p = tips - hub
        if len(p) == 4 and cfg.get('slant', True):
            self.A = np.column_stack([(p[0] - p[2]) / 2, (p[1] - p[3]) / 2])
        else:
            self.A = np.array([[1.0, 0], [0, -1.0]])   # plain image rotation, counter-clockwise as seen
        self.axes = [u * s for u in p]                  # hub -> tip, in pixels
        self.hole = hole
        self.resid = ((crop - self.bg) * (1 - self.alpha[..., None])).astype(np.float32)
        self.split()

    def prepare(self):
        pass

    def fit_blades(self, matte, hub, tips, off, SS, blades):
        """Find each blade's two long edges from the matte across it (where the blade stands out from what lies
        behind), fit them as lines, and return the blades between them, inset a little, as an opaque core."""
        s, cfg = self.ctx.s, self.cfg
        y0, y1, x0, x1 = self.b
        span = cfg.get('width', 7) / 2
        offs = np.arange(-span, span + 1e-6, 0.1)
        fits, widths = [], []
        for tip in tips:
            v = tip - hub; L = np.hypot(*v); e = v / L; n = np.array([-e[1], e[0]])
            rows = []
            for f in np.linspace(0.35, 0.95, 13):
                pts = (hub + e * L * f)[None, :] + offs[:, None] * n[None, :]
                px = (pts[:, 0] * s - x0 - 0.5).astype(np.float32); py = (pts[:, 1] * s - y0 - 0.5).astype(np.float32)
                m = cv2.remap(matte.astype(np.float32), px[None, :], py[None, :], cv2.INTER_LINEAR)[0]
                on = m > 0.5
                if not on.any():
                    continue
                k = np.argmax(m)                       # the run of blade pixels around the strongest one
                a = k
                while a > 0 and on[a - 1]: a -= 1
                b = k
                while b < len(on) - 1 and on[b + 1]: b += 1
                rows.append((f, offs[a], offs[b], a == 0, b == len(on) - 1))
            fits.append((e, n, L, rows))
            good = [r[2] - r[1] for r in rows if not r[3] and not r[4]]
            widths += good
        wmed = float(np.median(widths)) if widths else 3.6
        inset = cfg.get('core_inset', 0.3)
        big = np.zeros(((y1 - y0) * SS, (x1 - x0) * SS), np.uint8)
        self.blade_fit, self.fitted = [], []
        for e, n, L, rows in fits:
            fl = np.array([[r[0], r[1]] for r in rows if not r[3]]); fr = np.array([[r[0], r[2]] for r in rows if not r[4]])
            left = np.polyfit(fl[:, 0], fl[:, 1], 1) if len(fl) >= 4 else None
            right = np.polyfit(fr[:, 0], fr[:, 1], 1) if len(fr) >= 4 else None
            if left is None and right is None:
                continue
            if left is None: left = right - [0, wmed]
            if right is None: right = left + [0, wmed]
            self.blade_fit.append((left.tolist(), right.tolist()))
            mid1 = (np.polyval(left, 1) + np.polyval(right, 1)) / 2; wid1 = np.polyval(right, 1) - np.polyval(left, 1)
            self.fitted.append(((e * L + n * mid1) * s, n * wid1 * s))   # the blade's far end and width, in pixels
            f_end = 1 + cfg.get('core_extend', -0.6) / L      # stop short of the tip: the matte finds the end
            q = []
            for f, side, sign in ((0.0, left, 1), (f_end, left, 1), (f_end, right, -1), (0.0, right, -1)):
                o = np.polyval(side, f) + sign * inset
                q.append(hub + e * L * f + n * o)
            fill(big, np.asarray(q) - off, s * SS)
        fill(big, np.asarray(shape_points({'circle': [hub[0], hub[1], cfg.get('core_hub_r', 2.4)]})) - off, s * SS)
        return cv2.resize(big, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA).astype(np.float32) / 255

    def turn(self, deg):
        """The turn by `deg` in the plane of the sails, seen at the painting's slant: the tips lie on an ellipse,
        A maps the unit circle onto it, and the turn is A R A^-1 (2 x 2, about the hub)."""
        a = math.radians(deg)
        R = np.array([[math.cos(a), -math.sin(a)], [math.sin(a), math.cos(a)]])
        return self.A @ R @ np.linalg.inv(self.A)

    def split(self):
        """One layer per sail (pixels nearest each sail's axis, measured on the sails' own circle) and, per sail,
        the map L_k that lays sail k exactly over the next one: its axis onto the next axis, its width onto the next width."""
        y0, y1, x0, x1 = self.b
        X, Y = np.meshgrid(np.arange(x1 - x0, dtype=np.float64), np.arange(y1 - y0, dtype=np.float64))
        Ai = np.linalg.inv(self.A)
        q = Ai @ np.vstack([X.ravel() - self.hub_px[0], Y.ravel() - self.hub_px[1]])
        ang = np.arctan2(q[1], q[0]).reshape(X.shape)
        axes = [np.arctan2(*(Ai @ u)[::-1]) for u in self.axes]
        dist = np.stack([np.abs((ang - a + np.pi) % (2 * np.pi) - np.pi) for a in axes])
        near = dist.argmin(0)
        # the hub turns as one piece with the plain slanted turn, so it never cracks between the sails
        r_hub = self.cfg.get('core_hub_r', 2.4) * self.ctx.s
        hubm = smoothstep((r_hub + 1 - np.hypot(X - self.hub_px[0], Y - self.hub_px[1])) / 2).astype(np.float32)
        self.hub_layer = (self.alpha * hubm, self.pre * hubm[..., None])
        self.layers = [(self.alpha * (near == k) * (1 - hubm), self.pre * ((near == k) * (1 - hubm))[..., None]) for k in range(len(axes))]
        T90 = self.turn(90)
        n = len(self.axes)
        if len(getattr(self, 'fitted', [])) == n:
            # from the fitted blades: each blade's far end onto the next one's, its width onto the next width
            fr = [np.column_stack([u, w]) for u, w in self.fitted]
        else:
            fr = [np.column_stack([u, T90 @ u]) for u in self.axes]
        self.L = [fr[(k + 1) % n] @ np.linalg.inv(fr[k]) for k in range(n)]

    def warp(self, img, lin):
        c = np.array(self.hub_px)
        M = np.hstack([lin, (c - lin @ c)[:, None]])
        h, w = img.shape[:2]
        return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)

    def render(self, frame, t):
        """Each sail travels from its own place to the next sail's place over one quarter turn (the slanted turn,
        corrected linearly so it lands exactly). A second copy of the sails travels from the previous sail's
        place to its own; the two copies cross-fade around the middle of the turn, so the loop closes on the painting."""
        c = self.cfg
        ph = (c.get('quarters', 1) * t) % 1
        if t == 0:
            return
        I = np.eye(2); n = len(self.layers)
        T1, T2 = self.turn(90 * ph), self.turn(90 * (ph - 1))
        Ti90 = np.linalg.inv(self.turn(90))
        w = float(smoothstep((ph - 0.5) / c.get('handover', 0.5) + 0.5))
        if getattr(self, 'force_w', None) is not None:
            w = self.force_w
        A = np.zeros(self.alpha.shape, np.float32); C = np.zeros(self.pre.shape, np.float32)
        for k, (al, pr) in enumerate(self.layers):
            E = self.L[k] @ Ti90                                   # sail k: here -> the next sail's place
            m1 = ((1 - ph) * I + ph * E) @ T1
            Eb = np.linalg.inv(self.L[(k - 1) % n]) @ self.turn(90)  # sail k: the previous sail's place -> here
            m2 = ((1 - ph) * Eb + ph * I) @ T2
            A += (1 - w) * self.warp(al, m1) + w * self.warp(al, m2)
            C += (1 - w) * self.warp(pr, m1) + w * self.warp(pr, m2)
        al, pr = self.hub_layer
        settle = float(smoothstep(1 - ph / c.get('settle', 0.06)) + smoothstep(1 - (1 - ph) / c.get('settle', 0.06)))
        A += (1 - w) * self.warp(al, T1) + w * self.warp(al, T2)
        C += (1 - w) * self.warp(pr, T1) + w * self.warp(pr, T2)
        A = np.clip(A, 0, 1)
        y0, y1, x0, x1 = self.b
        under = np.where(self.hole[..., None] > 0, self.bg, frame[y0:y1, x0:x1])
        frame[y0:y1, x0:x1] = under * (1 - A[..., None]) + C
        if settle > 0:
            # near the loop's ends the sails are within a few degrees of the painting: blend in what the matte
            # left behind (partly transparent sail pixels over the filled background), so the loop closes exactly
            frame[y0:y1, x0:x1] += self.resid * settle


class Glint:
    """Small lights that breathe: stars twinkle, painted fireflies pulse. Each brightens its own highlight
    over the local background and gains a soft halo when bright."""
    def __init__(self, cfg, ctx):
        self.cfg, self.ctx, self.items = cfg, ctx, []
        s = ctx.s
        pts = [tuple(p) for p in cfg.get('points', [])]
        if 'auto' in cfg:
            pts += self.detect(cfg['auto'])
        L = ctx.base.mean(2)
        r_u, halo_u = cfg.get('radius', 2.0), cfg.get('halo', 3.0)
        R = max(r_u * 2.5, halo_u * 3)
        cyc = cfg.get('cycles', [2, 3])
        for k, (px, py) in enumerate(pts):
            if cfg.get('snap', 0):
                b = ctx.box(px - cfg['snap'], py - cfg['snap'], px + cfg['snap'], py + cfg['snap'])
                sub = L[b[0]:b[1], b[2]:b[3]]
                yy, xx = np.unravel_index(np.argmax(sub), sub.shape)
                px, py = (b[2] + xx + 0.5) / s, (b[0] + yy + 0.5) / s
            b = ctx.box(px - R, py - R, px + R, py + R)
            y0, y1, x0, x1 = b
            Xu, Yu = ctx.units(b)
            r2 = (Xu - px) ** 2 + (Yu - py) ** 2
            crop = ctx.base[y0:y1, x0:x1]
            ring = (r2 > (r_u * 1.6) ** 2) & (r2 < (r_u * 2.4) ** 2)
            bgc = np.median(crop[ring], axis=0) if ring.any() else crop.min((0, 1))
            hi = np.clip(crop - bgc, 0, None)
            win = np.exp(-r2 / (2 * r_u ** 2))[..., None]
            halo = np.exp(-r2 / (2 * halo_u ** 2))[..., None]
            peak = hi.reshape(-1, 3)[np.argmax(hi.sum(2))] if hi.size else np.zeros(3)
            allow = ctx.allowed[y0:y1, x0:x1][..., None]
            self.items.append(dict(b=b, hi=(hi * win * allow).astype(np.float32), halo=(halo * allow * peak).astype(np.float32),
                                   n=cyc[int(ctx.rng.integers(len(cyc)))], ph=float(ctx.rng.uniform(0, TAU)), c=(px, py)))
        self.pins = [(d['c'], r_u * 2.5) for d in self.items]

    def detect(self, a):
        ctx = self.ctx; s = ctx.s
        L = ctx.base.mean(2)
        top = L - cv2.GaussianBlur(L, (0, 0), 3 * s)
        y0, y1, x0, x1 = ctx.box(*a.get('box', [0, 0, VIEW_W, 150]))
        m = np.zeros_like(L, bool); m[y0:y1, x0:x1] = True
        m &= top > a.get('thresh', 40)
        n, lab, st, cent = cv2.connectedComponentsWithStats(m.astype(np.uint8), 8)
        out = []
        for i in range(1, n):
            if a.get('minarea', 4) <= st[i, 4] <= a.get('maxarea', 400):
                cx, cy = cent[i] / s
                if ctx.allowed[int(cent[i][1]), int(cent[i][0])] > 0.5:
                    out.append((cx, cy))
        return out

    def prepare(self):
        pass

    def render(self, frame, t):
        c = self.cfg
        amp, hs = c.get('amp', 0.45), c.get('halo_strength', 0.25)
        for d in self.items:
            f = amp * osc(t, d['n'], d['ph']) / (1 + abs(math.sin(d['ph'])))
            y0, y1, x0, x1 = d['b']
            frame[y0:y1, x0:x1] += d['hi'] * f + d['halo'] * (hs * max(f, 0) / amp)


class Flicker:
    """Lamplight in windows and a doorway breathing and flickering gently, warmer when brighter."""
    def __init__(self, cfg, ctx):
        self.cfg, self.ctx, self.items = cfg, ctx, []
        for it in cfg['items']:
            cx, cy = it['c']; rx, ry = it['r']
            b = ctx.box(cx - rx * 2.2, cy - ry * 2.2, cx + rx * 2.2, cy + ry * 2.2)
            y0, y1, x0, x1 = b
            Xu, Yu = ctx.units(b)
            g = np.exp(-(((Xu - cx) / rx) ** 2 + ((Yu - cy) / ry) ** 2) / 2)
            crop = ctx.base[y0:y1, x0:x1]
            warm = smoothstep((crop[..., 0] - crop[..., 2] - cfg.get('warm_min', 25)) / 70) * smoothstep((crop[..., 0] - 70) / 90)
            m = cv2.GaussianBlur((g * warm).astype(np.float32), (0, 0), 0.5 * ctx.s) * ctx.allowed[y0:y1, x0:x1]
            halo = (g ** 0.5 * cfg.get('halo', 0.0)).astype(np.float32)
            self.items.append(dict(b=b, m=m[..., None], halo=halo[..., None], group=it.get('group', 0)))
        groups = sorted({d['group'] for d in self.items})
        self.phases = {g: ctx.rng.uniform(0, TAU, 4) for g in groups}

    def prepare(self):
        pass

    def level(self, t, g):
        ph = self.phases[g]
        freqs = self.cfg.get('freqs', [[2, 0.5], [5, 0.3], [9, 0.2], [13, 0.12]])
        return self.cfg.get('amp', 0.12) * sum(w * osc(t, n, ph[k % 4]) for k, (n, w) in enumerate(freqs))

    def render(self, frame, t):
        warm = np.array(self.cfg.get('color', [255, 196, 110]), np.float32)
        for d in self.items:
            f = self.level(t, d['group'])
            y0, y1, x0, x1 = d['b']
            region = frame[y0:y1, x0:x1]
            region += region * d['m'] * f
            if f > 0:
                region += warm * d['halo'] * f


class Glow:
    """A soft halo around the sun or the moon that breathes once or twice per loop."""
    def __init__(self, cfg, ctx):
        self.cfg, self.ctx = cfg, ctx
        if cfg.get('mask') == 'lum':
            # light that has a shape of its own (a sunbeam, the glow on a wall): the painting's brighter parts,
            # from its blurred brightness between two percentiles, optionally within a box
            self.b = ctx.box(*cfg.get('box', [0, 0, VIEW_W, ctx.H / ctx.s]))
            y0, y1, x0, x1 = self.b
            L = cv2.GaussianBlur(ctx.base.mean(2), (0, 0), cfg.get('blur', 6) * ctx.s)[y0:y1, x0:x1]
            lo, hi = np.percentile(L, cfg.get('lo', 35)), np.percentile(L, cfg.get('hi', 97))
            m = smoothstep((L - lo) / max(1.0, hi - lo))
            if 'box' in cfg:
                Xu, Yu = ctx.units(self.b); f = cfg.get('feather', 10); bx0, by0, bx1, by1 = cfg['box']
                m = m * smoothstep((Xu - bx0) / f) * smoothstep((bx1 - Xu) / f) * smoothstep((Yu - by0) / f) * smoothstep((by1 - Yu) / f)
            self.g = (m * self.mask(ctx)[y0:y1, x0:x1])[..., None].astype(np.float32)
            return
        cx, cy = cfg['c']; r = cfg['r']
        self.b = ctx.box(cx - 3 * r, cy - 3 * r, cx + 3 * r, cy + 3 * r)
        Xu, Yu = ctx.units(self.b)
        y0, y1, x0, x1 = self.b
        self.g = (np.exp(-((Xu - cx) ** 2 + (Yu - cy) ** 2) / (2 * r * r)) * self.mask(ctx)[y0:y1, x0:x1])[..., None].astype(np.float32)

    def mask(self, ctx):
        # A broad light that only brightens and dims is no motion: with `calm: false` it also breathes under the
        # calm areas, so they do not show as unlit rectangles; still areas stay still either way.
        return ctx.still if self.cfg.get('calm', True) is False else ctx.allowed

    def prepare(self):
        pass

    def render(self, frame, t):
        c = self.cfg
        if 'freqs' in c:   # a flame's glow: brighter and dimmer than painted, irregularly, zero at t = 0
            ph = c.get('phases', [0.3, 1.9, 4.1, 5.3])
            k = c.get('amp', 0.1) * sum(w * osc(t, n, ph[i % len(ph)]) for i, (n, w) in enumerate(c['freqs']))
        else:
            k = c.get('amp', 0.1) * (1 - math.cos(TAU * c.get('cycles', 1) * t)) / 2
        y0, y1, x0, x1 = self.b
        region = frame[y0:y1, x0:x1]
        if 'ref' in c:   # strengthen or weaken the painted halo itself: its light above the dark around it
            region += (region - np.array(c['ref'], np.float32)).clip(0, None) * (self.g * k)
            return
        col = np.array(c.get('color', [255, 244, 220]), np.float32)
        region += (col - region) * (self.g * k)


class Fireflies:
    """Extra soft warm lights drifting on closed paths over the grass; dark at the loop's start."""
    def __init__(self, cfg, ctx):
        self.cfg, self.ctx = cfg, ctx
        self.items = cfg['items']
        self.col = np.array(cfg.get('color', [255, 206, 120]), np.float32)

    def prepare(self):
        pass

    def render(self, frame, t):
        ctx, c, s = self.ctx, self.cfg, self.ctx.s
        core, halo, st = c.get('core', 0.55), c.get('halo', 2.6), c.get('strength', 0.85)
        R = halo * 3
        for it in self.items:
            cx, cy = it['c']; ax, ay = it.get('a', [8, 3]); nx, ny = it.get('n', [1, 2]); p1, p2 = it.get('phase', [0, 0])
            x = cx + ax * math.sin(TAU * nx * t + p1); y = cy + ay * math.sin(TAU * ny * t + p2)
            m = it.get('blink', 1)
            bright = ((1 - math.cos(TAU * m * t + 0.0)) / 2) ** 1.5 * st * it.get('strength', 1.0)
            if bright <= 1e-4:
                continue
            b = ctx.box(x - R, y - R, x + R, y + R)
            y0, y1, x0, x1 = b
            Xu, Yu = ctx.units(b)
            r2 = (Xu - x) ** 2 + (Yu - y) ** 2
            a = bright * (np.exp(-r2 / (2 * core ** 2)) + 0.28 * np.exp(-r2 / (2 * halo ** 2))) * ctx.allowed[y0:y1, x0:x1]
            a = np.clip(a, 0, 1)[..., None]
            region = frame[y0:y1, x0:x1]
            region += (self.col - region) * a


class Birds:
    """A couple of far birds circling slowly, wings beating now and then; they fade in and out of the haze so
    the loop starts and ends on the painting."""
    def __init__(self, cfg, ctx):
        self.cfg, self.ctx, self.items = cfg, ctx, cfg['items']
        self.col = np.array(cfg.get('color', [96, 88, 80]), np.float32)
        self.sky = None
        if 'behind' in cfg:
            # a cloud the birds fly behind: pixels warmer (red minus blue) than the sky of their own row hide them;
            # the clouds are cream and the sky is blue, while their brightness is often alike
            b = ctx.box(*cfg['behind'])
            crop = ctx.base[b[0]:b[1], b[2]:b[3]]
            L = crop[..., 0] - crop[..., 2]
            self.sky = (b, np.minimum(L[:, :3].mean(1), L[:, -3:].mean(1))[:, None])

    def prepare(self):
        pass

    def hidden(self, frame, b):
        """How much of the box `b` is behind the cloud in this frame (0 = open sky, 1 = deep in the cloud)."""
        if self.sky is None:
            return 0
        (cy0, cy1, cx0, cx1), sky = self.sky
        y0, y1, x0, x1 = b
        out = np.zeros((y1 - y0, x1 - x0), np.float32)
        iy0, iy1, ix0, ix1 = max(y0, cy0), min(y1, cy1), max(x0, cx0), min(x1, cx1)
        if iy0 < iy1 and ix0 < ix1:
            L = frame[iy0:iy1, ix0:ix1, 0] - frame[iy0:iy1, ix0:ix1, 2]
            out[iy0 - y0:iy1 - y0, ix0 - x0:ix1 - x0] = smoothstep((L - sky[iy0 - cy0:iy1 - cy0] - self.cfg.get('cloud_min', 4)) / self.cfg.get('cloud_soft', 10))
        return out

    def render(self, frame, t):
        ctx, c, s = self.ctx, self.cfg, self.ctx.s
        fade = c.get('fade', 0.2)
        env = float(smoothstep(t / fade) * smoothstep((1 - t) / fade))
        if env <= 1e-4:
            return
        SS = 4
        for it in self.items:
            cx, cy = it['c']; ax, ay = it.get('a', [24, 6]); n1, n2 = it.get('n', [1, 1]); p1, p2 = it.get('phase', [0, 1.5708])
            x = cx + ax * math.sin(TAU * n1 * t + p1); y = cy + ay * math.sin(TAU * n2 * t + p2)
            vx = ax * n1 * math.cos(TAU * n1 * t + p1)
            span = it.get('span', c.get('span', 3.4)) / 2
            # wings: a beat now and then (a few beats, then a glide), tips up to down
            beat = math.sin(TAU * it.get('flaps', 9) * t + it.get('flap_phase', 0.0))
            glide = 0.5 + 0.5 * math.cos(TAU * it.get('bursts', 2) * t + it.get('burst_phase', 0.0))
            lift = span * (0.18 + 0.32 * beat * glide)
            R = span * 2 + 2
            b = ctx.box(x - R, y - R, x + R, y + R)
            y0, y1, x0, x1 = b
            canvas = np.zeros(((y1 - y0) * SS, (x1 - x0) * SS), np.uint8)
            def P(dx, dy):
                return [((x + dx) * s - x0) * SS, ((y + dy) * s - y0) * SS]
            d = 1 if vx >= 0 else -1                      # the body leans a little toward where it flies
            wing = [P(-span, -lift), P(-span * 0.45, -lift * 0.2 - span * 0.12), P(0.12 * d, 0.1),
                    P(span * 0.45, -lift * 0.2 - span * 0.12), P(span, -lift)]
            pts = np.round(np.asarray(wing) * 16).astype(np.int32)
            th = max(1, int(round(c.get('thickness', 0.42) * s * SS)))
            cv2.polylines(canvas, [pts], False, 255, th, cv2.LINE_AA, shift=4)
            a = cv2.resize(canvas, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
            a = cv2.GaussianBlur(a, (0, 0), c.get('soft', 0.25) * s)
            a = (a * env * c.get('opacity', 0.75) * ctx.allowed[y0:y1, x0:x1] * (1 - self.hidden(frame, b)))[..., None]
            region = frame[y0:y1, x0:x1]
            region += (self.col - region) * a


class Mist:
    """Morning mist in the hollows: soft, long wisps of extra mist (and thinner patches) drift sideways across the
    painted mist. The wisps are a smooth random field; two copies of it slide half a cycle apart and cross-fade, so
    the drift never jumps and the loop closes (at t = 0 the change is zero, so frame 0 is the painting). Only light,
    hazy pixels take part, so trees and figures inside the bands stay as painted."""
    def __init__(self, cfg, ctx):
        self.cfg, self.ctx = cfg, ctx
        s = ctx.s
        m = np.zeros((ctx.H, ctx.W), np.uint8)
        for sh in cfg['regions']:
            fill(m, shape_points(sh), s)
        m = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), cfg.get('feather', 10) * s / 2)
        ys, xs = np.where(m > 0.01)
        self.b = (ys.min(), ys.max() + 1, xs.min(), xs.max() + 1)
        y0, y1, x0, x1 = self.b
        crop = ctx.base[y0:y1, x0:x1]
        L = crop.mean(2); sat = crop.max(2) - crop.min(2)
        haze = smoothstep((L - cfg.get('light_min', 130)) / cfg.get('light_soft', 50)) * smoothstep((cfg.get('sat_max', 70) - sat) / 30)
        self.w0 = (m[y0:y1, x0:x1] * haze).astype(np.float32)
        col = cfg.get('color')
        if col:
            self.col = np.array(col, np.float32)
        else:   # the mist's own colour, a little lighter: its brightest tenth, lifted toward white
            p = np.percentile(crop[self.w0 > 0.5], 90, axis=0).astype(np.float32)
            self.col = p + cfg.get('lift', 0.3) * (255 - p)
        # the wisp field, wider than the box by the drift, long and thin like mist lying in a valley
        self.v = cfg.get('drift', 40) * s
        pad = int(self.v) + 2
        h, w = y1 - y0, x1 - x0 + 2 * pad
        cell = max(4, int(cfg.get('cell', 3) * s))
        rng = np.random.default_rng(cfg.get('seed', 5))
        coarse = rng.standard_normal((h // cell + 3, w // cell + 3)).astype(np.float32)
        field = cv2.resize(coarse, ((w // cell + 3) * cell, (h // cell + 3) * cell), interpolation=cv2.INTER_CUBIC)[:h, :w]
        bx, by = cfg.get('wisp', [18, 3.5])
        field = cv2.GaussianBlur(field, (0, 0), sigmaX=bx * s, sigmaY=by * s)
        self.field = (field - field.mean()) / (field.std() + 1e-6)
        self.pad = pad
        X, Y = np.meshgrid(np.arange(x1 - x0, dtype=np.float32) + pad, np.arange(y1 - y0, dtype=np.float32))
        self.X, self.Y = X, Y

    def prepare(self):
        y0, y1, x0, x1 = self.b
        self.w = (self.w0 * self.ctx.allowed[y0:y1, x0:x1])[..., None]
        self.n0 = self.sample(0.0)

    def sample(self, shift):
        return cv2.remap(self.field, self.X - shift, self.Y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

    def render(self, frame, t):
        rc = self.cfg.get('cycles', 1)
        pa = ((t * rc + 0.5) % 1) - 0.5; wa = 1 - 2 * abs(pa); pb = ((t * rc) % 1) - 0.5
        d = wa * self.sample(self.v * pa) + (1 - wa) * self.sample(self.v * pb) - self.n0
        d = np.clip(d[..., None] * self.cfg.get('amp', 0.12), -0.3, 0.45)
        y0, y1, x0, x1 = self.b
        region = frame[y0:y1, x0:x1]
        region += (self.col - region) * d * self.w


class Wave:
    """Fabric hanging in a band (an awning's hem): a wave travels along it, moving it more toward its free edge."""
    def __init__(self, cfg, ctx):
        self.cfg, self.ctx = cfg, ctx
        x0, y0, x1, y1 = cfg['box']
        self.b = ctx.box(x0, y0, x1, y1)
        self.Xu, self.Yu = ctx.units(self.b)
        g0, g1 = cfg.get('grow', [y0, y1])
        f = cfg.get('feather', 4)
        edge = smoothstep((self.Xu - x0) / f) * smoothstep((x1 - self.Xu) / f) * smoothstep((y1 - self.Yu) / f)
        self.m0 = (np.clip((self.Yu - g0) / (g1 - g0), 0, 1) ** cfg.get('power', 1.5) * edge).astype(np.float32)

    def prepare(self):
        y0, y1, x0, x1 = self.b
        self.m = self.m0 * self.ctx.allowed[y0:y1, x0:x1]

    def displace(self, t, dx, dy):
        c, s = self.cfg, self.ctx.s
        lam = c.get('wave', 60); y0, y1, x0, x1 = self.b
        psi = TAU * self.Xu / lam
        wv = np.zeros_like(self.m)
        for n, w in c.get('cycles', [[1, 1.0], [2, 0.4]]):
            wv += w * (np.sin(TAU * n * t - psi * n) - np.sin(-psi * n))
        ax, ay = c.get('amp', [0.3, 0.8])
        dx[y0:y1, x0:x1] += s * self.m * ax * wv
        dy[y0:y1, x0:x1] += s * self.m * ay * wv
        return [self.b]


EFFECTS = dict(birds=Birds, mist=Mist, wave=Wave, clouds=Clouds, breeze=Breeze, sway=Sway, smoke=Smoke, sails=Sails, glint=Glint,
               flicker=Flicker, glow=Glow, fireflies=Fireflies)


# ---------------------------------------------------------------- loop

def art_dir(arg):
    """The folder the presets' paintings are read from: --art, else DROMOS_ART."""
    art = arg or os.environ.get('DROMOS_ART')
    if not art:
        sys.exit('Pass --art ART_DIR (the folder that holds the paintings, such as the vault\'s Dromos/Arte) or set DROMOS_ART.')
    if not os.path.isdir(art):
        sys.exit(f'--art {art} is not a folder')
    return art


def load_preset(path, art):
    """The preset at `path`, its `src` resolved inside the `art` folder. Presets name files, never paths."""
    with open(path) as f:
        cfg = json.load(f)
    if os.path.isabs(cfg['src']) or os.path.isabs(cfg.get('out', '')):
        sys.exit(f'{path}: `src` and `out` must be file names, not absolute paths')
    cfg['name'] = os.path.splitext(os.path.basename(path))[0]
    cfg['src'] = os.path.normpath(os.path.join(art, cfg['src']))
    if not os.path.exists(cfg['src']):
        sys.exit(f'{path}: the painting {cfg["src"]} does not exist')
    return cfg


def add_art_arg(ap):
    ap.add_argument('--art', default=None, help='folder holding the paintings the presets name (default: $DROMOS_ART)')


def build(cfg, only=None):
    base_img = Image.open(cfg['src']).convert('RGB')
    base = np.asarray(base_img, np.float32).copy()
    ctx = Ctx(base, cfg)
    effects = []
    for e in cfg['effects']:
        if e.get('off') or (only and e['type'] not in only):
            continue
        effects.append(EFFECTS[e['type']](e, ctx))
    for e in effects:
        for (px, py), r in getattr(e, 'pins', []):
            y0, y1, x0, x1 = ctx.box(px - r, py - r, px + r, py + r)
            Xu, Yu = ctx.units((y0, y1, x0, x1))
            ctx.pin[y0:y1, x0:x1] = np.maximum(ctx.pin[y0:y1, x0:x1], smoothstep(1 - np.hypot(Xu - px, Yu - py) / r))
    for e in effects:
        e.prepare()
    return base_img, ctx, effects


def render_full(ctx, effects, t):
    base = ctx.base
    if t == 0:
        return base
    dx = np.zeros((ctx.H, ctx.W), np.float32); dy = np.zeros_like(dx)
    boxes = []
    for e in effects:
        if hasattr(e, 'displace'):
            boxes += e.displace(t, dx, dy)
    frame = base.copy()
    if boxes:
        y0 = min(b[0] for b in boxes); y1 = max(b[1] for b in boxes); x0 = min(b[2] for b in boxes); x1 = max(b[3] for b in boxes)
        X, Y = ctx.grid((y0, y1, x0, x1))
        frame[y0:y1, x0:x1] = cv2.remap(base, X - dx[y0:y1, x0:x1], Y - dy[y0:y1, x0:x1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    for e in effects:
        if hasattr(e, 'sheen'):
            e.sheen(frame, t)
    for e in effects:
        if hasattr(e, 'render'):
            e.render(frame, t)
    return frame


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('preset')
    add_art_arg(ap)
    ap.add_argument('--out-dir', default=None, help="folder to write the preset's `out` into")
    ap.add_argument('--width', type=int)
    ap.add_argument('--fps', type=int)
    ap.add_argument('--seconds', type=float)
    ap.add_argument('--out', help='the video to write (overrides --out-dir)')
    ap.add_argument('--bitrate', default=None)
    ap.add_argument('--crf', type=int, default=None)
    ap.add_argument('--only', default=None, help='comma list of effect types to render')
    ap.add_argument('--frames', default=None, help='only save these loop fractions as PNG at full resolution (no video)')
    ap.add_argument('--keep-frames', action='store_true', help='keep the .mjpeg frames next to the video')
    ap.add_argument('--moves', default=None, help='save the "what moves" map (max abs difference, output size) as .npy')
    args = ap.parse_args()
    cfg = load_preset(args.preset, art_dir(args.art))
    if args.out:
        out = args.out
    elif args.out_dir:
        os.makedirs(args.out_dir, exist_ok=True)
        out = os.path.join(args.out_dir, cfg.get('out', cfg['name'] + '.webm'))
    else:
        sys.exit('Pass --out-dir DIR or --out FILE.webm: the loop is never written next to the painting.')
    W = args.width or cfg.get('width', 1280)
    fps = args.fps or cfg.get('fps', 12)
    secs = args.seconds or cfg.get('seconds', 10)
    only = set(args.only.split(',')) if args.only else None
    base_img, ctx, effects = build(cfg, only)
    if args.frames:
        stem = os.path.splitext(out)[0]
        for fr in args.frames.split(','):
            t = float(fr)
            Image.fromarray(np.clip(np.rint(render_full(ctx, effects, t)), 0, 255).astype(np.uint8)).save(f'{stem}-{fr}.png')
        return
    ff = ffmpeg()   # found before rendering, so a missing ffmpeg fails at once
    Hh = round(W * ctx.H / ctx.W)
    base_lo = np.asarray(base_img.resize((W, Hh), Image.LANCZOS), np.float32)
    n = round(fps * secs)
    enc = cfg.get('encode', {})
    bitrate = args.bitrate or enc.get('bitrate', '900k'); crf = args.crf if args.crf is not None else enc.get('crf', 10)
    # Frames are written as near-lossless 4:4:4 JPEGs into one .mjpeg file next to the output, then encoded:
    # Playwright's ffmpeg builds decode MJPEG but no raw or PNG image pipe.
    frames_path = out + '.mjpeg'
    moves = np.zeros((Hh, W), np.float32)
    with open(frames_path, 'wb') as sink:
        for i in range(n):
            t = i / n
            full = render_full(ctx, effects, t)
            if t == 0:
                lo = base_lo
            else:
                delta = cv2.resize(full - ctx.base, (W, Hh), interpolation=cv2.INTER_AREA)
                lo = base_lo + delta
            lo8 = np.clip(np.rint(lo), 0, 255).astype(np.uint8)
            moves = np.maximum(moves, np.abs(lo8.astype(np.float32) - base_lo).max(2))
            buf = io.BytesIO(); Image.fromarray(lo8).save(buf, 'JPEG', quality=enc.get('jpeg', 97), subsampling=0); sink.write(buf.getvalue())
    cmd = [ff, '-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', str(fps), '-i', 'file:' + frames_path,
           '-vf', 'scale=flags=accurate_rnd+full_chroma_int,format=yuv420p',  # plain rounding darkens by ~1 level
           '-c:v', 'libvpx', '-b:v', bitrate, '-crf', str(crf), '-qmin', '0', '-qmax', str(enc.get('qmax', 40)),
           '-g', str(n), '-keyint_min', str(n), '-auto-alt-ref', '0', '-deadline', 'good', '-cpu-used', '0', '-pix_fmt', 'yuv420p', '-an', out]
    code = subprocess.call(cmd)
    if not args.keep_frames:
        os.remove(frames_path)
    if code != 0:
        sys.exit(f'ffmpeg failed with exit code {code}')
    if args.moves:
        np.save(args.moves, moves)
    print(os.path.basename(out), f'{W}x{Hh}', f'{fps}fps', f'{secs}s', f'{n} frames', 'ffmpeg', code, f'{os.path.getsize(out) // 1024} KB')


if __name__ == '__main__':
    main()
