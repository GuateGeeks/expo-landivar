import { useRef, useCallback } from 'react'
import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
} from '@mediapipe/tasks-vision'
import { clearCanvas, syncCanvasSize, drawVideoFrame } from '../shared/drawingUtils.ts'
import { TASK_META } from '../shared/types.ts'

export function useHandLandmark() {
  const landmarkerRef = useRef<HandLandmarker | null>(null)
  const rafRef = useRef<number>(0)

  const init = useCallback(async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    )
    landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: TASK_META['hand-landmark'].modelUrl,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
    })
  }, [])

  const detect = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d')
      if (!ctx || !landmarkerRef.current) return

      const drawingUtils = new DrawingUtils(ctx)

      const loop = () => {
        if (!landmarkerRef.current || video.paused || video.ended) return
        syncCanvasSize(canvas, video)
        clearCanvas(ctx)
        drawVideoFrame(ctx, video)

        const result = landmarkerRef.current.detectForVideo(
          video,
          performance.now(),
        )

        for (const landmarks of result.landmarks) {
          drawingUtils.drawConnectors(
            landmarks,
            HandLandmarker.HAND_CONNECTIONS,
            { color: '#00FF00', lineWidth: 3 },
          )
          drawingUtils.drawLandmarks(landmarks, {
            color: '#FF0000',
            lineWidth: 1,
            radius: 3,
          })
        }

        rafRef.current = requestAnimationFrame(loop)
      }
      loop()
    },
    [],
  )

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    landmarkerRef.current?.close()
    landmarkerRef.current = null
  }, [])

  return { init, detect, cleanup }
}
