import { useRef, useCallback } from 'react'
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'
import {
  clearCanvas,
  syncCanvasSize,
  drawBoundingBox,
  drawLandmarks,
} from '../shared/drawingUtils.ts'
import { TASK_META } from '../shared/types.ts'

export function useFaceDetection() {
  const detectorRef = useRef<FaceDetector | null>(null)
  const rafRef = useRef<number>(0)

  const init = useCallback(async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    )
    detectorRef.current = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: TASK_META['face-detection'].modelUrl,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
    })
  }, [])

  const detect = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d')
      if (!ctx || !detectorRef.current) return

      const loop = () => {
        if (!detectorRef.current || video.paused || video.ended) return
        syncCanvasSize(canvas, video)
        clearCanvas(ctx)

        const result = detectorRef.current.detectForVideo(
          video,
          performance.now(),
        )

        for (const detection of result.detections) {
          if (detection.boundingBox) {
            const score = detection.categories?.[0]?.score ?? 0
            const label = `Face ${Math.round(score * 100)}%`
            drawBoundingBox(ctx, detection.boundingBox, label, '#00FF00')
          }
          if (detection.keypoints) {
            drawLandmarks(
              ctx,
              detection.keypoints.map((kp) => ({ x: kp.x, y: kp.y })),
              '#FF0000',
              3,
            )
          }
        }

        rafRef.current = requestAnimationFrame(loop)
      }
      loop()
    },
    [],
  )

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    detectorRef.current?.close()
    detectorRef.current = null
  }, [])

  return { init, detect, cleanup }
}
