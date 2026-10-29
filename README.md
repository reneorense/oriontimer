# ORION TIMER 2.4 — Interactive 3D Chrono Core

The same horizontal sci-fi chronometer approved in 2.3, now with **interactive 3D inspection**. Designed for ages 10+. Plain HTML, CSS, JavaScript, Three.js r128, GSAP optional; no React, npm, or build step. Compatible with GitHub Pages.

## What's new in 2.4

- Drag the model left, right, up, or down to inspect it (horizontal swipe supported on mobile; regular vertical page scrolling remains available).
- Zoom in and out with the viewer buttons or desktop mouse wheel.
- Tap/click the front timer, end caps, or chassis to see component information (using Three.js `Raycaster`).
- Use **Display / Reactor / Collars / Chassis** buttons to inspect the same components from a phone or keyboard, even if a component is hard to tap in 3D.
- **X-RAY** makes the outer shell more transparent, revealing its internal machine structure.
- **EXPLODE** separates the display and movable mechanical assemblies; **ASSEMBLE** returns them.
- **RESET VIEW** re-centers rotation and zoom. Double-clicking the 3D viewer also resets its view.
- **FULLSCREEN** expands the instrument view on browsers that support the Fullscreen API.
- When focused on the 3D canvas, arrow keys rotate the view, + / - zoom, Escape resets the camera.
- The display remains upright and horizontally oriented: the 3D geometry rotates in inspection mode, but the display is never rolled 90 degrees by the cylinder transformation.
- All interactions remain separate from the timer engine: time presets, Start, Pause, Resume, Reset, and countdown-linked effects remain functional.

## Files changed from 2.3

| File | Change |
|---|---|
| `index.html` | Viewer toolbar, accessible component selectors, inspection text, and version labels |
| `css/style.css` | Interactive control styling, mobile layout, fullscreen presentation |
| `js/three-bg.js` | Hooks the existing 3D model into the new interaction controller |
| `js/chrono-interaction.js` | **New:** 3D raycasting, view movement, zoom, X-ray, exploded view, fullscreen |
| `README.md` | Updated instructions |

The 2.3 3D renderer, shader, countdown engine, and GSAP animations are otherwise preserved.

## How to publish on GitHub Pages

1. Extract this archive.
2. Open your repository on GitHub: `https://github.com/reneorense/oriontimer`.
3. Choose **Add file → Upload files** and upload the **contents** of `ORION-Timer-2.4-Interactive` (not its enclosing folder or ZIP).
4. Check that `index.html` is at the top level, and `css/` and `js/` folders sit alongside it.
5. Commit to a test branch for safety; GitHub Pages usually serves `main`, so merge once ready to publish.
6. After Pages deploys, refresh `https://reneorense.github.io/oriontimer/` or use a private tab to avoid cached JavaScript.

## How to use

- Select a mission preset and press **INITIALIZE** to start the countdown.
- Drag the chrono core to examine its sides; tap parts or press the component buttons for more information.
- Press **X-RAY** to make the chassis transparent; press **EXPLODE** to separate the mechanical components, then **ASSEMBLE** to reconnect them.
- Press **RESET VIEW** to re-center the model.
- Press **FULLSCREEN** to focus on the 3D instrument if your browser supports it.

## Dependencies

- Three.js r128, served from cdnjs (already used by 2.3).
- GSAP 3.12.5, served from cdnjs for smoother animations; interactions fall back to instantaneous state changes if GSAP is not available.
- Original lightweight holographic material shader in `js/hologram-material.js` inspired by general scanline and Fresnel approaches in [Vanilla Three.js Holographic Material](https://github.com/ektogamat/threejs-vanilla-holographic-material). No source code copied from that project.

## Testing / limitations

The files pass JavaScript syntax checks. Headless tests with the WebGL fallback show no horizontal overflow at 390, 768, and 1366px and demonstrate preset selection, countdown start, pause, and reset. Mocked 3D-control tests verify viewer zoom/reset, X-ray, exploded view, and component selection. Actual Three.js rendering and phone GPU performance could not be visually verified in the authoring environment due to blocked external CDN access. Please check the live GitHub Pages build before replacing an approved production version.

The interactive controls are disabled automatically if Three.js or WebGL fails to initialize; a functional 2D timer remains available.
