# AR Experiments

## What It Does

Six standalone AR demo pages that serve as base configurations for augmented reality integration:

1. **AR.js-next Marker Tracking** — Uses the AR.js-next ECS engine with ARToolKit WASM worker and Three.js renderer to detect a Hiro marker via the device camera and render a rotating Landivar GLB model anchored to it. Auto-starts on page load (no buttons).
2. **A-Frame Markerless Placement** — Uses the device camera as a video background and places the Magnemite model relative to the camera with a slow auto-rotation (no marker, no surface hit-test).
3. **WebXR Surface Placement** — Uses WebXR immersive AR hit-test to place the Magnemite model on detected surfaces with a reticle, tap-to-place, drag-to-move, and reset controls. AR session auto-starts on page load.
4. **MindAR Pokemon Cards** — Multi-target image tracking for Pokemon cards with per-card 3D overlays.
5. **MindAR Interactive Book (starter)** — Starter image-tracking scene for book-page targets.
6. **MindAR Business Card** — Image-tracking scene with a spinning Landivar GLTF logo, tuned lighting, and target-anchored 3D link buttons.

All pages launch the device camera, run AR detection or placement logic, and render 3D content in real-time. The overlays are tuned for mobile: safe-area padding, tap-target sizing, and `viewport-fit=cover`.

## Where It Lives

| File                                                  | Purpose                                                                           |
| ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| `arjs.html`                                           | AR.js-next marker-based demo (standalone HTML + Three.js)                         |
| `aframe-placement.html`                               | A-Frame markerless placement demo (standalone HTML)                               |
| `webxr-placement.html`                                | WebXR placement demo (standalone HTML)                                            |
| `mindar.html`                                         | Legacy compatibility route that redirects to `ar/pokemon-cards.html`              |
| `ar/index.html`                                       | AR menu route with links to all AR experiences                                    |
| `ar/pokemon-cards.html`                               | MindAR Pokemon cards demo (standalone HTML)                                       |
| `ar/interactive-book.html`                            | MindAR interactive-book starter (standalone HTML)                                 |
| `ar/business-card.html`                               | MindAR business-card spinning logo + in-scene link buttons demo (standalone HTML) |
| `public/assets/vendor/arjs-next/data/camera_para.dat` | ARToolKit camera parameters (binary, ~176 bytes)                                  |
| `public/assets/vendor/arjs-next/data/patt.hiro`       | Hiro marker pattern file (~12 KB)                                                 |
| `vite.config.ts`                                      | MPA build config — registers AR pages as entry points                             |
| `src/App.tsx`                                         | Navigation hub with links to all AR pages                                         |
| `src/App.css`                                         | Card grid layout for the navigation hub                                           |

## Architecture Decisions

### Standalone HTML files (not React)

AR pages are **standalone HTML files** because:

- A-Frame and MindAR manage the DOM via `<a-scene>` — conflicts with React reconciliation
- AR.js-next uses imperative Three.js — no React benefit for a single-page canvas app
- CDN-loaded scripts avoid bundle bloat (zero npm dependencies added)
- Each page is small and focused — trivial to maintain

### AR.js-next (arjs.html)

The marker tracking page uses the **AR.js-next ecosystem** — a modern rewrite of AR.js using an ECS (Entity Component System) architecture with WASM-based marker detection:

- **Engine + plugins** — `Engine` orchestrates `CaptureSystem` (webcam), `FramePumpSystem` (frame loop), `ArtoolkitPlugin` (WASM marker detection), and `ThreeJSRendererPlugin` (Three.js rendering)
- **Import map** — The `ThreeJSRendererPlugin` CDN bundle does `import * as t from "three"` internally. A `<script type="importmap">` resolves this bare specifier to the Three.js CDN URL at browser runtime.
- **Auto-start** — No buttons. The page bootstraps the engine, starts the webcam, and loads the marker pattern automatically for expo UX.
- **Data files in `public/`** — `camera_para.dat` and `patt.hiro` are binary files not available via CDN. They are copied from `arjs-plugin-threejs/examples/minimal/data/` and served from `public/assets/vendor/arjs-next/data/`.
- **Event bridge** — `ar:getMarker` events are bridged to `ar:marker` for the ThreeJSRendererPlugin's anchor system. Content (rotating cube) is added to anchors on first detection.

## External Dependencies (CDN only)

### AR.js-next page (`arjs.html`)

| Package                            | Version | CDN URL                                                                                                |
| ---------------------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `@ar-js-org/ar.js-next`            | 0.2.0   | `https://cdn.jsdelivr.net/npm/@ar-js-org/ar.js-next@0.2.0/dist/arjs-core.mjs`                          |
| `@ar-js-org/arjs-plugin-artoolkit` | 0.1.3   | `https://cdn.jsdelivr.net/npm/@ar-js-org/arjs-plugin-artoolkit@0.1.3/dist/arjs-plugin-artoolkit.es.js` |
| `@ar-js-org/arjs-plugin-threejs`   | 0.1.1   | `https://cdn.jsdelivr.net/npm/@ar-js-org/arjs-plugin-threejs@0.1.1/dist/arjs-plugin-threejs.mjs`       |
| Three.js                           | 0.182.0 | `https://unpkg.com/three@0.182.0/build/three.module.js`                                                |

