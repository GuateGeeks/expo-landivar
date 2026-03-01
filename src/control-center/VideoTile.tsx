import { useEffect, useRef } from 'react'

interface VideoTileProps {
  stream: MediaStream | null
}

/**
 * Renders a remote MediaStream in a <video> element.
 * Binds srcObject reactively when the stream changes.
 */
export function VideoTile({ stream }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.srcObject = stream
  }, [stream])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="tile-video"
    />
  )
}
