"""Throwaway local gallery prototype; injects assets into ignored Pelican output only.

Run: .venv/bin/python prototypes/project-gallery/preview.py
View: http://localhost:8765/?variant=D (also A, B and C)
A normal Pelican build removes this prototype from the preview.
"""
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).resolve().parent
OUTPUT = ROOT / "output"

subprocess.run(
    [str(Path(sys.prefix) / "bin" / "pelican"), "content", "-d", "-s", "pelicanconf.py"],
    cwd=ROOT,
    check=True,
)
assets = OUTPUT / "prototype-project-gallery"
assets.mkdir()
for filename in ("gallery.css", "gallery.js"):
    shutil.copy2(SOURCE / filename, assets / filename)
for logo in (SOURCE / "assets").glob("*.svg"):
    shutil.copy2(logo, assets / logo.name)

index = OUTPUT / "index.html"
html = index.read_text()
version = max((SOURCE / name).stat().st_mtime_ns for name in ("gallery.js", "gallery.css"))
html = html.replace(
    "</head>",
    f'    <link rel="stylesheet" href="/prototype-project-gallery/gallery.css?v={version}">\n'
    f'    <script defer src="/prototype-project-gallery/gallery.js?v={version}"></script>\n</head>',
    1,
)
index.write_text(html)
print("Local gallery prototypes: http://localhost:8765/?variant=D (or A, B, C)")
