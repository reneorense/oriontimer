# ORION TIMER 2.0 — Starter Build

This is a **starter revision** based on the uploaded ORION TIMER repository. It preserves the original HTML/CSS/JavaScript architecture and Three.js r128 background. No React installation or npm setup is required.

## What's new

- 5, 10, 15 and 25-minute mission presets.
- Mission status and a progress bar above the existing timer.
- A countdown-linked progress arc in the existing Three.js scene.
- A translucent core for additional holographic depth.
- Reduced-motion styling and improved mobile pixel-ratio handling.
- Fixed a bug where START could appear active with a zero-duration timer.

## How to try it

1. Extract the ZIP.
2. Open a terminal in the extracted `oriontimer-main` folder.
3. Run `python -m http.server 8000` (on Windows, `py -m http.server 8000` may work instead).
4. Open `http://localhost:8000` in Chrome.
5. Choose `05 MIN`, click START, and observe the status bar and 3D arc. Try PAUSE and RESET.

The website loads Three.js from the internet via the existing CDN script. For a fully offline or production-ready version, the next phase should pin and bundle dependencies.

## Files modified

- `index.html`: mission panel, presets, and initial disabled Start state.
- `css/style.css`: new HUD panel styling.
- `js/main.js`: status/progress tracking and presets.
- `js/core/engine.js`: `start()` returns whether it actually started.
- `js/three-bg.js`: progress arc, holographic core layer, responsive quality.

## Notes and next-phase issues

- This is a **prototype**, not a full performance/accessibility regression test.
- The existing timer uses approximate months of 30 days and years of 360 days. For ordinary study timers, use minutes/hours.
- The existing reel layout is wide on small screens; redesigning the readout is planned for the next phase.
- Advanced bloom and shader effects are *not* installed yet; they need a modern Three.js import/build setup first.
- Protect your original repository by testing this build in a separate branch.
