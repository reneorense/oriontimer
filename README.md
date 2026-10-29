# ORION 2.1 — Cylindrical Holographic Timer

This release intentionally **replaces the previous background-only 3D art** with
an actual 3D wireframe cylindrical timer. The clock digits are rendered to a
CanvasTexture physically attached to a Three.js panel on the cylindrical
chassis. The rotating collars, radial progress bars, internal power core,
wireframe shell, and brackets are modeled in Three.js, not merely drawn as
an unrelated page background.

## How to preview

Open the extracted folder using a local HTTP server, e.g. VS Code Live Server,
or `python -m http.server 8000` and visit `http://localhost:8000/`.

1. The default mission is 05:00. Press **INITIALIZE** to start.
2. Press **PAUSE** and **RESUME** to suspend and continue.
3. Choose 10, 15, or 25 minutes on the mission panel.
4. Drag across the 3D cylinder horizontally to inspect its wireframe depth.
5. Expand **CUSTOM TIME CONFIGURATION** for years/months/weeks/days/hours/minutes/seconds.
6. Reloading the webpage resets to the default 05:00 mission.

## File-by-file changes

| File | Change |
| --- | --- |
| `js/three-bg.js` | **Rewritten:** cylindrical 3D apparatus, mounted texture screen, mechanical bands, glowing wireframe and reactive progress lights. |
| `index.html` | **Redesigned:** core stage is now the dominant middle column; new HUD mission and telemetry panels. The old large 2D reel display was removed from the layout. |
| `css/style.css` | **Rewritten:** mission-control interface with mobile-first breakpoints, responsive canvas size and 2D fallback. |
| `js/main.js` | **Rewritten:** timer engine sends remaining time, progress and status directly to the 3D instrument. Includes readable fallback display. |
| `js/core/engine.js` | Unmodified accurate monotonic timer engine. |
| `js/core/time.js` | Unmodified existing unit calculations. |
| `js/ui/controls.js` | Unmodified original arrow and input controls. |
| `js/audio/sfx.js` | Unmodified original sound effects. |
| `js/ui/reels.js` | Retained for reference, but **not loaded**; the reel-based UI has been superseded by the 3D screen. |

## Dependencies

- Uses the **existing** Three.js r128 CDN tag, with no build tools, no React, no extra libraries.
- Uses Google Fonts (Orbitron and Share Tech Mono) for typography when available.
- The visual 2D CSS cylinder appears if Three.js cannot load or WebGL is unavailable.

## Deploy on GitHub Pages

Keep a backup of your existing `main` branch. Upload the **contents** of this
folder into the repository root (keep `index.html` at root, with `css/` and
`js/` beside it). Ideally test on a separate branch first. GitHub Pages with
**Deploy from branch → main → / (root)** will then serve the new design after
that branch is merged into main.

## Limitations / next steps

- This version has real 3D geometry and physical-screen text; it does not yet use
  external shader libraries, bloom passes, or high-poly models.
- The current Three.js version is loaded from a public CDN, so browser internet
  access is needed for its 3D component. A CSS fallback remains usable offline.
- Real devices and browsers should be tested for 3D performance and legibility.
- Improving WebGL rendering, progress visibility, model detail and audio are
  sensible next milestones after visual sign-off.
