# MediaPipe Vision Demos

## What It Does

A single-page React application with a bottom carousel that lets users run 8 different MediaPipe vision AI tasks in real-time using their device camera. Tasks are selected by swiping the carousel until an icon snaps into the center ring; activation begins after a short delay. All inference runs client-side via WebAssembly — no server required.

Includes an optional **broadcast mode** that streams the canvas (video + AI overlay) to the [Control Center](./control-center.md) via WebRTC.

### Supported Tasks

| #   | Task                 | Input       | Visual Output                                                |
| --- | -------------------- | ----------- | ------------------------------------------------------------ |
| 1   | Face Detection       | Live camera | Bounding boxes + keypoints                                   |
| 2   | Hand Landmark        | Live camera | 21-point hand skeleton with connections                      |
| 3   | Gesture Recognition  | Live camera | Hand skeleton + gesture label (thumbs up, peace, fist, etc.) |
| 4   | Pose Landmark        | Live camera | 33-point body skeleton with connections                      |
| 5   | Face Landmark        | Live camera | 478-point face mesh with tessellation, eyes, lips, eyebrows  |
| 6   | Object Detection     | Live camera | Bounding boxes + class labels (80+ classes)                  |
| 7   | Image Classification | Live camera | Top-5 classification labels with confidence scores           |
| 8   | Image Segmentation   | Live camera | DeepLab v3 category mask overlay (21 Pascal VOC classes)     |

## Where It Lives

| File                                            | Purpose                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------ |
| `mediapipe.html`                                | MPA entry point (minimal HTML shell)                                     |
| `src/mediapipe/main.tsx`                        | React entry — mounts `MediaPipeApp`                                      |
| `src/mediapipe/MediaPipeApp.tsx`                | Main component: viewport, overlays, carousel, record ring, action floats |
| `src/mediapipe/MediaPipeApp.css`                | Page styles (top bar, status pill, record ring, action floats)           |
| `src/mediapipe/TaskCarousel.tsx`                | Horizontal carousel with snap + delayed activation                       |
| `src/mediapipe/TaskCarousel.css`                | Carousel layout, circular items, snap styles                             |
| `src/mediapipe/shared/types.ts`                 | Task IDs, metadata, model URLs                                           |
| `src/mediapipe/shared/useCamera.ts`             | Shared camera stream hook (`getUserMedia`)                               |
| `src/mediapipe/shared/useBroadcast.ts`          | WebRTC broadcast hook (signaling + peer management)                      |
| `src/mediapipe/shared/drawingUtils.ts`          | Canvas drawing helpers (boxes, landmarks, connectors, masks, text)       |
| `src/mediapipe/shared/visionWasm.ts`            | Cached MediaPipe WASM fileset loader                                     |
| `src/mediapipe/shared/visionLoop.ts`            | Shared requestAnimationFrame loop for video tasks                        |
| `src/mediapipe/tasks/useFaceDetection.ts`       | Face detection hook                                                      |
| `src/mediapipe/tasks/useFaceLandmark.ts`        | Face landmark hook                                                       |
| `src/mediapipe/tasks/useHandLandmark.ts`        | Hand landmark hook                                                       |
| `src/mediapipe/tasks/useGestureRecognition.ts`  | Gesture recognition hook                                                 |
| `src/mediapipe/tasks/usePoseLandmark.ts`        | Pose landmark hook                                                       |
| `src/mediapipe/tasks/useObjectDetection.ts`     | Object detection hook                                                    |
| `src/mediapipe/tasks/useImageClassification.ts` | Image classification hook                                                |
| `src/mediapipe/tasks/useImageSegmentation.ts`   | Image segmentation hook                                                  |

## Architecture Decisions

### React (not standalone HTML)

Unlike the AR demos (which use standalone HTML due to A-Frame DOM conflicts), MediaPipe tasks work with canvas — no DOM conflict with React. A single React page with task buttons provides:

- Better UX for expo visitors (one page, no navigation between 8 separate files)
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

Models are only downloaded when the user selects a task in the carousel. This avoids loading all 8 models (~50MB+ total) on page load.

The MediaPipe WASM fileset is cached after first use and reused across tasks to avoid repeated downloads.

### Camera reuse on task switch

Switching between tasks keeps the camera stream alive. Only the task loop and model instance are restarted, which avoids the visible camera reload flicker.

### Broadcast mode (integrated publisher)

Broadcasting is a toggle inside `MediaPipeApp` — not a separate page. When a task is running, the user can tap the record ring to:

1. Capture the canvas stream at 15 fps via `canvas.captureStream(15)`
2. Connect to the signaling server as a `publisher`
3. Respond to SDP offers from viewers with WebRTC answers
4. Display a "🔴 EN VIVO" indicator with viewer count

The `useBroadcast` hook handles signaling and peer connection lifecycle. See [Control Center docs](./control-center.md) for the full architecture.

## Dependencies

| Package                   | Version | Purpose                                          |
| ------------------------- | ------- | ------------------------------------------------ |
| `@mediapipe/tasks-vision` | 0.10.32 | All 8 vision tasks + DrawingUtils + WASM runtime |

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
2. Swipe the carousel until a task icon snaps into the center ring (activation starts after a short delay)
3. Wait for model download (first time may take a few seconds)
4. Verify visual output appears on the camera feed:
   - **Face Detection**: Green bounding boxes around faces
   - **Face Landmark**: Mesh tessellation on face
   - **Hand Landmark**: Red dots + green connections on hands
   - **Gesture Recognition**: Hand skeleton + gesture label text
   - **Pose Landmark**: Body skeleton overlay
   - **Object Detection**: Colored bounding boxes with class labels
   - **Image Classification**: Top-5 labels with percentages
   - **Image Segmentation**: Colored overlay with legend

### Broadcast verification

1. Start the signaling server: `npm run dev:signaling`
2. Open `/mediapipe.html`, start any task
3. Tap the record ring → should see "🔴 EN VIVO"
4. Open `/control-center.html` in another tab → publisher should appear

## Requirements

- Device with camera access
- HTTPS connection (or localhost for development)
- WebGL and WebRTC support in the browser
- Sufficient bandwidth for initial model download

## Status

Implemented — all 8 vision tasks functional, with optional WebRTC broadcast mode.
