import { useRef, useState, useCallback, useEffect } from 'react'
import {
  SignalingClient,
  createHelloMessage,
} from '../../infrastructure/signaling/index.ts'
import type { SignalMessage } from '../../infrastructure/signaling/index.ts'
import { getOrCreateClientId } from '../../shared/utils/clientId.ts'
import { createPeerConnection } from '../../shared/webrtc/index.ts'

const SIGNALING_URL = (import.meta.env.VITE_SIGNALING_URL as string) || 'ws://localhost:8080/ws'
const ROOM_ID = (import.meta.env.VITE_ROOM_ID as string) || 'default'

export interface BroadcastState {
  /** Whether the broadcast is currently active */
  isBroadcasting: boolean
  /** Number of connected viewers */
  viewerCount: number
  /** Signaling connection status */
  signalingStatus: 'disconnected' | 'connecting' | 'connected'
  /** Display name shown to viewers */
  displayName: string
  /** Update display name */
  setDisplayName: (name: string) => void
  /** Start broadcasting the canvas stream */
  startBroadcast: (canvas: HTMLCanvasElement) => void
  /** Stop broadcasting and disconnect */
  stopBroadcast: () => void
}

/**
 * Hook that manages WebRTC publishing of a canvas stream to the Control Center.
 *
 * Connects to the signaling server as a "publisher" role.
 * When a viewer sends an SDP offer, creates a peer connection,
 * adds the canvas stream tracks, and sends back an SDP answer.
 */
export function useBroadcast(): BroadcastState {
  const clientIdRef = useRef(getOrCreateClientId())
  const clientId = clientIdRef.current

  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [signalingStatus, setSignalingStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [displayName, setDisplayName] = useState('Publisher')

  const signalingRef = useRef<SignalingClient | null>(null)
  const peersRef = useRef(new Map<string, RTCPeerConnection>())
  const outStreamRef = useRef<MediaStream | null>(null)

  const updateViewerCount = useCallback(() => {
    setViewerCount(peersRef.current.size)
  }, [])

  const ensurePeer = useCallback((viewerId: string): RTCPeerConnection => {
    const existing = peersRef.current.get(viewerId)
    if (existing) return existing

    const signaling = signalingRef.current
    const pc = createPeerConnection()

    pc.onicecandidate = (event) => {
      if (!event.candidate || !signaling) return
      signaling.send({
        type: 'ICE_CANDIDATE',
        roomId: ROOM_ID,
        from: clientId,
        to: viewerId,
        payload: { candidate: event.candidate.toJSON() },
      })
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        peersRef.current.delete(viewerId)
        updateViewerCount()
      }
    }

    // Add outgoing stream tracks if available
    const stream = outStreamRef.current
    if (stream) {
      for (const track of stream.getTracks()) {
        pc.addTrack(track, stream)
      }
    }

    peersRef.current.set(viewerId, pc)
    updateViewerCount()
    return pc
  }, [clientId, updateViewerCount])

  const handleMessage = useCallback(async (msg: SignalMessage) => {
    if (msg.type === 'SDP_OFFER' && 'to' in msg && msg.to === clientId) {
      const viewerId = msg.from
      const pc = ensurePeer(viewerId)

      await pc.setRemoteDescription({ type: 'offer', sdp: msg.payload.sdp })
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      signalingRef.current?.send({
        type: 'SDP_ANSWER',
        roomId: ROOM_ID,
        from: clientId,
        to: viewerId,
        payload: { sdp: answer.sdp ?? '' },
      })
    }

    if (msg.type === 'ICE_CANDIDATE' && 'to' in msg && msg.to === clientId) {
      const pc = peersRef.current.get(msg.from)
      if (pc) await pc.addIceCandidate(msg.payload.candidate)
    }
  }, [clientId, ensurePeer])

  const startBroadcast = useCallback((canvas: HTMLCanvasElement) => {
    // Capture the canvas stream at 15fps
    const stream = canvas.captureStream(15)
    outStreamRef.current = stream

    // Connect to signaling
    const signaling = new SignalingClient({
      url: SIGNALING_URL,
      onOpen: () => {
        setSignalingStatus('connected')
        signaling.send(createHelloMessage(ROOM_ID, clientId, 'publisher', displayName))
      },
      onClose: () => setSignalingStatus('disconnected'),
      onMessage: (msg) => { void handleMessage(msg) },
    })

    signalingRef.current = signaling
    setSignalingStatus('connecting')
    signaling.connect()
    setIsBroadcasting(true)
  }, [clientId, displayName, handleMessage])

  const stopBroadcast = useCallback(() => {
    // Close all peer connections
    peersRef.current.forEach((pc) => pc.close())
    peersRef.current.clear()
    setViewerCount(0)

    // Stop the captured stream
    outStreamRef.current?.getTracks().forEach((t) => t.stop())
    outStreamRef.current = null

    // Disconnect signaling
    signalingRef.current?.close()
    signalingRef.current = null
    setSignalingStatus('disconnected')

    setIsBroadcasting(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    const peers = peersRef.current
    const outStream = outStreamRef.current
    const signaling = signalingRef.current
    return () => {
      peers.forEach((pc) => pc.close())
      peers.clear()
      outStream?.getTracks().forEach((t) => t.stop())
      signaling?.close()
    }
  }, [])

  return {
    isBroadcasting,
    viewerCount,
    signalingStatus,
    displayName,
    setDisplayName,
    startBroadcast,
    stopBroadcast,
  }
}
