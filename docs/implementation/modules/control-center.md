# Control Center (WebRTC Multi-User Viewer)

## What It Does

A centralized viewer page that displays live video streams from connected MediaPipe publishers. Each publisher runs MediaPipe locally on their device and broadcasts their canvas (video + AI overlay) via WebRTC. The Control Center subscribes to all publisher streams and displays them in a responsive tile grid.

### Architecture

```
Publisher (MediaPipeApp)          Signaling Server         Control Center
/mediapipe.html                   server/signaling.ts      /control-center.html
                                  
camera → MediaPipe → canvas  ──► WebSocket HELLO ──────►  WebSocket HELLO
canvas.captureStream(15)         (role: publisher)         (role: viewer)
                                                           
                              ◄── SDP_OFFER ◄──────────── createOffer()
setRemoteDescription()                                     
createAnswer() ──────────────►── SDP_ANSWER ──────────►   setRemoteDescription()
                                                           
ICE_CANDIDATE ◄──────────────►── ICE_CANDIDATE ──────►   ontrack → <video>
```

### Key Design Decisions

- **Integrated publisher** — Broadcasting is a toggle inside the existing `MediaPipeApp`, reusing all 9 task hooks and the shared camera/canvas. No separate publisher page.
- **WebRTC P2P mesh (MVP)** — Each viewer creates a peer connection per publisher. Suitable for ≤6 simultaneous publishers. For larger scale, swap to an SFU (LiveKit/mediasoup).
- **Canvas captureStream** — The published stream includes the AI overlay baked into the video. The Control Center doesn't need to re-implement any MediaPipe logic.
- **Separate MPA entry** — `control-center.html` is its own Vite MPA entry point, consistent with the AR and MediaPipe pages.

## Where It Lives

### Infrastructure (signaling)

| File | Purpose |
|------|---------|
| `src/infrastructure/signaling/types.ts` | `SignalMessage` discriminated union, `Role` type |
| `src/infrastructure/signaling/SignalingClient.ts` | WebSocket client with auto-reconnect (exponential backoff) |
| `src/infrastructure/signaling/index.ts` | Public module exports |

### Shared utilities

| File | Purpose |
|------|---------|
| `src/shared/webrtc/rtcConfig.ts` | Default STUN server configuration |
| `src/shared/webrtc/createPeerConnection.ts` | `RTCPeerConnection` factory |
| `src/shared/webrtc/index.ts` | Public module exports |
| `src/shared/utils/clientId.ts` | Persistent peer identifier via `crypto.randomUUID()` |

### Control Center (viewer)

| File | Purpose |
|------|---------|
| `control-center.html` | MPA entry point |
| `src/control-center/main.tsx` | React entry — mounts `ControlCenterPage` |
| `src/control-center/ControlCenterPage.tsx` | Grid viewer, peer connection management |
| `src/control-center/ControlCenterPage.css` | Tile grid styles, status badges |
| `src/control-center/VideoTile.tsx` | `<video>` component with `srcObject` binding |

### Publisher (broadcast hook)

| File | Purpose |
|------|---------|
| `src/mediapipe/shared/useBroadcast.ts` | Hook: signaling + WebRTC publisher logic |
| `src/mediapipe/MediaPipeApp.tsx` | Updated: broadcast toggle, "EN VIVO" indicator |
| `src/mediapipe/MediaPipeApp.css` | Updated: broadcast control styles |

### Signaling server (development)

| File | Purpose |
|------|---------|
| `server/signaling.ts` | Minimal Node.js WebSocket server (~120 lines) |
| `server/package.json` | Server dependencies (`ws`) |

### Configuration

| File | Purpose |
|------|---------|
| `.env.example` | `VITE_SIGNALING_URL`, `VITE_ROOM_ID` |
| `vite.config.ts` | Updated: `control-center` MPA entry |
| `package.json` | Updated: `dev:signaling` script |

## Signaling Message Contract

| Type | Direction | Payload |
|------|-----------|---------|
| `HELLO` | Client → Server | `{ role, displayName }` |
| `PUBLISHER_LIST` | Server → Viewer | `{ publishers: [{ clientId, displayName, ts }] }` |
| `PUBLISHER_JOIN` | Server → All | `{ clientId, displayName, ts }` |
| `PUBLISHER_LEAVE` | Server → All | `{ clientId, ts }` |
| `SDP_OFFER` | Viewer → Publisher | `{ sdp }` |
| `SDP_ANSWER` | Publisher → Viewer | `{ sdp }` |
| `ICE_CANDIDATE` | Bidirectional | `{ candidate }` |
| `ERROR` | Server → Client | `{ message }` |

## How to Verify

### Development (full stack)

```bash
# Terminal 1: Start signaling server
npm run dev:signaling

# Terminal 2: Start Vite dev server
npm run dev

# Browser tab 1: Open publisher
# http://localhost:5173/mediapipe.html
# → Select a task → Start → Click "📡 Broadcast"

# Browser tab 2: Open Control Center
# http://localhost:5173/control-center.html
# → Should see the publisher's stream appear in the grid
```

### Production build

```bash
npm run build
# Verify output includes: dist/control-center.html
```

### Cross-device testing

1. Start signaling server and Vite on a machine accessible on the local network
2. Open `/mediapipe.html` on a phone (HTTPS required — use `vite --host`)
3. Start a vision task and enable broadcasting
4. Open `/control-center.html` on a laptop
5. The phone's camera + AI overlay should appear in the grid

## Boundaries and Dependencies

- **No cross-module imports** — Control Center and MediaPipe publisher share only `src/infrastructure/signaling/` and `src/shared/webrtc/`
- **No new npm dependencies** for the frontend — WebRTC is browser-native
- **Server dependency** — `ws` package (server-only, not bundled in frontend)
- **STUN servers** — Google public STUN (`stun.l.google.com:19302`)

## Performance Notes

- Canvas captured at 15 fps to limit bandwidth
- Default resolution: 640×480 (inherited from `useCamera`)
- MVP mesh topology: bandwidth scales linearly with publisher count on the viewer side
- For >6 publishers, an SFU is recommended

## Security Notes

- `clientId` in localStorage is a non-secret session identifier, not an auth token
- "EN VIVO" indicator shows when broadcasting is active
- 1-click stop for broadcast
- No video storage — streams are ephemeral
- Signaling server has no authentication (development only)

## Status

Implemented — MVP WebRTC P2P mesh with WebSocket signaling.

### Not Yet Implemented

- SFU support for scaling beyond 6 publishers
- Signaling server authentication
- TURN server configuration for restrictive NATs
- Reconnection handling when a publisher restarts broadcast
