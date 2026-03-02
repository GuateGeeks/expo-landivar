import { useRef, useCallback } from 'react'
import { ObjectDetector, FilesetResolver } from '@mediapipe/tasks-vision'
import {
  clearCanvas,
  syncCanvasSize,
  drawVideoFrame,
  drawBoundingBox,
} from '../shared/drawingUtils.ts'
import { TASK_META } from '../shared/types.ts'

export function useObjectDetection() {
  const detectorRef = useRef<ObjectDetector | null>(null)
  const rafRef = useRef<number>(0)

  const init = useCallback(async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    )
    detectorRef.current = await ObjectDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: TASK_META['object-detection'].modelUrl,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      maxResults: 5,
      scoreThreshold: 0.3,
    })
  }, [])

  const detect = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d')
      if (!ctx || !detectorRef.current) return

      const COLORS = ['#FF6633', '#33FF66', '#3366FF', '#FF33FF', '#FFFF33']

      const loop = () => {
        if (!detectorRef.current || video.paused || video.ended) return
        syncCanvasSize(canvas, video)
        clearCanvas(ctx)
        drawVideoFrame(ctx, video)

        const result = detectorRef.current.detectForVideo(
          video,
          performance.now(),
        )

        for (let i = 0; i < result.detections.length; i++) {
          const detection = result.detections[i]
          if (!detection.boundingBox) continue
          const category = detection.categories[0]
          const label = category
            ? `${category.categoryName} ${Math.round(category.score * 100)}%`
            : undefined
          const color = COLORS[i % COLORS.length]
          drawBoundingBox(ctx, detection.boundingBox, label, color)
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
