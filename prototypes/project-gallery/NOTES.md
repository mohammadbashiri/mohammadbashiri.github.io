# Project deck prototype — local only

Current direction: a stacked, momentum-based project deck. Earlier gallery layouts (A/B/C) were explored, then discarded in favor of this single design. The project selection remains provisional; this prototype is not approved for publication or final integration.

Run from the repository root: `.venv/bin/python prototypes/project-gallery/preview.py`, then open `http://localhost:8765/`.

The preview script injects only into ignored Pelican output; no production template, content, or stylesheet is modified. Project cards beyond those already on the site are candidate selections to confirm before any production implementation.

The LAMINR wordmark in `assets/laminr.svg` comes from [its official logo](https://github.com/sinzlab/laminr/blob/main/assets/logo.svg).
