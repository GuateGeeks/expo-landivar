# AR Experiments

## What It Does

Four standalone AR demo pages that serve as base configurations for augmented reality integration:

1. **AR.js Marker Tracking** — Detects a Hiro marker via the device camera and renders a rotating 3D box anchored to the marker.
2. **AR.js Markerless Placement** — Places the Magnemite model in front of the camera with a tap (no marker, no surface hit-test).
3. **WebXR Surface Placement** — Uses WebXR immersive AR to place the Magnemite model on a virtual ground plane with a reticle and tap-to-place control.
4. **MindAR Image Tracking** — Detects a natural card image via the device camera and overlays a 3D model with animation.

All pages launch the device camera, run AR detection or placement logic, and render 3D content in real-time. The overlays are tuned for mobile: safe-area padding, tap-target sizing, and `viewport-fit=cover`.

## Where It Lives

| File                   | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `arjs.html`            | AR.js marker-based demo (standalone HTML)             |
| `arjs-placement.html`  | AR.js markerless placement demo (standalone HTML)     |
| `webxr-placement.html` | WebXR placement demo (standalone HTML)                |
| `mindar.html`          | MindAR image-tracking demo (standalone HTML)          |
| `vite.config.ts`       | MPA build config — registers AR pages as entry points |
| `src/App.tsx`          | Navigation hub with links to all AR pages             |
| `src/App.css`          | Card grid layout for the navigation hub               |

## Architecture Decision

AR pages are **standalone HTML files** (not React components) because:

- AR.js and MindAR both manage the DOM via A-Frame's `<a-scene>` element
- React's reconciliation would conflict with A-Frame's scene graph
- CDN-loaded scripts avoid bundle bloat (zero npm dependencies added)
- Each page is small and focused — trivial to maintain

## External Dependencies (CDN only)

| Library | Version | CDN URL                                                                       |
| ------- | ------- | ----------------------------------------------------------------------------- |
| A-Frame | 1.6.0   | `https://aframe.io/releases/1.6.0/aframe.min.js`                              |
| AR.js   | 3.4.7   | `https://raw.githack.com/AR-js-org/AR.js/3.4.7/aframe/build/aframe-ar.js`     |
| MindAR  | 1.2.5   | `https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js` |

**No npm packages were added.** All AR libraries are loaded from CDN at runtime.

## Mobile-First Notes

- `viewport-fit=cover` enables safe-area insets on notch devices.
- Overlay padding includes `env(safe-area-inset-*)` to avoid UI overlap.
- Back link tap target is at least 44px tall.
- `touch-action: manipulation` reduces accidental zoom on mobile.

## How to Verify

### Development

```bash
npm run dev
# Visit http://localhost:5173/         → navigation hub
# Visit http://localhost:5173/arjs.html             → AR.js marker demo
# Visit http://localhost:5173/arjs-placement.html   → AR.js markerless placement
# Visit http://localhost:5173/webxr-placement.html  → WebXR placement
# Visit http://localhost:5173/mindar.html           → MindAR demo
```

### Production build

```bash
npm run build
# Verify output includes: dist/index.html, dist/arjs.html, dist/arjs-placement.html,
# dist/webxr-placement.html, dist/mindar.html
```

### AR.js verification

1. Open `/arjs.html` on a device with a camera (HTTPS required)
2. Print or display the [Hiro marker](https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png) on screen
3. Point camera at the marker → a rotating indigo box should appear

### AR.js markerless placement

1. Open `/arjs-placement.html` on a device with a camera (HTTPS required)
2. Tap **Place** → Magnemite appears in front of the camera
3. Tap **Reset** → Magnemite hides and can be placed again

### WebXR placement

1. Open `/webxr-placement.html` on a WebXR-capable device (HTTPS required)
2. Tap **Start AR** and grant camera permissions
3. Move the device until the reticle appears
4. Tap **Place** → Magnemite appears on the virtual ground plane

### MindAR verification

1. Open `/mindar.html` on a device with a camera (HTTPS required)
2. Display the [MindAR card image](https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.png)
3. Point camera at the card → a card overlay and animated 3D model should appear

## Requirements

- Device with camera access
- HTTPS connection (or localhost for development)
- WebGL support in the browser
- WebXR support for `/webxr-placement.html`

## Status

Implemented — base configurations ready for customization.
