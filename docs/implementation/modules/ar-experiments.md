# AR Experiments

## What It Does

Two standalone AR demo pages that serve as base configurations for augmented reality integration:

1. **AR.js Marker Tracking** — Detects a Hiro marker via the device camera and renders a rotating 3D box anchored to the marker.
2. **MindAR Image Tracking** — Detects a natural card image via the device camera and overlays a 3D model with animation.

Both pages launch the device camera, run AR detection, and render 3D content in real-time.

## Where It Lives

| File | Purpose |
|------|---------|
| `arjs.html` | AR.js marker-based demo (standalone HTML) |
| `mindar.html` | MindAR image-tracking demo (standalone HTML) |
| `vite.config.ts` | MPA build config — registers both pages as entry points |
| `src/App.tsx` | Navigation hub with links to both AR pages |
| `src/App.css` | Card grid layout for the navigation hub |

## Architecture Decision

AR pages are **standalone HTML files** (not React components) because:

- AR.js and MindAR both manage the DOM via A-Frame's `<a-scene>` element
- React's reconciliation would conflict with A-Frame's scene graph
- CDN-loaded scripts avoid bundle bloat (zero npm dependencies added)
- Each page is ~30-40 lines of HTML — trivial to maintain

## External Dependencies (CDN only)

| Library | Version | CDN URL |
|---------|---------|---------|
| A-Frame | 1.6.0 | `https://aframe.io/releases/1.6.0/aframe.min.js` |
| AR.js | 3.4.7 | `https://raw.githack.com/AR-js-org/AR.js/3.4.7/aframe/build/aframe-ar.js` |
| MindAR | 1.2.5 | `https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js` |

**No npm packages were added.** All AR libraries are loaded from CDN at runtime.

## How to Verify

### Development

```bash
npm run dev
# Visit http://localhost:5173/         → navigation hub
# Visit http://localhost:5173/arjs.html  → AR.js demo
# Visit http://localhost:5173/mindar.html → MindAR demo
```

### Production build

```bash
npm run build
# Verify output includes: dist/index.html, dist/arjs.html, dist/mindar.html
```

### AR.js verification

1. Open `/arjs.html` on a device with a camera (HTTPS required)
2. Print or display the [Hiro marker](https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png) on screen
3. Point camera at the marker → a rotating indigo box should appear

### MindAR verification

1. Open `/mindar.html` on a device with a camera (HTTPS required)
2. Display the [MindAR card image](https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.png)
3. Point camera at the card → a card overlay and animated 3D model should appear

## Requirements

- Device with camera access
- HTTPS connection (or localhost for development)
- WebGL and WebRTC support in the browser

## Status

Implemented — base configurations ready for customization.
