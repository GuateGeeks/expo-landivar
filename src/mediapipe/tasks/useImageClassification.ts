import { useRef, useCallback } from 'react'
import { ImageClassifier, FilesetResolver } from '@mediapipe/tasks-vision'
import {
  clearCanvas,
  syncCanvasSize,
  drawVideoFrame,
  drawTextOverlay,
} from '../shared/drawingUtils.ts'
import { TASK_META } from '../shared/types.ts'

export function useImageClassification() {
  const classifierRef = useRef<ImageClassifier | null>(null)
  const rafRef = useRef<number>(0)

  const init = useCallback(async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    )
    classifierRef.current = await ImageClassifier.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: TASK_META['image-classification'].modelUrl,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      maxResults: 5,
    })
  }, [])

  const detect = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d')
      if (!ctx || !classifierRef.current) return

      const loop = () => {
        if (!classifierRef.current || video.paused || video.ended) return
        syncCanvasSize(canvas, video)
        clearCanvas(ctx)
        drawVideoFrame(ctx, video)

        const result = classifierRef.current.classifyForVideo(
          video,
          performance.now(),
        )

        const lines: string[] = []
        if (result.classifications.length > 0) {
          const categories = result.classifications[0].categories
          for (const cat of categories) {
            lines.push(
              `${cat.categoryName}: ${Math.round(cat.score * 100)}%`,
            )
          }
        }
        if (lines.length > 0) {
          drawTextOverlay(ctx, lines)
        }

        rafRef.current = requestAnimationFrame(loop)
      }
      loop()
    },
    [],
  )

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    classifierRef.current?.close()
    classifierRef.current = null
  }, [])

  return { init, detect, cleanup }
}
