# ORION TIMER 2.3 — Holographic Horizontal Chrono Core

A sci-fi countdown instrument designed for ages 10+. Built with plain HTML, CSS, JavaScript and Three.js, hosted as a static website on GitHub Pages. **No build tools, React, or installation required.**

## What changed in 2.3

- Corrected the orientation error in 2.2. The cylinder is physically horizontal while the **countdown screen remains upright**, attached to the same overall 3D instrument. The display is no longer a child of the rotated machinery group.
- Reworked the wireframe cylinder: mechanical rings, strengthened end caps, axial braces, helical conductors, inner reactor, animated internal particles, and segmented charge lamps.
- Added `js/hologram-material.js` — an **original** lightweight GLSL shader implementing Fresnel edge illumination and moving scanlines. It follows techniques demonstrated by the MIT-licensed [Vanilla Three.js Holographic Material project](https://github.com/ektogamat/threejs-vanilla-holographic-material); it is not a verbatim copy of their material.
- Added `js/chrono-animations.js` — motion controller using [GSAP](https://github.com/greensock/GSAP) when available, for initialization flash, clamping mechanisms, screen pulses, and state changes.
- Added a lightweight soft halo using a radial gradient texture (avoids heavy post-processing on phones).
- Made the last **10 seconds** use amber warning lighting, rather than the last 10% of the mission.
- Reduced the frequency of expensive countdown display texture updates.
- Improved the CSS-only horizontal fallback for browsers where Three.js or WebGL is unavailable.

## Getting started

1. Unzip the archive. Open the folder containing `index.html`.
2. To preview locally, use VS Code + Live Server, or run `python -m http.server 8000` from that folder.
3. Open `http://localhost:8000` in Chrome. The default mission is 05:00.
4. Select a preset, then test **INITIALIZE / PAUSE / RESUME / RESET**.
5. Drag the main 3D device left/right to inspect its side, without rolling the digits.
6. At the final 10 seconds, the lighting shifts to amber.

## Upload to GitHub Pages

1. Keep your current 2.2 version in GitHub history (or use a new branch).
2. Extract the ZIP and upload **its contents**, not the ZIP itself, into your repository root.
3. Make sure `index.html` is at the root and `css/` and `js/` are beside it.
4. Commit the changes; when the GitHub Pages deployment finishes, refresh your browser (a private tab avoids cached files).

## Important files

| File | Purpose |
|---|---|
| `index.html` | Loads scripts in dependency order; mission and telemetry interface |
| `js/three-bg.js` | **New horizontal 3D machine and upright screen** |
| `js/hologram-material.js` | Custom holographic shader using the existing global THREE |
| `js/chrono-animations.js` | GSAP-powered state transitions with no-GSAP fallback |
| `js/main.js` | Existing countdown integration and timer controls |
| `js/core/engine.js` | Existing timer engine, unchanged |
| `css/style.css` | Mobile layout and fallback styling |

## External dependencies

- `three.js` r128 from cdnjs (previously used in 2.2).
- `GSAP` 3.12.5 from cdnjs (new in 2.3; **optional**: the timer and 3D animation still function without GSAP, but cinematic transitions are simpler).
- Google Fonts (optional; local monospace fallbacks work).

**Internet access is needed for the WebGL 3D library CDN.** If loading Three.js fails, the CSS-only horizontal timer is shown and the actual countdown controls still work. The custom shader and motion controller files are included with the project.

## Validation status

Basic JavaScript syntax and 2D-mode browser interaction tests can be run locally. The environment used to generate this package cannot fetch the external Three.js CDN, so WebGL geometry, shader compilation, and GPU performance require real-browser testing after publishing on GitHub Pages. Do not treat the 3D appearance as visually signed off until you have tested it on your phone.

## External repositories used as references

- [Vanilla Three.js Holographic Material](https://github.com/ektogamat/threejs-vanilla-holographic-material) (MIT) — conceptual reference for hologram Fresnel, scanline and animated signal effects.
- [GSAP](https://github.com/greensock/GSAP) — actual client-side animation engine loaded through cdnjs.

This is not a production-ready replacement for 2.2 until you confirm the 3D render on your device. Deploy to a test branch or keep your previous commit available for rollback.
