import { useEffect, useRef, useState, useCallback } from "react";
import {
  SignalingClient,
  createHelloMessage,
} from "../infrastructure/signaling/index.ts";
import type {
  SignalMessage,
  PublisherInfo,
} from "../infrastructure/signaling/index.ts";
import { getOrCreateClientId } from "../shared/utils/clientId.ts";
import { createPeerConnection } from "../shared/webrtc/index.ts";
import { VideoTile } from "./VideoTile.tsx";
import "./ControlCenterPage.css";

const SIGNALING_URL =
  (import.meta.env.VITE_SIGNALING_URL as string) || "ws://localhost:8080/ws";
const ROOM_ID = (import.meta.env.VITE_ROOM_ID as string) || "default";

interface Tile {
  clientId: string;
  displayName: string;
  stream: MediaStream | null;
  status: "online" | "offline";
}

export function ControlCenterPage() {
  const [viewerId] = useState(() => getOrCreateClientId("viewer"));

  const [tiles, setTiles] = useState<Record<string, Tile>>({});
  const [signalingStatus, setSignalingStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");

  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  const signalingRef = useRef<SignalingClient | null>(null);

  const upsertTile = useCallback((info: PublisherInfo) => {
    setTiles((prev) => ({
      ...prev,
      [info.clientId]: {
        clientId: info.clientId,
        displayName: info.displayName,
        stream: prev[info.clientId]?.stream ?? null,
        status: "online",
      },
    }));
  }, []);

  const markOffline = useCallback((clientId: string) => {
    setTiles((prev) => {
      const tile = prev[clientId];
      if (!tile) return prev;
      return {
        ...prev,
        [clientId]: { ...tile, status: "offline", stream: null },
      };
    });
  }, []);

  const setStream = useCallback((clientId: string, stream: MediaStream) => {
    setTiles((prev) => {
      const tile = prev[clientId];
      if (!tile) return prev;
      return { ...prev, [clientId]: { ...tile, stream } };
    });
  }, []);

  const closePeer = useCallback((publisherId: string) => {
    const pc = peersRef.current.get(publisherId);
    if (pc) {
      pc.close();
      peersRef.current.delete(publisherId);
    }
  }, []);

  const startOffer = useCallback(
    async (publisherId: string) => {
      if (peersRef.current.has(publisherId)) return;

      const signaling = signalingRef.current;
      if (!signaling) return;

      const pc = createPeerConnection();

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        signaling.send({
          type: "ICE_CANDIDATE",
          roomId: ROOM_ID,
          from: viewerId,
          to: publisherId,
          payload: { candidate: event.candidate.toJSON() },
        });
      };

      pc.ontrack = (event) => {
        // event.streams may be empty depending on how the publisher added tracks.
        // Fall back to wrapping the track in a new MediaStream.
        const stream = event.streams[0] ?? new MediaStream([event.track]);
        setStream(publisherId, stream);
      };

      // Must add a transceiver so the offer includes media lines
      pc.addTransceiver("video", { direction: "recvonly" });

      peersRef.current.set(publisherId, pc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      signaling.send({
        type: "SDP_OFFER",
        roomId: ROOM_ID,
        from: viewerId,
        to: publisherId,
        payload: { sdp: offer.sdp ?? "" },
      });
    },
    [viewerId, setStream],
  );

  const handleMessage = useCallback(
    async (msg: SignalMessage) => {
      switch (msg.type) {
        case "PUBLISHER_LIST": {
          for (const pub of msg.payload.publishers) {
            upsertTile(pub);
            await startOffer(pub.clientId);
          }
          break;
        }
        case "PUBLISHER_JOIN": {
          upsertTile(msg.payload);
          await startOffer(msg.payload.clientId);
          break;
        }
        case "PUBLISHER_LEAVE": {
          markOffline(msg.payload.clientId);
          closePeer(msg.payload.clientId);
          break;
        }
        case "SDP_ANSWER": {
          if (msg.to !== viewerId) break;
          const pc = peersRef.current.get(msg.from);
          if (pc)
            await pc.setRemoteDescription({
              type: "answer",
              sdp: msg.payload.sdp,
            });
          break;
        }
        case "ICE_CANDIDATE": {
          if (msg.to !== viewerId) break;
          const pc = peersRef.current.get(msg.from);
          if (pc) await pc.addIceCandidate(msg.payload.candidate);
          break;
        }
      }
    },
    [viewerId, upsertTile, startOffer, markOffline, closePeer],
  );

  // Connect to signaling server
  // All callback deps (upsertTile, startOffer, etc.) have stable identities,
  // so handleMessage is stable and this effect runs once on mount.
  useEffect(() => {
    const signaling = new SignalingClient({
      url: SIGNALING_URL,
      onOpen: () => {
        setSignalingStatus("connected");
        signaling.send(
          createHelloMessage(ROOM_ID, viewerId, "viewer", "Control Center"),
        );
      },
      onClose: () => setSignalingStatus("disconnected"),
      onMessage: (msg) => {
        void handleMessage(msg);
      },
    });

    signalingRef.current = signaling;
    signaling.connect();

    const peers = peersRef.current;
    return () => {
      signaling.close();
      signalingRef.current = null;
      peers.forEach((pc) => pc.close());
      peers.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerId]);

  const tileList = Object.values(tiles);
  const onlineCount = tileList.filter((t) => t.status === "online").length;

  return (
    <div className="control-center">
      <a href="/" className="back-link">
        ← Back to demos
      </a>
      <h1>Control Center</h1>
      <p className="subtitle">Live feeds from connected MediaPipe publishers</p>

      <div className="status-row">
        <span className={`signal-badge ${signalingStatus}`}>
          {signalingStatus === "connected"
            ? "🟢"
            : signalingStatus === "connecting"
              ? "🟡"
              : "🔴"}{" "}
          {signalingStatus}
        </span>
        <span className="info-badge">Room: {ROOM_ID}</span>
        <span className="info-badge">Publishers: {onlineCount}</span>
      </div>

      {tileList.length === 0 ? (
        <div className="empty-state">
          <p>No publishers connected yet.</p>
          <p className="hint">
            Open <a href="/mediapipe.html">/mediapipe.html</a> on another
            device, start a task, and enable broadcasting.
          </p>
        </div>
      ) : (
        <div className="tile-grid">
          {tileList.map((tile) => (
            <div key={tile.clientId} className={`tile ${tile.status}`}>
              {/* Status badge — absolute top-right corner of the tile card */}
              <span className={`tile-status ${tile.status}`}>
                {tile.status}
              </span>

              {/* Video fills the entire tile card */}
              <div className="tile-viewport">
                <VideoTile stream={tile.stream} />
              </div>

              {/* Metadata overlay — gradient from bottom */}
              <div className="tile-header">
                <div>
                  <div className="tile-name">{tile.displayName}</div>
                  <div className="tile-id">{tile.clientId.slice(0, 8)}…</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
