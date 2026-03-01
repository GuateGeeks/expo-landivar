import { useRef, useCallback, useState } from 'react'
import {
  InteractiveSegmenter,
  FilesetResolver,
} from '@mediapipe/tasks-vision'
import { TASK_META } from '../shared/types.ts'

export function useInteractiveSegmentation() {
  const segmenterRef = useRef<InteractiveSegmenter | null>(null)
  const [capturedImage, setCapturedImage] = useState<HTMLCanvasElement | null>(
    null,
  )

  const init = useCallback(async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    )
    segmenterRef.current = await InteractiveSegmenter.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath: TASK_META['interactive-segmentation'].modelUrl,
          delegate: 'GPU',
        },
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      },
    )
  }, [])

  const captureFrame = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(video, 0, 0)
      setCapturedImage(canvas)
    },
    [],
  )

  const segmentAtPoint = useCallback(
    (
      canvas: HTMLCanvasElement,
      normalizedX: number,
      normalizedY: number,
    ) => {
      if (!segmenterRef.current || !capturedImage) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Redraw the captured frame first
      ctx.drawImage(capturedImage, 0, 0)

      segmenterRef.current.segment(
        capturedImage,
        { keypoint: { x: normalizedX, y: normalizedY } },
        (result) => {
          if (!result.confidenceMasks || result.confidenceMasks.length === 0)
            return

          const mask = result.confidenceMasks[0].getAsFloat32Array()
          const width = result.confidenceMasks[0].width
          const height = result.confidenceMasks[0].height
          const imageData = ctx.createImageData(width, height)

          // Draw captured image as base
          ctx.drawImage(capturedImage, 0, 0)

          // Create mask overlay
          const overlayCanvas = document.createElement('canvas')
          overlayCanvas.width = width
          overlayCanvas.height = height
          const overlayCtx = overlayCanvas.getContext('2d')
          if (!overlayCtx) return

          for (let i = 0; i < mask.length; i++) {
            const confidence = mask[i]
            imageData.data[i * 4] = 255
            imageData.data[i * 4 + 1] = 0
            imageData.data[i * 4 + 2] = 255
            imageData.data[i * 4 + 3] = Math.round(confidence * 180)
          }
          overlayCtx.putImageData(imageData, 0, 0)

          // Composite overlay onto main canvas
          ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height)

          // Draw click point
          ctx.fillStyle = '#FFFF00'
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(
            normalizedX * canvas.width,
            normalizedY * canvas.height,
            8,
            0,
            2 * Math.PI,
          )
          ctx.fill()
          ctx.stroke()

          for (const mask of result.confidenceMasks ?? []) {
            mask.close()
          }
        },
      )
    },
    [capturedImage],
  )

  const detect = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      // For interactive segmentation, we capture a single frame
      // and then handle clicks. The "detect" call captures the frame.
      captureFrame(video, canvas)
    },
    [captureFrame],
  )

  const cleanup = useCallback(() => {
    setCapturedImage(null)
    segmenterRef.current?.close()
    segmenterRef.current = null
  }, [])

  return {
    init,
    detect,
    cleanup,
    capturedImage,
    segmentAtPoint,
    captureFrame,
  }
}
