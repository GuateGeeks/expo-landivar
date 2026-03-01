import { useRef, useState, useCallback, useEffect } from 'react'

export interface CameraState {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isStreaming: boolean
  error: string | null
  start: () => Promise<void>
  stop: () => void
}

export function useCamera(): CameraState {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stop = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop()
      }
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
  }, [])

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsStreaming(true)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera access denied'
      setError(message)
      setIsStreaming(false)
    }
  }, [])

  useEffect(() => {
    return stop
  }, [stop])

  return { videoRef, isStreaming, error, start, stop }
}
