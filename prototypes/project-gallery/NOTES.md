# Project gallery prototype — local only

Question: Can logos, category navigation, and a scrollable project presentation fit the site's quiet visual design?

Current decision: **D (stacked, momentum-based scroll deck)** is the working direction. **A (horizontal gallery)** is the preferred alternative and remains available for comparison. B and C were explored but are not the current favorites. This is a prototype, not approved for publication or final integration.

Run from the repository root: `.venv/bin/python prototypes/project-gallery/preview.py`, then open `http://localhost:8765/` (D by default) or `?variant=A`.

The preview script injects only into ignored Pelican output; no production template, content, or stylesheet is modified. Project cards beyond those already on the site are candidate selections to confirm before any production implementation.
