import { useRef, useCallback } from 'react'
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from '@mediapipe/tasks-vision'
import { clearCanvas, syncCanvasSize } from '../shared/drawingUtils.ts'
import { TASK_META } from '../shared/types.ts'

export function useFaceLandmark() {
  const landmarkerRef = useRef<FaceLandmarker | null>(null)
  const rafRef = useRef<number>(0)

  const init = useCallback(async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    )
    landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: TASK_META['face-landmark'].modelUrl,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numFaces: 2,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
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

        const result = landmarkerRef.current.detectForVideo(
          video,
          performance.now(),
        )

        for (const landmarks of result.faceLandmarks) {
          drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_TESSELATION,
            { color: '#C0C0C070', lineWidth: 1 },
          )
          drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
            { color: '#30FF30' },
          )
          drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
            { color: '#30FF30' },
          )
          drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
            { color: '#E0E0E0' },
          )
          drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_LIPS,
            { color: '#FF3030' },
          )
          drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
            { color: '#30FF30' },
          )
          drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
            { color: '#30FF30' },
          )
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