### Other AR pages

| Library | Version | CDN URL                                                                       |
| ------- | ------- | ----------------------------------------------------------------------------- |
| A-Frame | 1.6.0   | `https://aframe.io/releases/1.6.0/aframe.min.js`                              |
| MindAR  | 1.2.5   | `https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js` |

**No npm packages were added.** All AR libraries are loaded from CDN at runtime. Only binary data files (`camera_para.dat`, `patt.hiro`) are committed to `public/`.

## Mobile-First Notes

- `viewport-fit=cover` enables safe-area insets on notch devices.
- Overlay padding includes `env(safe-area-inset-*)` to avoid UI overlap.
- Back link tap target is at least 44px tall.
- `touch-action: manipulation` reduces accidental zoom on mobile.
- Glass effect (`backdrop-filter: blur(6px)`) on overlays and status pill.

## How to Verify

### Development

```bash
npm run dev
# Visit http://localhost:5173/                      → navigation hub
# Visit http://localhost:5173/arjs.html             → AR.js-next marker demo
# Visit http://localhost:5173/aframe-placement.html → A-Frame markerless placement
# Visit http://localhost:5173/webxr-placement.html  → WebXR placement
# Visit http://localhost:5173/ar/index.html         → AR route menu
# Visit http://localhost:5173/ar/pokemon-cards.html   → MindAR Pokemon Cards
# Visit http://localhost:5173/ar/interactive-book.html → MindAR Interactive Book (starter)
# Visit http://localhost:5173/ar/business-card.html    → MindAR Business Card (spinning logo)
```

### Production build

```bash
npm run build
# Verify output includes:
#   dist/index.html
#   dist/arjs.html
#   dist/aframe-placement.html
#   dist/webxr-placement.html
#   dist/mindar.html
#   dist/ar/index.html
#   dist/ar/pokemon-cards.html
#   dist/ar/interactive-book.html
#   dist/ar/business-card.html
#   dist/vendor/arjs-next/data/camera_para.dat
#   dist/vendor/arjs-next/data/patt.hiro
```

### AR.js-next verification

1. Open `/arjs.html` on a device with a camera (HTTPS required)
2. Wait for status pill to show "Ready — show the Hiro marker"
3. Print or display the [Hiro marker](https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png) on screen
4. Point camera at the marker → the Landivar model should appear anchored to the marker and rotate
5. The status pill hides once content is detected

### A-Frame markerless placement

1. Open `/aframe-placement.html` on a device with a camera (HTTPS required)
2. Tap **Place** → Magnemite appears in front of the camera and slowly spins
3. Tap **Reset** → Magnemite hides and can be placed again

### WebXR placement

1. Open `/webxr-placement.html` on a WebXR-capable device (HTTPS required)
2. AR session auto-starts (tap **Start AR** as fallback if needed)
3. Move the device until the teal reticle appears on the floor
4. Tap **Place** → Magnemite appears floating above the reticle (~16cm scale)
5. Touch and drag on the screen → model follows the reticle to a new position
6. Release → model stays at the new position
7. Tap **Reset** → model disappears, scan and place again

### MindAR Pokemon cards verification

1. Open `/ar/pokemon-cards.html` on a device with a camera (HTTPS required)
2. Display the [MindAR card image](https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.png)
3. Point camera at the card → a card overlay and animated 3D model should appear

### MindAR interactive-book starter verification

1. Open `/ar/interactive-book.html`
2. Confirm camera session opens and an overlay appears when a known image target is detected
3. Replace `imageTargetSrc` and associated overlays with project-specific targets/assets

### MindAR business-card verification

1. Open `/ar/business-card.html` on a device with a camera (HTTPS required)
2. Show the Landivar business-card target image to the camera
3. Confirm the GLTF logo appears and continuously spins in place
4. Confirm three floating in-scene link buttons appear only while the target is tracked
5. Tap each button and confirm it opens:
   - `https://principal.url.edu.gt/`
   - `https://www.facebook.com/UniversidadRafaelLandivar/`
   - `https://www.instagram.com/u_landivar/`

## Requirements

- Device with camera access
- HTTPS connection (or localhost for development)
- WebGL support in the browser
- WebXR support for `/webxr-placement.html`

## Status

Implemented — AR.js, A-Frame markerless, WebXR, and MindAR Pokemon cards are functional. Interactive-book is a starter template; business-card includes a spinning GLTF logo and target-aware in-scene link buttons.

### Not Yet Implemented

- TURN server support for restrictive NATs
