import { useRef, useCallback } from 'react'
import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils,
} from '@mediapipe/tasks-vision'
import {
  clearCanvas,
  syncCanvasSize,
  drawVideoFrame,
  drawTextOverlay,
} from '../shared/drawingUtils.ts'
import { TASK_META } from '../shared/types.ts'

export function useGestureRecognition() {
  const recognizerRef = useRef<GestureRecognizer | null>(null)
  const rafRef = useRef<number>(0)

  const init = useCallback(async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    )
    recognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: TASK_META['gesture-recognition'].modelUrl,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
    })
  }, [])

  const detect = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d')
      if (!ctx || !recognizerRef.current) return

      const drawingUtils = new DrawingUtils(ctx)

      const loop = () => {
        if (!recognizerRef.current || video.paused || video.ended) return
        syncCanvasSize(canvas, video)
        clearCanvas(ctx)
        drawVideoFrame(ctx, video)

        const result = recognizerRef.current.recognizeForVideo(
          video,
          performance.now(),
        )

        // Draw hand landmarks
        for (const landmarks of result.landmarks) {
          drawingUtils.drawConnectors(
            landmarks,
            GestureRecognizer.HAND_CONNECTIONS,
            { color: '#00FF00', lineWidth: 3 },
          )
          drawingUtils.drawLandmarks(landmarks, {
            color: '#FF0000',
            lineWidth: 1,
            radius: 3,
          })
        }

        // Show recognized gestures
        const lines: string[] = []
        for (let i = 0; i < result.gestures.length; i++) {
          const gesture = result.gestures[i][0]
          const handedness = result.handednesses[i][0]
          if (gesture && handedness) {
            lines.push(
              `${handedness.categoryName}: ${gesture.categoryName} (${Math.round(gesture.score * 100)}%)`,
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
    recognizerRef.current?.close()
    recognizerRef.current = null
  }, [])

  return { init, detect, cleanup }
}
