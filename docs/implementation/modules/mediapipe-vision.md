# MediaPipe Vision Demos

## What It Does

A single-page React application with a dropdown task switcher that lets users run 9 different MediaPipe vision AI tasks in real-time using their device camera. All inference runs client-side via WebAssembly — no server required.

### Supported Tasks

| # | Task | Input | Visual Output |
|---|------|-------|---------------|
| 1 | Face Detection | Live camera | Bounding boxes + keypoints |
| 2 | Face Landmark | Live camera | 478-point face mesh with tessellation, eyes, lips, eyebrows |
| 3 | Hand Landmark | Live camera | 21-point hand skeleton with connections |
| 4 | Gesture Recognition | Live camera | Hand skeleton + gesture label (thumbs up, peace, fist, etc.) |
| 5 | Pose Landmark | Live camera | 33-point body skeleton with connections |
| 6 | Object Detection | Live camera | Bounding boxes + class labels (80+ classes) |
| 7 | Image Classification | Live camera | Top-5 classification labels with confidence scores |
| 8 | Image Segmentation | Live camera | DeepLab v3 category mask overlay (21 Pascal VOC classes) |
| 9 | Interactive Segmentation | Captured frame + click | Click-to-segment with confidence mask overlay |

## Where It Lives

| File | Purpose |
|------|---------|
| `mediapipe.html` | MPA entry point (minimal HTML shell) |
| `src/mediapipe/main.tsx` | React entry — mounts `MediaPipeApp` |
| `src/mediapipe/MediaPipeApp.tsx` | Main component: task switcher, camera viewport, status bar |
| `src/mediapipe/MediaPipeApp.css` | Page styles |
| `src/mediapipe/shared/types.ts` | Task IDs, metadata, model URLs |
| `src/mediapipe/shared/useCamera.ts` | Shared camera stream hook (`getUserMedia`) |
| `src/mediapipe/shared/drawingUtils.ts` | Canvas drawing helpers (boxes, landmarks, connectors, masks, text) |
| `src/mediapipe/tasks/useFaceDetection.ts` | Face detection hook |
| `src/mediapipe/tasks/useFaceLandmark.ts` | Face landmark hook |
| `src/mediapipe/tasks/useHandLandmark.ts` | Hand landmark hook |
| `src/mediapipe/tasks/useGestureRecognition.ts` | Gesture recognition hook |
| `src/mediapipe/tasks/usePoseLandmark.ts` | Pose landmark hook |
| `src/mediapipe/tasks/useObjectDetection.ts` | Object detection hook |
| `src/mediapipe/tasks/useImageClassification.ts` | Image classification hook |
| `src/mediapipe/tasks/useImageSegmentation.ts` | Image segmentation hook |
| `src/mediapipe/tasks/useInteractiveSegmentation.ts` | Interactive segmentation hook |

## Architecture Decisions

### React (not standalone HTML)

Unlike the AR demos (which use standalone HTML due to A-Frame DOM conflicts), MediaPipe tasks work with canvas — no DOM conflict with React. A single React page with a task switcher provides:

- Better UX for expo visitors (one page, no navigation between 9 separate files)
- Shared camera management across tasks
- Clean hook-per-task separation with lazy model loading

### Hook-per-task pattern

Each vision task is encapsulated in a custom hook with a uniform interface:

```typescript
{ init: () => Promise<void>, detect: (video, canvas) => void, cleanup: () => void }
```

- `init()` — Downloads the model and creates the MediaPipe task instance
- `detect()` — Starts the `requestAnimationFrame` detection loop
- `cleanup()` — Cancels the loop and releases the task

### Lazy model loading

Models are only downloaded when the user selects and starts a task. This avoids loading all 9 models (~50MB+ total) on page load.

### Interactive Segmentation exception

This task only supports `IMAGE` running mode (not `VIDEO`). The implementation:
1. Captures a still frame from the camera
2. Displays it on the canvas with `cursor: crosshair`
3. On click, computes normalized coordinates and runs `segment()` with a keypoint
4. Renders a confidence mask overlay with a yellow click indicator

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mediapipe/tasks-vision` | 0.10.32 | All 9 vision tasks + DrawingUtils + WASM runtime |

Models are downloaded at runtime from `storage.googleapis.com/mediapipe-models/`.

WASM runtime is loaded from `cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm`.

## How to Verify

### Development

```bash
npm run dev
# Visit http://localhost:5173/              → navigation hub
# Visit http://localhost:5173/mediapipe.html → MediaPipe vision demos
```

### Production build

```bash
npm run build
# Verify output includes: dist/mediapipe.html
```

### Per-task verification

1. Open `/mediapipe.html`
2. Select a task from the dropdown
3. Click "Start"
4. Wait for model download (first time may take a few seconds)
5. Verify visual output appears on the camera feed:
   - **Face Detection**: Green bounding boxes around faces
   - **Face Landmark**: Mesh tessellation on face
   - **Hand Landmark**: Red dots + green connections on hands
   - **Gesture Recognition**: Hand skeleton + gesture label text
   - **Pose Landmark**: Body skeleton overlay
   - **Object Detection**: Colored bounding boxes with class labels
   - **Image Classification**: Top-5 labels with percentages
   - **Image Segmentation**: Colored overlay with legend
   - **Interactive Segmentation**: Click on captured image → purple mask overlay

## Requirements

- Device with camera access
- HTTPS connection (or localhost for development)
- WebGL and WebRTC support in the browser
- Sufficient bandwidth for initial model download

## Status

Implemented — all 9 vision tasks functional.
