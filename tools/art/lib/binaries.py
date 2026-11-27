"""Finds the programs the Python art tools run, with no path tied to one machine.

Each program can be named by an environment variable. Otherwise it is looked up on PATH, and ffmpeg also
among the builds Playwright downloads (its own Chromium video recorder), keeping the first that can do
what the tools need.
"""
import glob
import os
import re
import shutil
import subprocess
import sys


def _playwright_dirs():
    dirs = []
    if os.environ.get('PLAYWRIGHT_BROWSERS_PATH'):
        dirs.append(os.environ['PLAYWRIGHT_BROWSERS_PATH'])
    home = os.path.expanduser('~')
    dirs.append(os.path.join(home, '.cache', 'ms-playwright'))              # Linux
    dirs.append(os.path.join(home, 'Library', 'Caches', 'ms-playwright'))   # macOS
    if os.environ.get('LOCALAPPDATA'):
        dirs.append(os.path.join(os.environ['LOCALAPPDATA'], 'ms-playwright'))  # Windows
    return dirs


def _lists(path, flag):
    try:
        return subprocess.run([path, '-hide_banner', flag], capture_output=True, text=True, timeout=30).stdout
    except (OSError, subprocess.SubprocessError):
        return ''


def _can_vp8(path):
    """True when this ffmpeg encodes VP8 with libvpx, decodes VP8 and writes PNG: motion.py and sheet.py need all three.
    Some Playwright builds only have VP9, so each candidate is asked."""
    enc, dec = _lists(path, '-encoders'), _lists(path, '-decoders')
    return bool(re.search(r'^\s*V\S*\s+libvpx\s', enc, re.M)
                and re.search(r'^\s*V\S*\s+(libvpx|vp8)\s', dec, re.M)
                and re.search(r'^\s*V\S*\s+png\s', enc, re.M))


_found = {}


def ffmpeg():
    """FFMPEG, else `ffmpeg` on PATH, else the newest Playwright ffmpeg build that has libvpx (VP8)."""
    if 'ffmpeg' in _found:
        return _found['ffmpeg']
    env = os.environ.get('FFMPEG')
    if env:
        candidates = [env]
    else:
        candidates = [p for p in [shutil.which('ffmpeg')] if p]
        candidates += sorted((p for d in _playwright_dirs() for p in glob.glob(os.path.join(d, 'ffmpeg-*', 'ffmpeg-*'))), reverse=True)
    for path in candidates:
        if _can_vp8(path):
            _found['ffmpeg'] = path
            return path
    if env:
        sys.exit(f'FFMPEG={env} cannot encode and decode VP8 with libvpx, or cannot write PNG.')
    sys.exit('No ffmpeg with libvpx (VP8) found on PATH or among Playwright\'s ffmpeg builds. '
             'Install one (for example your system\'s ffmpeg package) or set FFMPEG=/path/to/ffmpeg.')


def cwebp():
    """CWEBP, else `cwebp` on PATH (libwebp's command-line tools)."""
    path = os.environ.get('CWEBP') or shutil.which('cwebp')
    if not path or not os.path.exists(path):
        sys.exit('cwebp not found: install libwebp\'s tools (the `webp` package) or set CWEBP=/path/to/cwebp.')
    return path
